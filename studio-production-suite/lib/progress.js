import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_USER_COOKIE, isAdminSessionValid, isOwnerUsername, getAdminSessionUser } from './admin-auth';
import { getGleauxDb } from './gleaux';
import { PROGRESS_BUCKET } from './progress-validation.mjs';
import { FAMILY_COOKIE, SESSION_SECONDS, makeSessionToken, verifyToken } from './progress-family.mjs';

export { PROGRESS_BUCKET, FAMILY_COOKIE };

const PHOTO_URL_SECONDS = 60 * 60 * 6;

export function progressSecret() {
  return process.env.PROGRESS_FAMILY_SECRET || process.env.ADMIN_SESSION_TOKEN || '';
}

export function isOwnerCookies(jar) {
  return isAdminSessionValid(jar.get(ADMIN_SESSION_COOKIE)?.value) && isOwnerUsername(getAdminSessionUser(jar.get(ADMIN_SESSION_COOKIE)?.value));
}

export function progressOwner(request) {
  return isOwnerCookies(request.cookies);
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

// Uncached client: a new update must show on the next page load.
export function getProgressDb() {
  return getGleauxDb();
}

export function siteOrigin(request) {
  const configured = process.env.PROGRESS_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  return new URL(request.url).origin;
}

export async function getProgressSettings() {
  const db = getProgressDb();
  if (!db) throw new Error('Progress storage is unavailable.');
  const { data, error } = await db.from('progress_settings').select('require_signin').eq('id', 1).single();
  if (error) throw new Error('Could not load settings.');
  return data;
}

// The signed-in family member for this cookie jar, or null. Blocked members are refused.
export async function getFamilyMember(jar) {
  const payload = verifyToken(jar.get(FAMILY_COOKIE)?.value, 'session', progressSecret());
  if (!payload) return null;
  const db = getProgressDb();
  if (!db) return null;
  const { data } = await db.from('progress_members').select('email, name, blocked, verified_at').eq('email', payload.e).maybeSingle();
  if (!data || data.blocked || !data.verified_at) return null;
  return { email: data.email, name: data.name };
}

// Marks the member verified and returns a cookie spec for a 30-day session.
export async function startFamilySession({ email, name }) {
  const db = getProgressDb();
  if (!db) throw new Error('Progress storage is unavailable.');
  const { data: existing } = await db.from('progress_members').select('email, name, blocked').eq('email', email).maybeSingle();
  if (existing?.blocked) return null;
  const now = new Date().toISOString();
  const row = { email, name: name || existing?.name || '', verified_at: now, last_seen_at: now };
  const { error } = await db.from('progress_members').upsert(row, { onConflict: 'email' });
  if (error) throw new Error('Could not sign in.');
  return {
    name: FAMILY_COOKIE,
    value: makeSessionToken(email, progressSecret()),
    options: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS },
  };
}

export async function listProgressPosts({ withComments = false, viewerEmail = '' } = {}) {
  const db = getProgressDb();
  if (!db) throw new Error('Progress storage is unavailable.');
  const { data, error } = await db
    .from('progress_posts')
    .select('id, title, body, photo_paths, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error('Could not load updates.');
  const posts = data || [];
  const paths = [...new Set(posts.flatMap(post => post.photo_paths || []))];
  const urls = new Map();
  if (paths.length) {
    const signed = await db.storage.from(PROGRESS_BUCKET).createSignedUrls(paths, PHOTO_URL_SECONDS);
    for (const item of signed.data || []) if (item.signedUrl && item.path) urls.set(item.path, item.signedUrl);
  }
  const comments = new Map();
  if (withComments && posts.length) {
    const { data: rows } = await db
      .from('progress_comments')
      .select('id, post_id, member_email, author_name, body, created_at')
      .in('post_id', posts.map(post => post.id))
      .order('created_at', { ascending: true });
    for (const row of rows || []) {
      if (!comments.has(row.post_id)) comments.set(row.post_id, []);
      comments.get(row.post_id).push(row);
    }
  }
  // Reactions are optional: if their table isn't set up yet, the page simply hides them.
  let reactions = null;
  if (withComments && posts.length) {
    const { data: rows, error: reactionError } = await db
      .from('progress_reactions')
      .select('post_id, member_email, emoji')
      .in('post_id', posts.map(post => post.id));
    if (!reactionError) {
      reactions = new Map();
      for (const row of rows || []) {
        const entry = reactions.get(row.post_id) || { counts: {}, mine: [] };
        entry.counts[row.emoji] = (entry.counts[row.emoji] || 0) + 1;
        if (viewerEmail && row.member_email === viewerEmail) entry.mine.push(row.emoji);
        reactions.set(row.post_id, entry);
      }
    }
  }
  return posts.map(post => ({
    reactions: reactions ? reactions.get(post.id) || { counts: {}, mine: [] } : null,
    ...post,
    photos: (post.photo_paths || []).map(path => ({ path, url: urls.get(path) || '' })).filter(photo => photo.url),
    comments: comments.get(post.id) || [],
  }));
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.PROGRESS_EMAIL_FROM);
}

export async function sendSignInEmail({ to, link }) {
  const text = `Here is your link to the Progress page:\n\n${link}\n\nIt works for the next hour and keeps you signed in on this device for 30 days.\n\nIf you didn't ask for this, you can ignore this email.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1b1a14;max-width:480px">
<p>Here is your link to the Progress page.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 22px;background:#fff44f;color:#1a1700;font-weight:bold;text-decoration:none;border-radius:999px">Open Progress</a></p>
<p style="font-size:14px;color:#55513f">It works for the next hour and keeps you signed in on this device for 30 days. If you didn't ask for this, you can ignore this email.</p>
</div>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.PROGRESS_EMAIL_FROM, to: [to], subject: 'Your link to Progress', html, text }),
  });
  if (!response.ok) throw new Error('Email could not be sent.');
}
