import 'server-only';

import { ASSET_BUCKET, MAX_ASSET_BYTES, parseAssetMetadata, storagePath } from './xstudio-validation.mjs';

export const assetColumns = 'id,project_id,kind,name,mime_type,byte_size,source_provider,status,workflow_status,created_at';

export async function saveAsset(client, ownerId, form) {
  const file = form.get('file');
  const parsed = parseAssetMetadata(form, file);
  if (parsed.error) return { error: parsed.error, status: 400 };

  const path = storagePath(ownerId, file.name);
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength !== file.size || bytes.byteLength > MAX_ASSET_BYTES) {
    return { error: 'Invalid file size.', status: 400 };
  }

  const uploaded = await client.storage.from(ASSET_BUCKET).upload(path, bytes, {
    contentType: parsed.value.mime_type,
    upsert: false,
  });
  if (uploaded.error) return { error: 'Asset storage failed.', status: 502 };

  const inserted = await client.from('xstudio_assets').insert({
    owner_id: ownerId,
    ...parsed.value,
    storage_path: path,
    status: 'ready',
  }).select(assetColumns).single();
  if (inserted.error || !inserted.data) {
    await client.storage.from(ASSET_BUCKET).remove([path]);
    return { error: 'Asset metadata could not be saved.', status: 502 };
  }
  return { asset: inserted.data };
}

export async function saveGeneratedImage(client, ownerId, provider, name, bytes, mimeType) {
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const path = storagePath(ownerId, `generated.${extension}`);
  const uploaded = await client.storage.from(ASSET_BUCKET).upload(path, bytes, { contentType: mimeType, upsert: false });
  if (uploaded.error) return { error: 'Could not save generated image.', status: 502 };
  const inserted = await client.from('xstudio_assets').insert({
    owner_id: ownerId,
    project_id: null,
    kind: 'image',
    name,
    mime_type: mimeType,
    byte_size: bytes.byteLength,
    storage_path: path,
    source_provider: provider,
    status: 'ready',
    workflow_status: 'draft',
  }).select(assetColumns).single();
  if (inserted.error || !inserted.data) {
    await client.storage.from(ASSET_BUCKET).remove([path]);
    return { error: 'Could not save generated image metadata.', status: 502 };
  }
  return { asset: inserted.data };
}
