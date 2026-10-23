/**
 * XSTUDIO Dynamic Environment-Aware API Resolver and Client Fetch Utility
 * Supports xstudio.xrkr80hd.studio, xrkrstudio.xrkr80hd.studio, Vercel deployments, and local previews.
 */

export function getApiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    const custom = process.env.NEXT_PUBLIC_API_URL.trim();
    if (custom) return custom.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  return '';
}

export function resolveApiUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!base) return normalizedPath;
  return `${base}${normalizedPath}`;
}

export function resolveAssetUrl(project: string, fileId: string): string {
  return resolveApiUrl(`/api/manifest?project=${encodeURIComponent(project)}&file=${encodeURIComponent(fileId)}`);
}

export function resolveCoverUrl(project: string): string {
  return resolveApiUrl(`/api/cover?project=${encodeURIComponent(project)}`);
}

export async function studioFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = resolveApiUrl(path);
  const headers = new Headers(init?.headers || {});

  // Add same-origin credentials by default for session cookies in iframes and custom domains
  const requestInit: RequestInit = {
    credentials: 'same-origin',
    ...init,
    headers,
  };

  return fetch(url, requestInit);
}
