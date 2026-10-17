import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isTrustedOrigin,
  MAX_ASSET_BYTES,
  MAX_DIRECT_ASSET_BYTES,
  parseAssetMetadata,
  storagePath,
} from '../lib/xstudio-validation.mjs';

function metadata(file, entries = {}) {
  return parseAssetMetadata(new Map(Object.entries(entries)), file);
}

test('browser mutation rejects absent and foreign origins', () => {
  const url = 'https://xstudio.xrkr80hd.studio/api/assets';
  assert.equal(isTrustedOrigin(new Request(url)), false);
  assert.equal(isTrustedOrigin(new Request(url, { headers: { origin: 'https://attacker.example' } })), false);
  assert.equal(isTrustedOrigin(new Request(url, { headers: { origin: 'https://xstudio.xrkr80hd.studio' } })), true);
});

test('asset validation rejects oversized, active-content, and forged project metadata', () => {
  assert.match(metadata({ name: 'clip.mp4', type: 'video/mp4', size: MAX_ASSET_BYTES + 1 }).error, /file/);
  assert.equal(metadata({ name: 'page.html', type: 'text/html', size: 10 }).error, 'Unsupported file type.');
  assert.equal(metadata({ name: 'clip.mp4', type: 'video/mp4', size: 10 }, { project_id: 'not-a-uuid' }).error, 'Invalid project ID.');
});

test('direct upload can validate a video above the function upload limit', () => {
  const file = { name: 'video.mp4', type: 'video/mp4', size: MAX_ASSET_BYTES + 1 };
  assert.ok(parseAssetMetadata(new Map(), file, MAX_DIRECT_ASSET_BYTES).value);
});

test('storage paths stay under the supplied owner prefix', () => {
  const owner = '58cb3584-ac53-4aa4-b9bb-83b9851f0540';
  assert.match(storagePath(owner, '../../escape.mp4'), new RegExp(`^${owner}/[a-f0-9-]{36}\\.mp4$`));
});
