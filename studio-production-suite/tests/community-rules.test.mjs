import test from 'node:test';
import assert from 'node:assert/strict';
import { checkUploadAllowed, isOwnStoragePath, mediaKindForMime, toHandle, validateProfile, validateSignup } from '../lib/community-rules.mjs';

const MB = 1024 * 1024;
const good = { email: 'Band@Example.com', display_name: 'The Rivercats', member_type: 'band', city: 'Alexandria', state: 'la', zip: '71301' };

test('a complete sign-up is accepted and cleaned', () => {
  const result = validateSignup(good);
  assert.equal(result.ok, true);
  assert.equal(result.value.email, 'band@example.com');
  assert.equal(result.value.state, 'LA');
  assert.equal(result.value.member_type, 'band');
});

test('sign-up needs a type, a city, a real state and a 5-digit ZIP', () => {
  assert.equal(validateSignup({ ...good, member_type: '' }).ok, false);
  assert.equal(validateSignup({ ...good, member_type: 'admin' }).ok, false);
  assert.equal(validateSignup({ ...good, city: '' }).ok, false);
  assert.equal(validateSignup({ ...good, state: 'ZZ' }).ok, false);
  assert.equal(validateSignup({ ...good, zip: '7130' }).ok, false);
  assert.equal(validateSignup({ ...good, email: 'nope' }).ok, false);
});

test('profile edits only return the fields that were sent', () => {
  const result = validateProfile({ tagline: '  Loud and local  ' });
  assert.deepEqual(result, { ok: true, value: { tagline: 'Loud and local' } });
  assert.equal(validateProfile({ website_url: 'javascript:alert(1)' }).ok, false);
  assert.equal(validateProfile({ website_url: 'https://example.com' }).ok, true);
});

test('upload limits: 3 songs, 2 videos, 12 photos with size caps', () => {
  assert.equal(checkUploadAllowed({ mime: 'audio/mpeg', size: 5 * MB, existingCount: 2 }).ok, true);
  assert.equal(checkUploadAllowed({ mime: 'audio/mpeg', size: 5 * MB, existingCount: 3 }).ok, false);
  assert.equal(checkUploadAllowed({ mime: 'video/mp4', size: 40 * MB, existingCount: 1 }).ok, true);
  assert.equal(checkUploadAllowed({ mime: 'video/mp4', size: 40 * MB, existingCount: 2 }).ok, false);
  assert.equal(checkUploadAllowed({ mime: 'video/mp4', size: 60 * MB, existingCount: 0 }).ok, false);
  assert.equal(checkUploadAllowed({ mime: 'image/png', size: 11 * MB, existingCount: 0 }).ok, false);
  assert.equal(checkUploadAllowed({ mime: 'application/pdf', size: MB, existingCount: 0 }).ok, false);
  assert.equal(mediaKindForMime('video/quicktime'), 'video');
});

test('members can only touch files inside their own folder', () => {
  const id = '6f1c2b8e-0000-4000-8000-000000000001';
  assert.equal(isOwnStoragePath(id, `${id}/audio/a.mp3`), true);
  assert.equal(isOwnStoragePath(id, `other-id/audio/a.mp3`), false);
  assert.equal(isOwnStoragePath(id, `${id}/../other/a.mp3`), false);
});

test('handles are url-safe', () => {
  assert.equal(toHandle('Café Rouge & Co.'), 'cafe-rouge-co');
  assert.equal(toHandle('!!'), 'member-local');
});
