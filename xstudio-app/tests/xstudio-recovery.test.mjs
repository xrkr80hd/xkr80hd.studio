import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { signRecoveryGrant, verifyRecoveryGrant } from '../lib/xstudio-recovery.mjs';

test('recovery grant is signed, short-lived, and bound to the owner session', () => {
  const previous = process.env.XSTUDIO_RECOVERY_COOKIE_SECRET;
  process.env.XSTUDIO_RECOVERY_COOKIE_SECRET = randomBytes(32).toString('base64url');
  try {
    const now = 1_800_000_000_000;
    const grant = signRecoveryGrant('owner-id', 'session-id', now);
    assert.equal(verifyRecoveryGrant(grant, 'owner-id', 'session-id', now), true);
    assert.equal(verifyRecoveryGrant(grant, 'other-id', 'session-id', now), false);
    assert.equal(verifyRecoveryGrant(grant, 'owner-id', 'other-session', now), false);
    assert.equal(verifyRecoveryGrant(grant, 'owner-id', 'session-id', now + 601_000), false);
    assert.equal(verifyRecoveryGrant(`${grant}x`, 'owner-id', 'session-id', now), false);
  } finally {
    if (previous === undefined) delete process.env.XSTUDIO_RECOVERY_COOKIE_SECRET;
    else process.env.XSTUDIO_RECOVERY_COOKIE_SECRET = previous;
  }
});
