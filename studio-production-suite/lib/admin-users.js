import { getSupabaseAdmin } from './supabase-admin';
import { hashPassword, verifyPassword } from './password-hash';
import { provisionBlogChannel } from './blog-channel-provisioning.mjs';

const TABLE = 'admin_users';

function isMissingTableError(error) {
  const message = String(error?.message || '');
  return message.includes(`public.${TABLE}`) && message.includes('Could not find the table');
}

export function normalizeAdminUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 48);
}

function normalizeDisplayName(value) {
  return String(value || '').trim().slice(0, 120);
}

function adminSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }
  return supabase;
}

export async function listAdminUsers() {
  const supabase = adminSupabase();

  if (!supabase) {
    return { users: [], missingTable: false, error: 'Missing Supabase server credentials.' };
  }

  const result = await supabase
    .from(TABLE)
    .select('username, display_name, is_enabled, created_at, updated_at')
    .order('username', { ascending: true });

  if (result.error) {
    return {
      users: [],
      missingTable: isMissingTableError(result.error),
      error: result.error.message,
    };
  }

  return { users: result.data || [], missingTable: false, error: null };
}

export async function findAdminUserByUsername(username) {
  const supabase = adminSupabase();

  if (!supabase) {
    return { user: null, missingTable: false, error: 'Missing Supabase server credentials.' };
  }

  const safeUsername = normalizeAdminUsername(username);
  if (!safeUsername) {
    return { user: null, missingTable: false, error: null };
  }

  const result = await supabase
    .from(TABLE)
    .select('username, password_hash, display_name, is_enabled')
    .eq('username', safeUsername)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    return {
      user: null,
      missingTable: isMissingTableError(result.error),
      error: result.error.message,
    };
  }

  return { user: result.data || null, missingTable: false, error: null };
}

export async function createAdminUser({ username, password, displayName = '' }) {
  const supabase = adminSupabase();

  if (!supabase) {
    return { ok: false, missingTable: false, error: 'Missing Supabase server credentials.' };
  }

  const safeUsername = normalizeAdminUsername(username);
  const safeDisplayName = normalizeDisplayName(displayName);
  const safePassword = String(password || '');

  if (!safeUsername || safeUsername.length < 3) {
    return { ok: false, missingTable: false, error: 'Username must be at least 3 valid characters.' };
  }

  if (safePassword.length < 10) {
    return { ok: false, missingTable: false, error: 'Password must be at least 10 characters.' };
  }

  const passwordHash = hashPassword(safePassword);

  const result = await supabase.from(TABLE).insert({
    username: safeUsername,
    display_name: safeDisplayName || null,
    password_hash: passwordHash,
    is_enabled: true,
  });

  if (result.error) {
    const message = String(result.error.message || '');
    if (message.includes('duplicate key value') || message.includes('unique constraint')) {
      return { ok: false, missingTable: false, error: 'That username already exists.' };
    }

    return {
      ok: false,
      missingTable: isMissingTableError(result.error),
      error: result.error.message,
    };
  }

  const provisioned = await provisionBlogChannel(safeUsername, { supabase });

  if (!provisioned.ok) {
    await supabase.from(TABLE).delete().eq('username', safeUsername);
    return {
      ok: false,
      missingTable: provisioned.missingTable,
      error: provisioned.missingTable
        ? 'The shared blog channel table is not installed yet. Apply the current Supabase schema before creating blogger accounts.'
        : provisioned.error || 'The blogger profile lane could not be created.',
    };
  }

  return {
    ok: true,
    missingTable: false,
    error: null,
    channel: provisioned.channel,
  };
}

export async function deleteAdminUser(username) {
  const supabase = adminSupabase();

  if (!supabase) {
    return { ok: false, missingTable: false, error: 'Missing Supabase server credentials.' };
  }

  const safeUsername = normalizeAdminUsername(username);

  if (!safeUsername) {
    return { ok: false, missingTable: false, error: 'Invalid username.' };
  }

  const result = await supabase.from(TABLE).delete().eq('username', safeUsername);

  if (result.error) {
    return {
      ok: false,
      missingTable: isMissingTableError(result.error),
      error: result.error.message,
    };
  }

  return { ok: true, missingTable: false, error: null };
}

export async function updateAdminUserPassword(username, password) {
  const supabase = adminSupabase();

  if (!supabase) {
    return { ok: false, missingTable: false, error: 'Missing Supabase server credentials.' };
  }

  const safeUsername = normalizeAdminUsername(username);
  const safePassword = String(password || '');

  if (!safeUsername) {
    return { ok: false, missingTable: false, error: 'Invalid username.' };
  }

  if (safePassword.length < 10) {
    return { ok: false, missingTable: false, error: 'Password must be at least 10 characters.' };
  }

  const passwordHash = hashPassword(safePassword);
  const result = await supabase
    .from(TABLE)
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('username', safeUsername);

  if (result.error) {
    return {
      ok: false,
      missingTable: isMissingTableError(result.error),
      error: result.error.message,
    };
  }

  return { ok: true, missingTable: false, error: null };
}

export async function verifyDatabaseAdminCredentials(username, password) {
  const lookup = await findAdminUserByUsername(username);

  if (lookup.error || lookup.missingTable || !lookup.user || !lookup.user.is_enabled) {
    return { ok: false, missingTable: lookup.missingTable, error: lookup.error };
  }

  const passOk = verifyPassword(String(password || ''), lookup.user.password_hash);
  return { ok: passOk, missingTable: false, error: null };
}

export function adminUsersBootstrapSql() {
  return `create table if not exists public.admin_users (
  id bigint generated by default as identity primary key,
  username text not null unique,
  display_name text,
  password_hash text not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_enabled_idx on public.admin_users (is_enabled);`;
}
