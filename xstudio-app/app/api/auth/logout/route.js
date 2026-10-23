import { createSessionClient, json } from '../../../../lib/xstudio-server';
import { isTrustedOrigin } from '../../../../lib/xstudio-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const client = await createSessionClient();
  if (!client) return json({ error: 'XSTUDIO auth is not configured.' }, 503);
  const { error } = await client.auth.signOut();
  return error ? json({ error: 'Sign out failed.' }, 502) : json({ ok: true });
}
