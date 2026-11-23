import { NextResponse } from 'next/server';
import { memberCookieOptions, sameOrigin } from '../../../../../lib/community';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(memberCookieOptions('', 0));
  return response;
}
