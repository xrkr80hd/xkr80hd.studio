import { parseDirectUpload } from '../../../../lib/xstudio-direct-upload';
import { assetColumns } from '../../../../lib/xstudio-assets';
import { json, requireOwner } from '../../../../lib/xstudio-server';
import { ASSET_BUCKET, isTrustedOrigin } from '../../../../lib/xstudio-validation.mjs';

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
  const path = typeof body.path === 'string' ? body.path : '';
  if (!/^[-0-9a-f]{36}\/[0-9a-f-]{36}(?:\.[a-z0-9]{1,12})?$/i.test(path) || !path.startsWith(`${context.user.id}/`)) {
    return json({ error: 'Invalid storage path.' }, 400);
  }
  const info = await context.client.storage.from(ASSET_BUCKET).info(path);
  if (info.error || !info.data) return json({ error: 'Uploaded file not found.' }, 404);
  if (Number(info.data.size) !== parsed.value.byte_size || info.data.contentType !== parsed.value.mime_type) {
    return json({ error: 'Uploaded file does not match its metadata.' }, 400);
  }
  const inserted = await context.client.from('xstudio_assets').insert({
    owner_id: context.user.id,
    ...parsed.value,
    storage_path: path,
    status: 'ready',
  }).select(assetColumns).single();
  if (inserted.error || !inserted.data) return json({ error: 'Asset metadata could not be saved.' }, 502);
  return json({ asset: inserted.data }, 201);
}
