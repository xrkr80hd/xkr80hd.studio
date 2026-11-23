import { NextResponse } from 'next/server';
import { FAMILY_COOKIE, sameOrigin } from '../../../../../lib/progress';

export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(FAMILY_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
