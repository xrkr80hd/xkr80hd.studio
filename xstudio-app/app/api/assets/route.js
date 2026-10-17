import { assetColumns, saveAsset } from '../../../lib/xstudio-assets';
import { json, requireOwner } from '../../../lib/xstudio-server';
import { isTrustedOrigin, MAX_ASSET_BYTES } from '../../../lib/xstudio-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const context = await requireOwner();
  if (context.response) return context.response;
  const result = await context.client.from('xstudio_assets').select(assetColumns)
    .eq('owner_id', context.user.id).order('created_at', { ascending: false }).limit(100);
  return result.error ? json({ error: 'Could not load assets.' }, 502) : json({ assets: result.data || [] });
}

export async function POST(request) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const context = await requireOwner();
  if (context.response) return context.response;
  const size = Number(request.headers.get('content-length'));
  if (size && size > MAX_ASSET_BYTES + 16_384) return json({ error: 'Upload exceeds 4 MB.' }, 413);
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return json({ error: 'Multipart upload required.' }, 415);
  let form;
  try { form = await request.formData(); } catch { return json({ error: 'Invalid upload.' }, 400); }
  const result = await saveAsset(context.client, context.user.id, form);
  return result.error ? json({ error: result.error }, result.status) : json({ asset: result.asset }, 201);
}
