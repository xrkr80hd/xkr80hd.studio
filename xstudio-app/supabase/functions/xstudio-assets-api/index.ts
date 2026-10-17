import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const BUCKET = 'xstudio-assets';
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_BYTES + 16_384;
const SIGNED_SECONDS = 60;
const ASSET_COLUMNS = 'id,project_id,kind,name,mime_type,byte_size,source_provider,status,workflow_status,created_at';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN = /^xst_[0-9a-f]{64}$/;
const MIME = /^(image\/(?:png|jpeg|webp|gif)|video\/(?:mp4|webm|quicktime)|audio\/(?:mpeg|mp4|wav|webm)|application\/pdf)$/;
const SLUG = /^[a-z0-9][a-z0-9 _.-]{0,79}$/;

function json(value, status = 200) {
  return Response.json(value, {
    status,
    headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}

function getAdmin() {
  const url = Deno.env.get('SUPABASE_URL');
  let key;
  try {
    // Supabase injects a JSON dictionary of named secret keys. Prefer the
    // independently rotatable default key over the legacy service-role JWT.
    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    if (typeof secretKeys?.default === 'string' && secretKeys.default.startsWith('sb_secret_')) {
      key = secretKeys.default;
    }
  } catch {
    // A malformed dictionary cannot grant access; use the legacy key below.
  }
  key ||= Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  // supabase-js 2.118 may add its API key as a Bearer fallback for data and
  // storage requests. New sb_secret_ keys must go in `apikey` only.
  const secretKeyFetch = key.startsWith('sb_secret_')
    ? (input, init) => {
      const headers = new Headers(init?.headers);
      if (headers.get('authorization') === `Bearer ${key}`) {
        headers.delete('authorization');
      }
      return fetch(input, { ...init, headers });
    }
    : undefined;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: secretKeyFetch },
  });
}

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function authenticate(request, admin, scope) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  const raw = header.slice(7);
  if (!TOKEN.test(raw)) return null;
  const hash = await sha256Hex(raw);
  const { data: token, error } = await admin
    .from('xstudio_api_tokens')
    .select('owner_id,provider,scopes,expires_at,revoked_at')
    .eq('token_hash', hash)
    .maybeSingle();
  if (error || !token || token.revoked_at || Date.parse(token.expires_at) <= Date.now()
      || !Array.isArray(token.scopes) || !token.scopes.includes(scope)) return null;
  const { data: owner, error: ownerError } = await admin
    .from('xstudio_owners')
    .select('user_id')
    .eq('user_id', token.owner_id)
    .maybeSingle();
  if (ownerError || owner?.user_id !== token.owner_id) return null;
  return token;
}

async function boundedBody(request, limit = MAX_BODY_BYTES) {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function upload(request, admin, token) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
    return json({ error: 'Multipart upload required.' }, 415);
  }
  const body = await boundedBody(request);
  if (!body) return json({ error: 'Upload exceeds 4 MB.' }, 413);
  let form;
  try {
    form = await new Request('https://xstudio.invalid', {
      method: 'POST', headers: { 'content-type': contentType }, body,
    }).formData();
  } catch {
    return json({ error: 'Invalid upload.' }, 400);
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES) {
    return json({ error: 'A file between 1 byte and 4 MB is required.' }, 400);
  }
  const mimeType = file.type.toLowerCase();
  const name = String(form.get('name') || file.name).trim();
  const kind = String(form.get('kind') || (mimeType.split('/')[0] === 'application' ? 'document' : mimeType.split('/')[0])).trim().toLowerCase();
  const projectId = String(form.get('project_id') || '').trim();
  if (!MIME.test(mimeType) || !name || name.length > 512 || !SLUG.test(kind)
      || (projectId && !UUID.test(projectId))) {
    return json({ error: 'Invalid asset metadata.' }, 400);
  }
  // Ignore client-supplied owner_id and source_provider. Both come from the token.
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  const path = `${token.owner_id}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;
  const { error: storageError } = await admin.storage.from(BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: mimeType, upsert: false,
  });
  if (storageError) return json({ error: 'Asset storage failed.' }, 502);
  const { data: asset, error: metadataError } = await admin.from('xstudio_assets').insert({
    owner_id: token.owner_id,
    project_id: projectId || null,
    kind,
    name,
    mime_type: mimeType,
    byte_size: file.size,
    storage_path: path,
    source_provider: token.provider,
    status: 'ready',
  }).select(ASSET_COLUMNS).single();
  if (metadataError || !asset) {
    await admin.storage.from(BUCKET).remove([path]);
    return json({ error: 'Asset metadata could not be saved.' }, 502);
  }
  return json({ asset }, 201);
}

async function download(request, admin, token) {
  const id = new URL(request.url).searchParams.get('id');
  if (!UUID.test(id || '')) return json({ error: 'Invalid asset ID.' }, 400);
  const { data: asset, error } = await admin.from('xstudio_assets')
    .select('id,owner_id,storage_path,status')
    .eq('id', id).eq('owner_id', token.owner_id).maybeSingle();
  if (error || !asset || asset.status !== 'ready') return json({ error: 'Asset not found.' }, 404);
  const { data: signed, error: signedError } = await admin.storage.from(BUCKET)
    .createSignedUrl(asset.storage_path, SIGNED_SECONDS);
  if (signedError || !signed?.signedUrl) return json({ error: 'Download unavailable.' }, 502);
  return json({ signed_url: signed.signedUrl, expires_in: SIGNED_SECONDS });
}

async function authenticateOwner(request, admin) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  const jwt = header.slice(7);
  if (!jwt || TOKEN.test(jwt)) return null;
  // getUser(jwt) calls Supabase Auth to validate the access token server-side.
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data?.user?.id) return null;
  const { data: owner, error: ownerError } = await admin.from('xstudio_owners')
    .select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (ownerError || owner?.user_id !== data.user.id) return null;
  return data.user.id;
}

async function issueToken(request, admin, ownerId) {
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    return json({ error: 'JSON required.' }, 415);
  }
  const body = await boundedBody(request, 4096);
  if (!body) return json({ error: 'Invalid request.' }, 400);
  let fields;
  try {
    fields = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return json({ error: 'Invalid token settings.' }, 400);
  }
  const label = typeof fields.label === 'string' ? fields.label.trim() : '';
  const provider = typeof fields.provider === 'string' ? fields.provider.trim().toLowerCase() : '';
  const scopes = fields.scopes;
  const days = fields.expires_in_days === undefined ? 30 : fields.expires_in_days;
  if (!label || label.length > 120 || !SLUG.test(provider)
      || !Array.isArray(scopes) || scopes.length < 1 || scopes.length > 2
      || new Set(scopes).size !== scopes.length
      || scopes.some((scope) => scope !== 'asset:read' && scope !== 'asset:write')
      || !Number.isInteger(days) || days < 1 || days > 90) {
    return json({ error: 'Invalid token settings.' }, 400);
  }
  const random = crypto.getRandomValues(new Uint8Array(32));
  const plaintext = `xst_${[...random].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  const tokenHash = await sha256Hex(plaintext);
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
  const { data: credential, error } = await admin.from('xstudio_api_tokens').insert({
    owner_id: ownerId,
    token_hash: tokenHash,
    label,
    provider,
    scopes,
    expires_at: expiresAt,
  }).select('id,label,provider,scopes,expires_at,created_at').single();
  if (error || !credential) return json({ error: 'Credential could not be created.' }, 502);
  return json({ token: plaintext, credential }, 201);
}

async function listTokens(admin, ownerId) {
  const { data, error } = await admin.from('xstudio_api_tokens')
    .select('id,label,provider,scopes,expires_at,revoked_at,created_at')
    .eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(100);
  if (error) return json({ error: 'Credentials unavailable.' }, 502);
  return json({ credentials: data || [] });
}

async function revokeToken(request, admin, ownerId) {
  const id = new URL(request.url).searchParams.get('id');
  if (!UUID.test(id || '')) return json({ error: 'Invalid credential ID.' }, 400);
  const { data, error } = await admin.from('xstudio_api_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id).eq('owner_id', ownerId).is('revoked_at', null)
    .select('id').maybeSingle();
  if (error) return json({ error: 'Credential could not be revoked.' }, 502);
  if (!data) return json({ error: 'Credential not found.' }, 404);
  return json({ revoked: true });
}

async function tokenManagement(request, admin) {
  if (!['POST', 'GET', 'DELETE'].includes(request.method)) {
    return json({ error: 'Method not allowed.' }, 405);
  }
  const ownerId = await authenticateOwner(request, admin);
  if (!ownerId) return json({ error: 'Unauthorized.' }, 401);
  if (request.method === 'POST') return issueToken(request, admin, ownerId);
  if (request.method === 'GET') return listTokens(admin, ownerId);
  return revokeToken(request, admin, ownerId);
}

Deno.serve(async (request) => {
  const admin = getAdmin();
  if (!admin) return json({ error: 'Integration is not configured.' }, 503);
  try {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/xstudio-assets-api/tokens') || url.searchParams.get('resource') === 'tokens') {
      return await tokenManagement(request, admin);
    }
    if (request.method !== 'POST' && request.method !== 'GET') {
      return json({ error: 'Method not allowed.' }, 405);
    }
    const scope = request.method === 'POST' ? 'asset:write' : 'asset:read';
    const token = await authenticate(request, admin, scope);
    if (!token) return json({ error: 'Unauthorized.' }, 401);
    return request.method === 'POST'
      ? await upload(request, admin, token)
      : await download(request, admin, token);
  } catch {
    return json({ error: 'Request failed.' }, 500);
  }
});
