import { NextResponse } from 'next/server';
import { progressSecret, sameOrigin, startFamilySession } from '../../../../../lib/progress';
import { cleanName, normalizeEmail, verifyToken } from '../../../../../lib/progress-family.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Owner invite links: whoever opens one within 7 days joins with their name and email.
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const raw = await request.json().catch(() => ({}));
  if (!verifyToken(raw.invite, 'invite', progressSecret())) return NextResponse.json({ error: 'This link has expired. Just send a text to Trav for a new one.' }, { status: 400 });
  const email = normalizeEmail(raw.email);
  const name = cleanName(raw.name);
  if (!email || !name) return NextResponse.json({ error: 'Enter your name and a valid email address.' }, { status: 400 });
  let cookie;
  try { cookie = await startFamilySession({ email, name }); }
  catch { return NextResponse.json({ error: 'Sign-in is unavailable right now.' }, { status: 503 }); }
  if (!cookie) return NextResponse.json({ error: 'This email cannot join. Please contact Travis.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
