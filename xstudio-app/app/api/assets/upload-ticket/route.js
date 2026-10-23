import { parseDirectUpload } from '../../../../lib/xstudio-direct-upload';
import { json, requireOwner } from '../../../../lib/xstudio-server';
import { ASSET_BUCKET, isTrustedOrigin, MAX_DIRECT_ASSET_BYTES, storagePath } from '../../../../lib/xstudio-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const context = await requireOwner();
  if (context.response) return context.response;
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const parsed = parseDirectUpload(body);
  if (parsed.error) return json({ error: parsed.error }, 400);
  const path = storagePath(context.user.id, parsed.value.name);
  const ticket = await context.client.storage.from(ASSET_BUCKET).createSignedUploadUrl(path);
  if (ticket.error || !ticket.data?.token) return json({ error: 'Upload ticket unavailable.' }, 502);
  return json({ path, token: ticket.data.token, maxBytes: MAX_DIRECT_ASSET_BYTES });
}
