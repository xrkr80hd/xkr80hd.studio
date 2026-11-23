import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, isAdminSessionValid, isVisitorView } from './admin-auth';

export const PAGE_VISIBILITY_TABLE = 'site_page_visibility';

// Public pages that can be switched on/off from the admin dashboard.
// Anything missing from the database counts as ON.
export const PAGE_SWITCHES = [
  { key: 'lets-gleaux', label: 'Lets Gleaux', path: '/lets-gleaux', group: 'special' },
  { key: 'progress', label: "Ashley's Progress", path: '/progress', group: 'special' },
  { key: 'local-legends-archive', label: 'Legends', path: '/local-legends-archive', group: 'site' },
  { key: 'your-local-scene', label: 'Scene', path: '/your-local-scene', group: 'site' },
  { key: 'your-local-artists', label: 'Artists', path: '/your-local-artists', group: 'site' },
  { key: 'your-local-blog', label: 'Blog', path: '/your-local-blog', group: 'site' },
  { key: 'podcast', label: 'Podcast', path: '/podcast', group: 'site' },
  { key: 'your-local-business', label: 'Business', path: '/your-local-business', group: 'site' },
  { key: 'contact', label: 'Contact', path: '/contact', group: 'site' },
];

export const PAGE_VISIBILITY_SQL = `create table if not exists public.${PAGE_VISIBILITY_TABLE} (
  page_key text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.${PAGE_VISIBILITY_TABLE} enable row level security;
revoke all on public.${PAGE_VISIBILITY_TABLE} from anon, authenticated;
grant select, insert, update on public.${PAGE_VISIBILITY_TABLE} to service_role;`;

export function isKnownPageKey(key) {
  return PAGE_SWITCHES.some((page) => page.key === key);
}

export function getPageVisibilityDb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

// Returns { ready, enabled: { [key]: boolean } }. Never throws: if the table
// is missing or Supabase is down, every page stays ON.
export async function readPageVisibility() {
  const enabled = Object.fromEntries(PAGE_SWITCHES.map((page) => [page.key, true]));
  const db = getPageVisibilityDb();
  if (!db) return { ready: false, enabled };
  try {
    const { data, error } = await db.from(PAGE_VISIBILITY_TABLE).select('page_key, enabled');
    if (error) return { ready: false, enabled };
    for (const row of data || []) {
      if (row.page_key in enabled) enabled[row.page_key] = row.enabled !== false;
    }
    return { ready: true, enabled };
  } catch {
    return { ready: false, enabled };
  }
}

export const getPageVisibility = cache(readPageVisibility);

export async function getHiddenPaths() {
  const { enabled } = await getPageVisibility();
  return PAGE_SWITCHES.filter((page) => !enabled[page.key]).map((page) => page.path);
}

// Use in a public page's layout. Off pages 404 for the public; signed-in
// admins still see them with a reminder banner.
export async function checkPageEnabled(key) {
  const { enabled } = await getPageVisibility();
  if (enabled[key] !== false) return { enabled: true, adminPreview: false };
  const jar = cookies();
  const isAdmin = isAdminSessionValid(jar.get(ADMIN_SESSION_COOKIE)?.value || '') && !isVisitorView(jar);
  if (!isAdmin) notFound();
  return { enabled: false, adminPreview: true };
}
