// Family sign-in for /progress: stateless signed tokens (no passwords).
// A short-lived link token is emailed (or made by the owner); opening it sets a 30-day session cookie.
import { createHmac, timingSafeEqual } from 'crypto';

export const FAMILY_COOKIE = 'xrkr_progress_family';
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const EMAIL_LINK_SECONDS = 60 * 60;
export const INVITE_LINK_SECONDS = 7 * 24 * 60 * 60;

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : '';
}

export function cleanName(value) {
  return String(value || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function familyKey(secret) {
  if (!secret) throw new Error('Family sign-in secret is not configured.');
  return createHmac('sha256', String(secret)).update('progress-family-v1').digest();
}

function b64(value) {
  return Buffer.from(value).toString('base64url');
}

export function signToken(payload, secret) {
  const body = b64(JSON.stringify(payload));
  const sig = createHmac('sha256', familyKey(secret)).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token, kind, secret, now = Date.now()) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig || !secret) return null;
  const expected = createHmac('sha256', familyKey(secret)).update(body).digest();
  let given;
  try { given = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
  if (!payload || payload.k !== kind || typeof payload.exp !== 'number' || payload.exp * 1000 < now) return null;
  if (kind !== 'invite' && !normalizeEmail(payload.e)) return null;
  return payload;
}

export function makeLinkToken({ email, name = '' }, secret, now = Date.now()) {
  return signToken({ k: 'link', e: email, n: cleanName(name), exp: Math.floor(now / 1000) + EMAIL_LINK_SECONDS }, secret);
}

// Owner-made invite: anyone who opens it within 7 days enters their name and email, no email round trip.
export function makeInviteToken(secret, now = Date.now()) {
  return signToken({ k: 'invite', exp: Math.floor(now / 1000) + INVITE_LINK_SECONDS }, secret);
}

export function makeSessionToken(email, secret, now = Date.now()) {
  return signToken({ k: 'session', e: email, exp: Math.floor(now / 1000) + SESSION_SECONDS }, secret);
}
