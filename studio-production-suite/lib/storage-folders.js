export const STORAGE_FOLDER_PRESETS = [
  'images/bands',
  'images/artists',
  'images/business',
  'images/posts',
  'audio/tracks',
  'video/clips',
  'misc',
];

export function normalizeFolder(input, fallback = 'misc') {
  const cleaned = String(input || '')
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');

  if (!cleaned || cleaned.includes('..')) {
    return fallback;
  }

  return cleaned;
}

export function isAllowedFolder(folder, allowedPrefixes = STORAGE_FOLDER_PRESETS) {
  const normalized = normalizeFolder(folder, '');

  if (!normalized) {
    return false;
  }

  return allowedPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}
