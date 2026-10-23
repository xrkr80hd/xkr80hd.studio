import 'server-only';

import { readBounded } from './xstudio-providers.mjs';

const EDGE_PATH = '/functions/v1/xstudio-assets-api/tokens';

export async function callTokenFunction(client, method, body, id) {
  const session = await client.auth.getSession();
  const accessToken = session.data?.session?.access_token;
  if (session.error || !accessToken) return { error: 'Session expired.', status: 401 };
  const url = new URL(EDGE_PATH, process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (id) url.searchParams.set('id', id);
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const data = JSON.parse((await readBounded(response, 32_768)).toString('utf8'));
    if (!response.ok) return { error: 'Token service rejected the request.', status: response.status >= 500 ? 502 : response.status };
    return { data, status: response.status };
  } catch {
    return { error: 'Token service unavailable.', status: 502 };
  }
}
