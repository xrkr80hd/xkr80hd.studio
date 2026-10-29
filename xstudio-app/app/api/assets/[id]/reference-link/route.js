import { AI_REFERENCE_LINK_SECONDS, ASSET_BUCKET, isAiReferenceEligible, isTrustedOrigin, isUuid } from '../../../../../lib/xstudio-validation.mjs';
import { json, requireOwner } from '../../../../../lib/xstudio-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Owner-only: mints one expiring, read-only signed URL for one original image.
// Storage stays private; the link is bound to this single object path and cannot list or reach other files.
export async function POST(request, { params }) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const context = await requireOwner();
  if (context.response) return context.response;
  const { id } = await params;
  if (!isUuid(id)) return json({ error: 'Invalid asset ID.' }, 400);
  const found = await context.client.from('xstudio_assets').select('storage_path,status,mime_type')
    .eq('id', id).eq('owner_id', context.user.id).maybeSingle();
  if (found.error) return json({ error: 'Could not load asset.' }, 502);
  if (!found.data || found.data.status !== 'ready') return json({ error: 'Asset not found.' }, 404);
  if (!isAiReferenceEligible(found.data)) return json({ error: 'AI reference links are available for images only.' }, 415);
  // No `download` option: served inline with its original content type, unchanged bytes.
  const signed = await context.client.storage.from(ASSET_BUCKET)
    .createSignedUrl(found.data.storage_path, AI_REFERENCE_LINK_SECONDS);
  if (signed.error || !signed.data?.signedUrl) return json({ error: 'Reference link unavailable.' }, 502);
  return json({
    url: signed.data.signedUrl,
    expiresIn: AI_REFERENCE_LINK_SECONDS,
    expiresAt: new Date(Date.now() + AI_REFERENCE_LINK_SECONDS * 1000).toISOString(),
  });
}
