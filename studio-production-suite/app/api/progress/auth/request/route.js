import { NextResponse } from 'next/server';
import { emailConfigured, getProgressDb, progressSecret, sameOrigin, sendSignInEmail, siteOrigin } from '../../../../../lib/progress';
import { cleanName, makeLinkToken, normalizeEmail } from '../../../../../lib/progress-family.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESEND_WAIT_MS = 60 * 1000;

// Emails a one-hour sign-in link to family who already joined.
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  if (!emailConfigured() || !progressSecret()) return NextResponse.json({ error: 'Email sign-in is not set up yet. Ask Travis for an invite link.' }, { status: 503 });
  const raw = await request.json().catch(() => ({}));
  const email = normalizeEmail(raw.email);
  const name = cleanName(raw.name);
  if (!email) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'Enter your name so family knows who you are.' }, { status: 400 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Sign-in is unavailable right now.' }, { status: 503 });
  const { data: member } = await db.from('progress_members').select('blocked, last_link_sent_at, verified_at').eq('email', email).maybeSingle();
  if (member?.blocked) return NextResponse.json({ ok: true });
  // Invite-only: email links are for family who already joined through Travis's invite link (e.g. on a new device).
  if (!member?.verified_at) return NextResponse.json({ error: "This email isn't on the family list yet. Ask Travis for an invite link." }, { status: 403 });
  if (member?.last_link_sent_at && Date.now() - new Date(member.last_link_sent_at).getTime() < RESEND_WAIT_MS) {
    return NextResponse.json({ error: 'A link was just sent. Check your inbox (and spam), or try again in a minute.' }, { status: 429 });
  }
  const now = new Date().toISOString();
  const row = { email, last_link_sent_at: now };
  const saved = await db.from('progress_members').upsert(row, { onConflict: 'email' });
  if (saved.error) return NextResponse.json({ error: 'Sign-in is unavailable right now.' }, { status: 503 });
  const link = `${siteOrigin(request)}/api/progress/auth/verify?t=${encodeURIComponent(makeLinkToken({ email, name }, progressSecret()))}`;
  try { await sendSignInEmail({ to: email, link }); }
  catch { return NextResponse.json({ error: 'The email could not be sent. Please try again.' }, { status: 502 }); }
  return NextResponse.json({ ok: true });
}
