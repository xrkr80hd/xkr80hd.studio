import { createHmac, timingSafeEqual } from 'node:crypto';

export const RECOVERY_COOKIE = 'xstudio-recovery';
export const RECOVERY_SECONDS = 600;

function recoveryKey() {
  const encoded = process.env.XSTUDIO_RECOVERY_COOKIE_SECRET || '';
  if (!/^[A-Za-z0-9_-]{43,}$/.test(encoded)) return null;
  const key = Buffer.from(encoded, 'base64url');
  return key.length >= 32 ? key : null;
}

export function recoveryReady() {
  return Boolean(recoveryKey());
}

export function signRecoveryGrant(userId, sessionId, now = Date.now()) {
  const key = recoveryKey();
  if (!key || !userId || !sessionId) return null;
  const payload = Buffer.from(JSON.stringify({ u: userId, s: sessionId, e: Math.floor(now / 1000) + RECOVERY_SECONDS })).toString('base64url');
  const mac = createHmac('sha256', key).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

export function verifyRecoveryGrant(token, userId, sessionId, now = Date.now()) {
  const key = recoveryKey();
  if (!key || typeof token !== 'string' || token.length > 1024 || !userId || !sessionId) return false;
  const [payload, mac, extra] = token.split('.');
  if (!payload || !mac || extra || !/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]{43}$/.test(mac)) return false;
  const expected = createHmac('sha256', key).update(payload).digest();
  const actual = Buffer.from(mac, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const grant = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const second = Math.floor(now / 1000);
    return grant.u === userId && grant.s === sessionId && Number.isInteger(grant.e) && grant.e > second && grant.e <= second + RECOVERY_SECONDS;
  } catch {
    return false;
  }
}
