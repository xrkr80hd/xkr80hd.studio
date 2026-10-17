import { createSessionClient, json } from '../../../../lib/xstudio-server';
import { isTrustedOrigin } from '../../../../lib/xstudio-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const client = await createSessionClient();
  if (!client) return json({ error: 'XSTUDIO auth is not configured.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || email.length > 320 || !password || password.length > 1024) return json({ error: 'Invalid credentials.' }, 400);
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data?.user) return json({ error: 'Invalid credentials.' }, 401);
  const verified = await client.auth.getUser();
  if (verified.error || verified.data?.user?.id !== process.env.XSTUDIO_OWNER_USER_ID) {
    await client.auth.signOut();
    return json({ error: 'Owner access required.' }, 403);
  }
  const owner = await client.from('xstudio_owners').select('user_id').eq('user_id', verified.data.user.id).maybeSingle();
  if (owner.error || owner.data?.user_id !== verified.data.user.id) {
    await client.auth.signOut();
    return json({ error: 'Owner access is not provisioned.' }, 403);
  }
  return json({ user: { id: verified.data.user.id, email: verified.data.user.email } });
}
