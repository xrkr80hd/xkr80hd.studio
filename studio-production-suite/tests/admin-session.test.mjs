import test from 'node:test';
import assert from 'node:assert/strict';

process.env.ADMIN_SESSION_TOKEN = 'test-secret-token';
const auth = await import('../lib/admin-auth.js');

test('signed admin session names the user who logged in', () => {
  const value = auth.createAdminSessionValue('jessie_v');
  assert.equal(auth.getAdminSessionUser(value), 'jessie_v');
  assert.equal(auth.isAdminSessionValid(value), true);
});

test('editing the username inside the session is rejected', () => {
  const value = auth.createAdminSessionValue('jessie_v');
  const forged = value.replace('jessie_v', 'xrkr80hdadmin');
  assert.equal(auth.getAdminSessionUser(forged), '');
  assert.equal(auth.isAdminSessionValid(forged), false);
});

test('the old shared token alone no longer counts as a session', () => {
  assert.equal(auth.isAdminSessionValid('test-secret-token'), false);
});

test('expired sessions are rejected', () => {
  const value = auth.createAdminSessionValue('xrkr80hdadmin', Date.now() - 8 * 24 * 3600 * 1000);
  assert.equal(auth.getAdminSessionUser(value), '');
});

test('usernames with dots still round-trip', () => {
  const value = auth.createAdminSessionValue('first.last');
  assert.equal(auth.getAdminSessionUser(value), 'first.last');
});
