import { NextResponse } from 'next/server';
import { progressOwner, progressSecret, sameOrigin, siteOrigin } from '../../../../../lib/progress';
import { makeInviteToken } from '../../../../../lib/progress-family.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A 7-day invite link the owner can text to family; it skips the email step.
export async function POST(request) {
  if (!progressOwner(request) || !sameOrigin(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const secret = progressSecret();
  if (!secret) return NextResponse.json({ error: 'Sign-in secret is not configured.' }, { status: 503 });
  return NextResponse.json({ link: `${siteOrigin(request)}/progress?invite=${encodeURIComponent(makeInviteToken(secret))}` });
}
