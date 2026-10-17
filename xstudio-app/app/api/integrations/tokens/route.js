import { callTokenFunction } from '../../../../lib/xstudio-edge';
import { readBounded } from '../../../../lib/xstudio-providers.mjs';
import { json, requireOwner } from '../../../../lib/xstudio-server';
import { parseCredentialId, parseTokenRequest } from '../../../../lib/xstudio-token-validation.mjs';
import { isTrustedOrigin } from '../../../../lib/xstudio-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const context = await requireOwner();
  if (context.response) return context.response;
  const result = await callTokenFunction(context.client, 'GET');
  return result.error ? json({ error: result.error }, result.status) : json({ credentials: result.data.credentials || [] });
}

export async function POST(request) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const context = await requireOwner();
  if (context.response) return context.response;
  let body;
  try { body = JSON.parse((await readBounded(request, 5_000)).toString('utf8')); }
  catch { return json({ error: 'Invalid or oversized JSON.' }, 400); }
  const parsed = parseTokenRequest(body);
  if (parsed.error) return json({ error: parsed.error }, 400);
  const result = await callTokenFunction(context.client, 'POST', parsed.value);
  if (result.error) return json({ error: result.error }, result.status);
  if (typeof result.data.token !== 'string' || !result.data.credential?.id) return json({ error: 'Token service returned an invalid response.' }, 502);
  return json({ token: result.data.token, credential: result.data.credential }, 201);
}

export async function DELETE(request) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const context = await requireOwner();
  if (context.response) return context.response;
  const id = parseCredentialId(new URL(request.url).searchParams.get('id'));
  if (!id) return json({ error: 'Invalid credential ID.' }, 400);
  const result = await callTokenFunction(context.client, 'DELETE', undefined, id);
  if (result.error) return json({ error: result.error }, result.status);
  return result.data.revoked === true ? json({ revoked: true }) : json({ error: 'Token service returned an invalid response.' }, 502);
}
