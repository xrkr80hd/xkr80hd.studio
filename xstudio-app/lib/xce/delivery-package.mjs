// XCE Studios v3.0 delivery ZIP (built by the XCE Studios plugins' Media Preparation department).
// Browser-safe: the browser opens the ZIP and verifies checksums; the server re-checks what it receives.
//
// Layout:
//   delivery_manifest.json                     {project, generator, created, partial, missing, shots[], checksums{path: sha256}}
//   README.txt, grids/GRID-NN.png|json          (optional)
//   <SCENE>/<SHOT>/first_frame.png|jpg|webp    16:9 first frame (FF)
//   <SCENE>/<SHOT>/last_frame.png|jpg|webp     16:9 last frame (LF)
//   <SCENE>/<SHOT>/first_frame.txt | last_frame.txt | animation_prompt.txt
//   <SCENE>/<SHOT>/continuity.json | shot_manifest.json
export const DELIVERY_FORMAT = 'XCE_STUDIOS_DELIVERY_V3';
export const MAX_DELIVERY_SHOTS = 100;
export const MAX_PROMPT_CHARS = 50000;
export const MAX_CONTINUITY_BYTES = 60000;

const ID = /^[A-Za-z0-9_-]{1,80}$/;
const IMAGE_EXT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const need = (ok, message) => { if (!ok) throw Error(message); };
const decode = v => (typeof v === 'string' ? v : new TextDecoder().decode(v));

export function isDeliveryZip(paths) {
  return paths.some(p => p === 'delivery_manifest.json' || p.endsWith('/delivery_manifest.json'));
}

export async function sha256Hex(bytes) {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function prefixOf(paths) {
  const manifest = paths.find(p => p === 'delivery_manifest.json' || p.endsWith('/delivery_manifest.json'));
  need(manifest, 'This is not an XCE Studios v3 delivery ZIP (delivery_manifest.json is missing)');
  return manifest.slice(0, -'delivery_manifest.json'.length);
}

function frameFile(paths, base, name) {
  for (const ext of Object.keys(IMAGE_EXT)) {
    const p = base + name + '.' + ext;
    if (paths.includes(p)) return { file: p, mime_type: IMAGE_EXT[ext] };
  }
  return null;
}

function cleanText(value, label, warnings) {
  if (value === undefined) return '';
  const text = decode(value).trim();
  if (text.length > MAX_PROMPT_CHARS) { warnings.push(label + ' is longer than ' + MAX_PROMPT_CHARS + ' characters and was cut'); return text.slice(0, MAX_PROMPT_CHARS); }
  return text;
}

function cleanJson(value, label, warnings) {
  if (value === undefined) return {};
  const raw = decode(value);
  if (raw.length > MAX_CONTINUITY_BYTES) { warnings.push(label + ' is too large to keep (' + raw.length + ' bytes)'); return {}; }
  try { const parsed = JSON.parse(raw); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; }
  catch { warnings.push(label + ' is not valid JSON and was skipped'); return {}; }
}

/**
 * Read a delivery package.
 * files: {path: Uint8Array|string}. Text files carry content; image entries may be empty when imageInfo is given.
 * imageInfo: {path: {mime_type, byte_size}} when only the image list (not bytes) is available, e.g. on the server.
 */
export function readDeliveryPackage(files, zipName = 'delivery.zip', { imageInfo = null } = {}) {
  const paths = Object.keys(files), prefix = prefixOf(paths), warnings = [];
  let manifest;
  try { manifest = JSON.parse(decode(files[prefix + 'delivery_manifest.json'])); }
  catch { throw Error('delivery_manifest.json is not valid JSON'); }
  need(manifest && typeof manifest === 'object', 'delivery_manifest.json is empty');
  need(Array.isArray(manifest.shots) && manifest.shots.length, 'The delivery has no shots');
  need(manifest.shots.length <= MAX_DELIVERY_SHOTS, 'A delivery can hold at most ' + MAX_DELIVERY_SHOTS + ' shots; split it');
  need(manifest.checksums && typeof manifest.checksums === 'object', 'delivery_manifest.json has no checksums');
  const local = paths.map(p => p.slice(prefix.length));
  const seen = new Set(), shots = [], images = [], missing = [...(Array.isArray(manifest.missing) ? manifest.missing.map(String) : [])];
  const sorted = [...manifest.shots].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const s of sorted) {
    need(s && ID.test(s.shot_id || '') && ID.test(s.scene_id || ''), 'A shot has an invalid scene or shot ID');
    need(!seen.has(s.shot_id), 'Shot ' + s.shot_id + ' appears twice');
    seen.add(s.shot_id);
    const base = s.scene_id + '/' + s.shot_id + '/', abs = prefix + base;
    const ff = frameFile(local, base, 'first_frame'), lf = frameFile(local, base, 'last_frame');
    if (!ff) missing.push(s.shot_id + ' first frame');
    if (!lf) missing.push(s.shot_id + ' last frame');
    const shot = {
      shot_id: s.shot_id, scene_id: s.scene_id, order: Number.isFinite(s.order) ? s.order : shots.length + 1,
      duration_s: Number.isFinite(s.duration_s) && s.duration_s > 0 && s.duration_s <= 600 ? s.duration_s : 6,
      first_frame: ff ? { file: prefix + ff.file, mime_type: ff.mime_type, checksum_path: ff.file } : null,
      last_frame: lf ? { file: prefix + lf.file, mime_type: lf.mime_type, checksum_path: lf.file } : null,
      first_frame_prompt: cleanText(files[abs + 'first_frame.txt'], s.shot_id + ' first_frame.txt', warnings),
      last_frame_prompt: cleanText(files[abs + 'last_frame.txt'], s.shot_id + ' last_frame.txt', warnings),
      animation_prompt: cleanText(files[abs + 'animation_prompt.txt'], s.shot_id + ' animation_prompt.txt', warnings),
      continuity: cleanJson(files[abs + 'continuity.json'], s.shot_id + ' continuity.json', warnings),
      approval: s.approval && typeof s.approval === 'object' ? s.approval : null,
    };
    if (!shot.animation_prompt) missing.push(s.shot_id + ' animation prompt');
    for (const frame of [shot.first_frame, shot.last_frame]) {
      if (!frame) continue;
      const info = imageInfo ? imageInfo[frame.file] : null;
      if (imageInfo) need(info && info.mime_type === frame.mime_type && Number.isInteger(info.byte_size) && info.byte_size > 0, 'Image details missing for ' + frame.file);
      const bytes = files[frame.file];
      images.push({ file: frame.file, mime_type: frame.mime_type, byte_size: info ? info.byte_size : bytes?.length || 0, shot_id: shot.shot_id, role: frame === shot.first_frame ? 'FF' : 'LF', sha256: manifest.checksums[frame.checksum_path] || null });
      if (!manifest.checksums[frame.checksum_path]) warnings.push('No checksum listed for ' + frame.checksum_path);
    }
    shots.push(shot);
  }
  return {
    format: DELIVERY_FORMAT, zip_name: String(zipName).slice(0, 200), prefix,
    project: typeof manifest.project === 'string' ? manifest.project.slice(0, 200) : '',
    generator: typeof manifest.generator === 'string' ? manifest.generator.slice(0, 80) : '',
    created: typeof manifest.created === 'string' ? manifest.created.slice(0, 40) : '',
    partial: Boolean(manifest.partial) || missing.length > 0,
    missing: [...new Set(missing)], warnings, shots, images, checksums: manifest.checksums,
  };
}

/** Verify every file the manifest lists against its SHA-256. Returns the list of problems (empty = all good). */
export async function verifyChecksums(files, pkg, { skipImages = false } = {}) {
  const problems = [];
  for (const [rel, expected] of Object.entries(pkg.checksums)) {
    const path = pkg.prefix + rel;
    if (skipImages && /\.(png|jpe?g|webp)$/i.test(rel)) continue;
    if (!(path in files)) { if (!rel.startsWith('grids/')) problems.push('Missing ' + rel); continue; }
    if ((await sha256Hex(files[path])) !== expected) problems.push('Checksum mismatch: ' + rel);
  }
  return problems;
}

/** A stable fingerprint of the delivery, used to stop the same ZIP being imported twice. */
export async function deliveryFingerprint(pkg) {
  return sha256Hex(JSON.stringify(Object.entries(pkg.checksums).sort(([a], [b]) => a.localeCompare(b))));
}

/** Build a shot-list record (the shape validateShotList accepts) from a package and uploaded reference IDs. */
export function buildDeliveryShotList(pkg, refs, { name, fingerprint, now = new Date().toISOString() }) {
  const shots = pkg.shots.map((s, i) => {
    const ff = s.first_frame ? refs[s.first_frame.file] || '' : '', lf = s.last_frame ? refs[s.last_frame.file] || '' : '';
    return {
      id: s.shot_id, title: s.shot_id, prompt: s.first_frame_prompt, character_ids: [], reference_ids: lf ? [lf] : [],
      image_reference_id: ff, approved: false, scene_id: s.scene_id,
      panel: { shotType: '', cameraMove: '', lens: '', duration: s.duration_s, action: '', dialogue: '', notes: s.animation_prompt ? 'Animation prompt saved with this shot.' : '', templateKey: '' },
      xce_v3: {
        order: i + 1, scene_id: s.scene_id, shot_id: s.shot_id,
        first_frame_reference_id: ff, last_frame_reference_id: lf,
        first_frame_prompt: s.first_frame_prompt, last_frame_prompt: s.last_frame_prompt, animation_prompt: s.animation_prompt,
        continuity: s.continuity,
        source_sha256: { first_frame: s.first_frame ? pkg.checksums[s.first_frame.checksum_path] || '' : '', last_frame: s.last_frame ? pkg.checksums[s.last_frame.checksum_path] || '' : '' },
      },
    };
  });
  return {
    name: (name || ((pkg.project || 'Delivery') + ' · v3 delivery')).slice(0, 200), folder: 'Shots', generator: 'Other', mode: 'AS', shots,
    source: { format: DELIVERY_FORMAT, project: pkg.project, generator: pkg.generator, created: pkg.created, zip_name: pkg.zip_name, fingerprint, partial: pkg.partial, imported_at: now },
  };
}

/** Validate and normalize the additive v3 data on a shot (used by validateShotList). */
export function validateDeliveryShot(x, references) {
  need(x && typeof x === 'object' && !Array.isArray(x), 'Invalid v3 shot data');
  const out = {};
  out.order = Number.isInteger(x.order) && x.order > 0 && x.order <= 1000 ? x.order : 1;
  for (const k of ['scene_id', 'shot_id']) { need(typeof x[k] === 'string' && ID.test(x[k]), 'Invalid v3 ' + k); out[k] = x[k]; }
  for (const k of ['first_frame_reference_id', 'last_frame_reference_id']) {
    const v = x[k] ?? '';
    need(typeof v === 'string' && (!v || references[v]), 'v3 ' + k.replaceAll('_', ' ') + ' is not a saved image');
    out[k] = v;
  }
  for (const k of ['first_frame_prompt', 'last_frame_prompt', 'animation_prompt']) {
    const v = x[k] ?? '';
    need(typeof v === 'string' && v.length <= MAX_PROMPT_CHARS, 'Invalid v3 ' + k);
    out[k] = v;
  }
  const continuity = x.continuity ?? {};
  need(continuity && typeof continuity === 'object' && !Array.isArray(continuity) && JSON.stringify(continuity).length <= MAX_CONTINUITY_BYTES, 'v3 continuity record is invalid or too large');
  out.continuity = structuredClone(continuity);
  const sums = x.source_sha256 ?? {};
  out.source_sha256 = {};
  for (const k of ['first_frame', 'last_frame']) {
    const v = sums[k] ?? '';
    need(typeof v === 'string' && (!v || /^[0-9a-f]{64}$/.test(v)), 'Invalid v3 checksum');
    out.source_sha256[k] = v;
  }
  return out;
}

export function validateDeliverySource(x) {
  need(x && typeof x === 'object' && x.format === DELIVERY_FORMAT, 'Invalid delivery source');
  const out = { format: DELIVERY_FORMAT };
  for (const [k, max] of [['project', 200], ['generator', 80], ['created', 40], ['zip_name', 200], ['imported_at', 40]]) {
    const v = x[k] ?? '';
    need(typeof v === 'string' && v.length <= max, 'Invalid delivery ' + k);
    out[k] = v;
  }
  need(typeof x.fingerprint === 'string' && /^[0-9a-f]{64}$/.test(x.fingerprint), 'Invalid delivery fingerprint');
  out.fingerprint = x.fingerprint;
  out.partial = Boolean(x.partial);
  return out;
}
