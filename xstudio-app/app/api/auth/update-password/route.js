import { requireOwner, json } from '../../../../lib/xstudio-server';
import { isTrustedOrigin } from '../../../../lib/xstudio-validation.mjs';
import { RECOVERY_COOKIE, verifyRecoveryGrant } from '../../../../lib/xstudio-recovery.mjs';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const context = await requireOwner();
  if (context.response) return context.response;
  const claims = await context.client.auth.getClaims();
  const token = (await cookies()).get(RECOVERY_COOKIE)?.value;
  if (claims.error || !verifyRecoveryGrant(token, context.user.id, claims.data?.claims?.session_id)) return json({ error: 'A recent recovery link is required.' }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const password = typeof body?.password === 'string' ? body.password : '';
  if (password.length < 12 || password.length > 1024) return json({ error: 'Use a password of at least 12 characters.' }, 400);
  const { error } = await context.client.auth.updateUser({ password });
  if (error) return json({ error: 'Password update failed. Please try again.' }, 502);
  await context.client.auth.signOut();
  const response = json({ ok: true });
  response.cookies.set(RECOVERY_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
