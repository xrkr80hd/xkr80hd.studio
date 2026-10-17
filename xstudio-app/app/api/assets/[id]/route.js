import { assetColumns } from '../../../../lib/xstudio-assets';
import { json, requireOwner } from '../../../../lib/xstudio-server';
import { isTrustedOrigin, isUuid } from '../../../../lib/xstudio-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  if (!isTrustedOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const context = await requireOwner();
  if (context.response) return context.response;
  const { id } = await params;
  if (!isUuid(id)) return json({ error: 'Invalid asset ID.' }, 400);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || !['draft', 'locked', 'rejected'].includes(body.workflow_status)) {
    return json({ error: 'Invalid workflow status.' }, 400);
  }
  if (Object.keys(body).some(key => key !== 'workflow_status')) return json({ error: 'Unsupported field.' }, 400);
  const updated = await context.client.from('xstudio_assets')
    .update({ workflow_status: body.workflow_status })
    .eq('id', id).eq('owner_id', context.user.id)
    .select(assetColumns).maybeSingle();
  if (updated.error) return json({ error: 'Could not update asset.' }, 502);
  if (!updated.data) return json({ error: 'Asset not found.' }, 404);
  return json({ asset: updated.data });
}
