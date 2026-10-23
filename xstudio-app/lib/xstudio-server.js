import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isUuid } from './xstudio-validation.mjs';

const noStore = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' };

export function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: noStore });
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_ENABLED !== 'false' && isUuid(process.env.XSTUDIO_OWNER_USER_ID));
}

export const configurationReady = isSupabaseConfigured;

export async function createSessionClient() {
  if (!configurationReady()) return null;
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; proxy.js refreshes them.
        }
      },
    },
  });
}

export async function requireOwner() {
  const client = await createSessionClient();
  if (!client) return { response: json({ error: 'XSTUDIO auth is not configured.' }, 503) };
  const { data, error } = await client.auth.getUser();
  if (error && (error.name === 'AuthRetryableFetchError' || error.status >= 500)) return { response: json({ error: 'Connection unavailable.' }, 503) };
  if (error || !data?.user) return { response: json({ error: 'Unauthorized.' }, 401) };
  if (data.user.id !== process.env.XSTUDIO_OWNER_USER_ID) return { response: json({ error: 'Forbidden.' }, 403) };
  const owner = await client.from('xstudio_owners').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (owner.error) return { response: json({ error: 'Connection unavailable.' }, 503) };
  if (owner.data?.user_id !== data.user.id) return { response: json({ error: 'Owner access is not provisioned.' }, 403) };
  return { client, user: data.user };
}
