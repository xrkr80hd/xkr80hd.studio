import { NextResponse } from 'next/server';
import { progressSecret, startFamilySession } from '../../../../../lib/progress';
import { verifyToken } from '../../../../../lib/progress-family.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Opened from the emailed link: confirms the address and signs this device in for 30 days.
export async function GET(request) {
  const url = new URL(request.url);
  const target = new URL('/progress', url.origin);
  const payload = verifyToken(url.searchParams.get('t'), 'link', progressSecret());
  if (!payload) {
    target.searchParams.set('signin', 'expired');
    return NextResponse.redirect(target, 303);
  }
  let cookie;
  try { cookie = await startFamilySession({ email: payload.e, name: payload.n }); }
  catch { target.searchParams.set('signin', 'error'); return NextResponse.redirect(target, 303); }
  if (!cookie) { target.searchParams.set('signin', 'blocked'); return NextResponse.redirect(target, 303); }
  target.searchParams.set('signin', 'welcome');
  const response = NextResponse.redirect(target, 303);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
