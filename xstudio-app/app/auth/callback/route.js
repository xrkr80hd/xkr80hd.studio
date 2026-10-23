import { NextResponse } from 'next/server';
import { createSessionClient } from '../../../lib/xstudio-server';
import { RECOVERY_COOKIE, RECOVERY_SECONDS, recoveryReady, signRecoveryGrant } from '../../../lib/xstudio-recovery.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const code = new URL(request.url).searchParams.get('code');
  const client = await createSessionClient();
  if (client && recoveryReady() && code && code.length <= 2048) {
    const exchanged = await client.auth.exchangeCodeForSession(code);
    if (!exchanged.error) {
      const { data, error } = await client.auth.getUser();
      if (exchanged.data?.redirectType === 'recovery' && !error && data?.user?.id === process.env.XSTUDIO_OWNER_USER_ID) {
        const owner = await client.from('xstudio_owners').select('user_id').eq('user_id', data.user.id).maybeSingle();
        if (!owner.error && owner.data?.user_id === data.user.id) {
          const claims = await client.auth.getClaims();
          const sessionId = claims.data?.claims?.session_id;
          const grant = !claims.error && claims.data?.claims?.sub === data.user.id && signRecoveryGrant(data.user.id, sessionId);
          if (grant) {
            const response = NextResponse.redirect(new URL('/update-password', request.url), { status: 303, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
            response.cookies.set(RECOVERY_COOKIE, grant, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: RECOVERY_SECONDS });
            return response;
          }
        }
      }
      await client.auth.signOut();
    }
  }
  return NextResponse.redirect(new URL('/login?recovery=invalid', request.url), { status: 303, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}
