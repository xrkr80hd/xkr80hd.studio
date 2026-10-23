/**
 * XSTUDIO Dynamic Environment-Aware API Resolver (ESM)
 */

export function getApiBaseUrl() {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
    const custom = process.env.NEXT_PUBLIC_API_URL.trim();
    if (custom) return custom.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  return '';
}

export function resolveApiUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : '/' + path;

  if (!base) return normalizedPath;
  return base + normalizedPath;
}

export function resolveAssetUrl(project, fileId) {
  return resolveApiUrl(`/api/manifest?project=${encodeURIComponent(project)}&file=${encodeURIComponent(fileId)}`);
}

export function resolveCoverUrl(project) {
  return resolveApiUrl(`/api/cover?project=${encodeURIComponent(project)}`);
}

export async function studioFetch(path, init = {}) {
  const url = resolveApiUrl(path);
  const headers = new Headers(init.headers || {});

  const requestInit = {
    credentials: 'same-origin',
    ...init,
    headers,
  };

  return fetch(url, requestInit);
}
