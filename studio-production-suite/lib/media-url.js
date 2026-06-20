const NON_MEDIA_URL_KEYS = new Set(['website_url', 'project_url', 'repo_url']);

function getSupabaseBaseUrl() {
  const raw = String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  return raw.replace(/\/+$/, '');
}

function getBucket() {
  return String(process.env.SUPABASE_STORAGE_BUCKET || 'uploads').trim() || 'uploads';
}

function encodeStoragePath(path) {
  return String(path || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

export function normalizeMediaUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) {
    return raw;
  }

  const base = getSupabaseBaseUrl();
  const bucket = getBucket();

  if (raw.startsWith('/storage/v1/object/public/')) {
    return base ? `${base}${raw}` : raw;
  }

  if (raw.startsWith('storage/v1/object/public/')) {
    return base ? `${base}/${raw}` : `/${raw}`;
  }

  if (raw.startsWith('/')) {
    return raw;
  }

  if (raw.includes('/') && !/\s/.test(raw)) {
    if (!base) {
      return raw;
    }

    const key = raw.replace(/^\/+/, '');
    return `${base}/storage/v1/object/public/${bucket}/${encodeStoragePath(key)}`;
  }

  return raw;
}

function isMediaUrlKey(key) {
  const normalized = String(key || '').trim().toLowerCase();
  if (!normalized.endsWith('_url')) {
    return false;
  }
  return !NON_MEDIA_URL_KEYS.has(normalized);
}

export function normalizeMediaPayload(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeMediaPayload(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const output = {};

  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' && isMediaUrlKey(key)) {
      output[key] = normalizeMediaUrl(item);
      continue;
    }

    output[key] = normalizeMediaPayload(item);
  }

  return output;
}
