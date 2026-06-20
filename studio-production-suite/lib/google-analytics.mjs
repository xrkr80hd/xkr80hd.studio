export function shouldTrackGoogleAnalytics(pathname) {
  const normalizedPath = String(pathname || '/');
  return normalizedPath !== '/admin' && !normalizedPath.startsWith('/admin/');
}
