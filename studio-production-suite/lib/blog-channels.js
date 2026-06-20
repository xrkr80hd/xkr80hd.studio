import { isOwnerUsername } from './admin-auth';
import { slugify } from './admin-crud-utils';
import { normalizeAdminUsername } from './admin-users';

export function getDefaultBlogChannelName(username) {
  const safeUser = normalizeAdminUsername(username);

  if (!safeUser) {
    return 'localblog';
  }

  if (isOwnerUsername(safeUser)) {
    return 'xrkr80hdblog';
  }

  const compact = safeUser.replace(/[^a-z0-9]/g, '');
  return `${compact || safeUser}blog`;
}

export function normalizeBlogChannelName(value, username) {
  const raw = String(value || '').trim().slice(0, 120);
  if (raw) {
    return raw;
  }
  return getDefaultBlogChannelName(username);
}

export function toBlogChannelSlug(value, username) {
  const fallback = getDefaultBlogChannelName(username);
  const next = slugify(String(value || '').trim()) || slugify(fallback) || 'localblog';
  return next.slice(0, 140);
}
