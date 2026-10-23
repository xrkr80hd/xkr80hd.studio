export const MAX_ASSET_BYTES = 4 * 1024 * 1024;
export const MAX_DIRECT_ASSET_BYTES = 100 * 1024 * 1024;
export const ASSET_BUCKET = 'xstudio-assets';
export const SIGNED_URL_SECONDS = 60;

export function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isTrustedOrigin(request) {
  const origin = request.headers.get('origin');
  try {
    if (!origin || origin === 'null') return false;
    const target = new URL(request.url);
    const host = request.headers.get('host');
    return origin === target.origin || Boolean(host && origin === `${target.protocol}//${host}`);
  } catch {
    return false;
  }
}

export function parseAssetMetadata(fields, file, maxBytes = MAX_ASSET_BYTES) {
  if (!file || typeof file.name !== 'string' || !Number.isInteger(file.size) || file.size < 1 || file.size > maxBytes) {
    return { error: `A file between 1 byte and ${maxBytes} bytes is required.` };
  }
  const mimeType = String(file.type || '').toLowerCase();
  if (!/^(image\/(?:png|jpeg|webp|gif)|video\/(?:mp4|webm|quicktime)|audio\/(?:mpeg|mp4|wav|webm)|application\/pdf)$/.test(mimeType)) {
    return { error: 'Unsupported file type.' };
  }
  const name = String(fields.get('name') || file.name || '').trim();
  const kind = String(fields.get('kind') || (mimeType.split('/')[0] === 'application' ? 'document' : mimeType.split('/')[0])).trim().toLowerCase();
  const sourceProvider = String(fields.get('source_provider') || 'manual').trim().toLowerCase();
  const projectId = String(fields.get('project_id') || '').trim();
  if (!name || name.length > 512 || !/^[a-z0-9][a-z0-9 _.-]{0,79}$/.test(kind) || !/^[a-z0-9][a-z0-9 _.-]{0,79}$/.test(sourceProvider)) {
    return { error: 'Invalid asset metadata.' };
  }
  if (projectId && !isUuid(projectId)) return { error: 'Invalid project ID.' };
  return { value: { name, kind, mime_type: mimeType, byte_size: file.size, source_provider: sourceProvider, project_id: projectId || null } };
}

export function storagePath(ownerId, fileName) {
  const extension = String(fileName).split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  return `${ownerId}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;
}
