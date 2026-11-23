import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgressPost, validPhotoPath, photoType } from '../lib/progress-validation.mjs';
import { cleanName, makeInviteToken, makeLinkToken, makeSessionToken, normalizeEmail, verifyToken } from '../lib/progress-family.mjs';

const SECRET = 'test-secret';
const PHOTO = 'posts/123e4567-e89b-12d3-a456-426614174000-beach.jpg';

test('posts need some content and only accept valid photo paths', () => {
  assert.throws(() => parseProgressPost({ title: ' ', body: '' }), /Write something/);
  assert.deepEqual(parseProgressPost({ body: ' hi \r\nthere ', photo_paths: [PHOTO, PHOTO] }), { title: '', body: 'hi \nthere', photo_paths: [PHOTO] });
  assert.throws(() => parseProgressPost({ body: 'x', photo_paths: ['../secret.jpg'] }), /invalid/);
  assert.equal(validPhotoPath('posts/123e4567-e89b-12d3-a456-426614174000-a.exe'), false);
  assert.equal(photoType('IMG_1.JPEG'), 'image/jpeg');
});

test('emails and names are normalized', () => {
  assert.equal(normalizeEmail(' Aunt.May@Example.COM '), 'aunt.may@example.com');
  assert.equal(normalizeEmail('not an email'), '');
  assert.equal(cleanName('  Aunt <b>May</b>  '), 'Aunt bMay/b');
});

test('tokens verify only for their own kind, secret and lifetime', () => {
  const now = Date.now();
  const link = makeLinkToken({ email: 'a@b.co', name: 'A' }, SECRET, now);
  assert.equal(verifyToken(link, 'link', SECRET, now).e, 'a@b.co');
  assert.equal(verifyToken(link, 'session', SECRET, now), null);
  assert.equal(verifyToken(link, 'link', 'other-secret', now), null);
  assert.equal(verifyToken(link, 'link', SECRET, now + 2 * 60 * 60 * 1000), null);
  const session = makeSessionToken('a@b.co', SECRET, now);
  assert.ok(verifyToken(session, 'session', SECRET, now + 29 * 24 * 60 * 60 * 1000));
  assert.equal(verifyToken(session, 'session', SECRET, now + 31 * 24 * 60 * 60 * 1000), null);
  const [body, sig] = session.split('.');
  const forged = Buffer.from(JSON.stringify({ k: 'session', e: 'x@y.co', exp: 9e9 })).toString('base64url');
  assert.equal(verifyToken(`${forged}.${sig}`, 'session', SECRET, now), null);
  assert.ok(body);
  assert.ok(verifyToken(makeInviteToken(SECRET, now), 'invite', SECRET, now));
  assert.equal(verifyToken('', 'session', SECRET), null);
});
