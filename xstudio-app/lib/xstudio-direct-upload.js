import 'server-only';

import { MAX_DIRECT_ASSET_BYTES, parseAssetMetadata } from './xstudio-validation.mjs';

export function parseDirectUpload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Invalid metadata.' };
  const fields = new Map(Object.entries(body));
  const descriptor = {
    name: typeof body.name === 'string' ? body.name : '',
    type: typeof body.mime_type === 'string' ? body.mime_type : '',
    size: body.byte_size,
  };
  return parseAssetMetadata(fields, descriptor, MAX_DIRECT_ASSET_BYTES);
}
