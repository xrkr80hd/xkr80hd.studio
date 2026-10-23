import { ASSET_BUCKET, isUuid, SIGNED_URL_SECONDS } from '../../../../../lib/xstudio-validation.mjs';
import { json, requireOwner } from '../../../../../lib/xstudio-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const context = await requireOwner();
  if (context.response) return context.response;
  const { id } = await params;
  if (!isUuid(id)) return json({ error: 'Invalid asset ID.' }, 400);
  const found = await context.client.from('xstudio_assets').select('storage_path,status')
    .eq('id', id).eq('owner_id', context.user.id).maybeSingle();
  if (found.error) return json({ error: 'Could not load asset.' }, 502);
  if (!found.data || found.data.status !== 'ready') return json({ error: 'Asset not found.' }, 404);
  const signed = await context.client.storage.from(ASSET_BUCKET)
    .createSignedUrl(found.data.storage_path, SIGNED_URL_SECONDS, { download: true });
  if (signed.error || !signed.data?.signedUrl) return json({ error: 'Download link unavailable.' }, 502);
  return json({ url: signed.data.signedUrl, expiresIn: SIGNED_URL_SECONDS });
}
