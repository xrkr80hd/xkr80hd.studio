import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabase-admin';
import { COMMUNITY_BUCKET, MEMBER_COOKIE, MEMBER_SESSION_SECONDS } from './community-rules.mjs';

export { COMMUNITY_BUCKET, MEMBER_COOKIE, MEMBER_SESSION_SECONDS };

const SIGNED_URL_SECONDS = 60 * 60;

function memberSecret() {
  const base = process.env.COMMUNITY_SESSION_SECRET || process.env.ADMIN_SESSION_TOKEN || '';
  return base ? `yourlocal-member:${base}` : '';
}

function sign(payload) {
  return createHmac('sha256', memberSecret()).update(payload).digest('hex');
}

export function makeMemberSession(memberId, nowMs = Date.now()) {
  if (!memberSecret() || !/^[0-9a-f-]{36}$/i.test(String(memberId || ''))) return '';
  const expiresAt = Math.floor(nowMs / 1000) + MEMBER_SESSION_SECONDS;
  const payload = `m1~${memberId}~${expiresAt}`;
  return `${payload}~${sign(payload)}`;
}

export function readMemberSession(value, nowMs = Date.now()) {
  if (!memberSecret()) return '';
  const parts = String(value || '').split('~');
  if (parts.length !== 4 || parts[0] !== 'm1') return '';
  const [, memberId, expiresRaw, signature] = parts;
  const expiresAt = Number.parseInt(expiresRaw, 10);
  if (!/^[0-9a-f-]{36}$/i.test(memberId) || !Number.isFinite(expiresAt) || expiresAt * 1000 < nowMs) return '';
  const expected = Buffer.from(sign(`m1~${memberId}~${expiresAt}`));
  const given = Buffer.from(String(signature));
  return expected.length === given.length && timingSafeEqual(expected, given) ? memberId : '';
}

export function memberCookieOptions(value, maxAge = MEMBER_SESSION_SECONDS) {
  return { name: MEMBER_COOKIE, value, httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge };
}

export function getCommunityDb() {
  return getSupabaseAdmin();
}

// A plain (anon key) client, used only to ask Supabase Auth to email a sign-in link
// and to check the access token that link hands back.
export function getCommunityAuthClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'implicit' } });
}

export function isCommunityConfigured() {
  return Boolean(getCommunityDb() && getCommunityAuthClient() && memberSecret());
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

export function siteOrigin(request) {
  const configured = process.env.COMMUNITY_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  return new URL(request.url).origin;
}

export function isMissingCommunityTable(error) {
  const message = String(error?.message || '');
  return message.includes('community_') && (message.includes('Could not find the table') || message.includes('does not exist'));
}

export async function getMemberById(memberId) {
  const db = getCommunityDb();
  if (!db || !memberId) return { member: null, setupNeeded: !db };
  const { data, error } = await db.from('community_members').select('*').eq('id', memberId).maybeSingle();
  if (error) return { member: null, setupNeeded: isMissingCommunityTable(error), error: error.message };
  if (data?.status === 'banned') return { member: null, setupNeeded: false };
  return { member: data || null, setupNeeded: false };
}

// Who is signed in, from a cookie jar (next/headers cookies() or request.cookies).
export async function getSignedInMember(jar) {
  const memberId = readMemberSession(jar?.get?.(MEMBER_COOKIE)?.value);
  if (!memberId) return { member: null, setupNeeded: false };
  return getMemberById(memberId);
}

export async function listMemberMedia(memberId, { withUrls = false } = {}) {
  const db = getCommunityDb();
  if (!db || !memberId) return [];
  const { data, error } = await db
    .from('community_media')
    .select('id, kind, title, storage_path, mime_type, size_bytes, created_at')
    .eq('member_id', memberId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  if (!withUrls || !data.length) return data;

  const signed = await db.storage.from(COMMUNITY_BUCKET).createSignedUrls(data.map((item) => item.storage_path), SIGNED_URL_SECONDS);
  const urlByPath = new Map((signed.data || []).map((item) => [item.path, item.signedUrl]));
  return data.map((item) => ({ ...item, url: urlByPath.get(item.storage_path) || '' }));
}

export async function signedUrlFor(path) {
  const db = getCommunityDb();
  if (!db || !path) return '';
  const { data } = await db.storage.from(COMMUNITY_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  return data?.signedUrl || '';
}
