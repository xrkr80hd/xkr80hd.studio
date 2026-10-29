// Showcase folder: short-lived, read-only, project-scoped share links.
// The owner creates/extends/kills links with their session; anyone holding a
// live link can view that one project's images until the link expires.
// Only the SHA-256 of a link token is stored (xstudio_showcase_links).
const ID = /^[a-zA-Z0-9_-]{1,80}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LINK = /^xss_[A-Za-z0-9_-]{43}$/;
const STEP_MS = 30 * 60_000;
const MAX_LIFETIME_MS = 24 * 3_600_000;
const MAX_ITEMS = 400;
const IMAGE_SECONDS = 600;
const reply = (data, status = 200) => Response.json(data, {
  status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function newLinkToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return 'xss_' + b64;
}
async function readJson(request, limit = 4096) {
  const text = await request.text();
  if (text.length > limit) return null;
  try { const v = JSON.parse(text); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; }
}
const linkView = (row) => ({ id: row.id, project: row.project, expires_at: row.expires_at });

async function activeProject(admin, owner, project) {
  const { data, error } = await admin.from('xstudio_engine_projects')
    .select('manifest').eq('owner_id', owner).eq('project', project).maybeSingle();
  if (error) throw Error('Project lookup failed');
  if (!data) return null;
  let m; try { m = JSON.parse(data.manifest); } catch { return null; }
  if (!m || typeof m !== 'object' || m.deleted_at || m.system_pool) return null;
  return m;
}

// Owner-only: create / extend / kill / status.
export async function showcaseManage(request, admin, ownerId) {
  if (request.method !== 'POST') return reply({ error: 'POST required.' }, 405);
  const a = await readJson(request);
  if (!a) return reply({ error: 'Invalid request.' }, 400);
  const links = () => admin.from('xstudio_showcase_links');
  const now = Date.now();

  if (a.action === 'status' || a.action === 'create') {
    if (typeof a.project !== 'string' || !ID.test(a.project)) return reply({ error: 'Invalid project.' }, 400);
  } else if (a.action === 'extend' || a.action === 'kill') {
    if (typeof a.id !== 'string' || !UUID.test(a.id)) return reply({ error: 'Invalid link.' }, 400);
  } else return reply({ error: 'Unknown action.' }, 400);

  if (a.action === 'status') {
    const { data, error } = await links().select('id,project,expires_at')
      .eq('owner_id', ownerId).eq('project', a.project).is('revoked_at', null)
      .gt('expires_at', new Date(now).toISOString()).order('expires_at', { ascending: false }).limit(1);
    if (error) return reply({ error: 'Showcase unavailable.' }, 502);
    return reply({ link: data?.[0] ? linkView(data[0]) : null });
  }

  if (a.action === 'create') {
    if (!await activeProject(admin, ownerId, a.project)) return reply({ error: 'Choose an active project.' }, 404);
    // One live link per project: a new one replaces any older one.
    const revoked = await links().update({ revoked_at: new Date(now).toISOString() })
      .eq('owner_id', ownerId).eq('project', a.project).is('revoked_at', null);
    if (revoked.error) return reply({ error: 'Showcase unavailable.' }, 502);
    const token = newLinkToken();
    const { data, error } = await links().insert({
      owner_id: ownerId, project: a.project, token_hash: await sha256Hex(token),
      expires_at: new Date(now + STEP_MS).toISOString(),
    }).select('id,project,expires_at').single();
    if (error || !data) return reply({ error: 'Showcase link could not be created.' }, 502);
    return reply({ link: linkView(data), token }, 201);
  }

  const { data: row, error } = await links().select('id,project,expires_at,created_at,revoked_at')
    .eq('id', a.id).eq('owner_id', ownerId).maybeSingle();
  if (error) return reply({ error: 'Showcase unavailable.' }, 502);
  if (!row || row.revoked_at || Date.parse(row.expires_at) <= now) return reply({ error: 'That link has already ended.' }, 404);

  if (a.action === 'kill') {
    const done = await links().update({ revoked_at: new Date(now).toISOString() })
      .eq('id', row.id).eq('owner_id', ownerId).is('revoked_at', null);
    if (done.error) return reply({ error: 'Showcase link could not be ended.' }, 502);
    return reply({ link: null });
  }

  const ceiling = Date.parse(row.created_at) + MAX_LIFETIME_MS;
  const next = Math.min(Date.parse(row.expires_at) + STEP_MS, ceiling);
  if (next <= Date.parse(row.expires_at)) return reply({ error: 'This link has reached its 24-hour limit. Start a new one.' }, 409);
  const { data: updated, error: updateError } = await links().update({ expires_at: new Date(next).toISOString() })
    .eq('id', row.id).eq('owner_id', ownerId).is('revoked_at', null).select('id,project,expires_at').single();
  if (updateError || !updated) return reply({ error: 'Showcase link could not be extended.' }, 502);
  return reply({ link: linkView(updated) });
}

// Public: anyone with a live link token. Returns one project's images,
// signed only until the link itself expires.
export async function showcaseView(request, admin) {
  if (request.method !== 'POST') return reply({ error: 'POST required.' }, 405);
  const a = await readJson(request, 1024);
  const gone = () => reply({ status: 'ended' }, 404);
  if (!a || typeof a.token !== 'string' || !LINK.test(a.token)) return gone();
  const now = Date.now();
  const { data: link, error } = await admin.from('xstudio_showcase_links')
    .select('owner_id,project,expires_at,revoked_at').eq('token_hash', await sha256Hex(a.token)).maybeSingle();
  if (error) return reply({ error: 'Showcase unavailable.' }, 502);
  if (!link || link.revoked_at || Date.parse(link.expires_at) <= now) return gone();
  const { data: owner, error: ownerError } = await admin.from('xstudio_owners')
    .select('user_id').eq('user_id', link.owner_id).maybeSingle();
  if (ownerError || owner?.user_id !== link.owner_id) return gone();
  const m = await activeProject(admin, link.owner_id, link.project);
  if (!m) return gone();

  // Image URLs are re-signed on every page load and never outlive the link.
  // The 10-minute cap means a killed link's images go dark shortly after.
  const seconds = Math.max(1, Math.min(IMAGE_SECONDS, Math.floor((Date.parse(link.expires_at) - now) / 1000)));
  const refs = Object.values(m.references || {}).filter((r) =>
    r && typeof r === 'object' && !r.deleted_at && !r.discarded_for_production && r.role !== 'DIAGNOSTIC'
    && typeof r.key === 'string' && r.key.startsWith('xce/') && r.key.length <= 1000
    && typeof r.mime_type === 'string' && r.mime_type.startsWith('image/'),
  ).slice(0, MAX_ITEMS);

  // Membership comes from this project's saved manifest; file ownership is
  // checked again here before anything is signed.
  const byKey = new Map();
  const keys = [...new Set(refs.map((r) => r.key))];
  for (let i = 0; i < keys.length; i += 100) {
    const { data, error: fileError } = await admin.from('xstudio_engine_files')
      .select('object_key,storage_bucket,storage_path').eq('owner_id', link.owner_id).in('object_key', keys.slice(i, i + 100));
    if (fileError) return reply({ error: 'Showcase unavailable.' }, 502);
    for (const f of data || []) byKey.set(f.object_key, f);
  }
  const urls = new Map();
  const buckets = new Map();
  for (const f of byKey.values()) {
    if (!['xstudio-assets', 'xstudio-engine-files'].includes(f.storage_bucket)) continue;
    if (!f.storage_path.startsWith(link.owner_id + '/')) continue;
    if (!buckets.has(f.storage_bucket)) buckets.set(f.storage_bucket, []);
    buckets.get(f.storage_bucket).push(f);
  }
  for (const [bucket, files] of buckets) {
    for (let i = 0; i < files.length; i += 100) {
      const chunk = files.slice(i, i + 100);
      const { data, error: signError } = await admin.storage.from(bucket).createSignedUrls(chunk.map((f) => f.storage_path), seconds);
      if (signError) return reply({ error: 'Showcase unavailable.' }, 502);
      (data || []).forEach((s, idx) => { if (s?.signedUrl && !s.error) urls.set(chunk[idx].object_key, s.signedUrl); });
    }
  }
  const text = (v, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const items = refs.flatMap((r) => {
    const url = urls.get(r.key);
    if (!url) return [];
    return [{
      id: text(r.id, 128),
      name: text(r.asset_name) || text(r.name) || text(r.id, 128),
      file_name: text(r.name),
      category: text(r.category, 60) || text(r.asset_type, 60),
      asset_type: text(r.asset_type, 60),
      role: text(r.role, 40),
      code: text(r.asset_code, 80),
      mime_type: r.mime_type,
      url,
    }];
  });
  return reply({
    project: {
      name: text(m.campaign_name) || link.project,
      code: text(m.active_project_code, 12),
      description: text(m.project_description, 1200),
    },
    expires_at: link.expires_at,
    items,
  });
}
