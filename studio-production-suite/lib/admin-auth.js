import { hmacSha256Hex, safeEqual } from './hmac-sha256.mjs';

export const ADMIN_SESSION_COOKIE = 'xrkr_admin_session';
export const ADMIN_SESSION_USER_COOKIE = 'xrkr_admin_user';
const MASTER_OWNER_USERNAME = 'xrkr80hdadmin';

function getEnv(name, fallback = '') {
  return String(process.env[name] || fallback || '').trim();
}

function parseCredentialPair(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const separatorIndex = raw.indexOf(':');
  if (separatorIndex <= 0) {
    return null;
  }

  const username = raw.slice(0, separatorIndex).trim();
  const password = raw.slice(separatorIndex + 1).trim();

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

function getAdminAccounts() {
  const multi = getEnv('ADMIN_LOGIN_CREDENTIALS');
  const parsedMulti = multi
    .split(/[,;\n]/)
    .map((entry) => parseCredentialPair(entry))
    .filter(Boolean);

  const fallback = parseCredentialPair(`${getEnv('ADMIN_LOGIN_USERNAME', 'admin')}:${getEnv('ADMIN_LOGIN_PASSWORD')}`);
  const combined = [...parsedMulti, ...(fallback ? [fallback] : [])];
  const unique = [];
  const seen = new Set();

  for (const account of combined) {
    const key = `${account.username.toLowerCase()}::${account.password}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(account);
  }

  return unique;
}

export function getAdminConfig() {
  return {
    accounts: getAdminAccounts(),
    sessionToken: getEnv('ADMIN_SESSION_TOKEN'),
  };
}

export function isAdminConfigReady() {
  const { sessionToken } = getAdminConfig();
  return Boolean(sessionToken);
}

// Session cookies are signed per user: "v2~<username>~<expiresAtSeconds>~<hmac>".
// The old design gave every admin the same shared token and trusted a separate,
// unsigned username cookie, so anyone signed in could edit that cookie to act as
// the owner. Now the username lives inside the signed value and cannot be changed.
const SESSION_VERSION = 'v2';
const SEP = '~';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSignature(sessionToken, username, expiresAt) {
  return hmacSha256Hex(sessionToken, `admin-session:${SESSION_VERSION}:${username}:${expiresAt}`);
}

export function createAdminSessionValue(username, nowMs = Date.now()) {
  const { sessionToken } = getAdminConfig();
  const safeUser = String(username || '').trim().toLowerCase();
  if (!sessionToken || !safeUser || /[^a-z0-9._-]/.test(safeUser)) {
    return '';
  }
  const expiresAt = Math.floor(nowMs / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  return [SESSION_VERSION, safeUser, expiresAt, sessionSignature(sessionToken, safeUser, expiresAt)].join(SEP);
}

// The only trusted way to know who is signed in to admin.
export function getAdminSessionUser(cookieValue, nowMs = Date.now()) {
  const { sessionToken } = getAdminConfig();
  const parts = String(cookieValue || '').split(SEP);
  if (!sessionToken || parts.length !== 4 || parts[0] !== SESSION_VERSION) {
    return '';
  }
  const [, username, expiresRaw, signature] = parts;
  const expiresAt = Number.parseInt(expiresRaw, 10);
  if (!username || /[^a-z0-9._-]/.test(username) || !Number.isFinite(expiresAt) || expiresAt * 1000 < nowMs) {
    return '';
  }
  return safeEqual(signature, sessionSignature(sessionToken, username, expiresAt)) ? username : '';
}

export function isAdminSessionValid(cookieValue) {
  return Boolean(getAdminSessionUser(cookieValue));
}

export function areAdminCredentialsValid(username, password) {
  return Boolean(matchEnvAdminCredentials(username, password));
}

export function matchEnvAdminCredentials(username, password) {
  const config = getAdminConfig();
  if (!config.accounts.length || !config.sessionToken) {
    return null;
  }

  const safeUser = String(username || '').trim().toLowerCase();
  const safePass = String(password || '');

  const match = config.accounts.find((account) => account.username.toLowerCase() === safeUser && account.password === safePass);
  return match ? match.username : null;
}

export function getAdminOwnerUsername() {
  return getEnv('ADMIN_OWNER_USERNAME', MASTER_OWNER_USERNAME).toLowerCase();
}

export function getConfiguredAdminUsernames() {
  return getAdminAccounts().map((account) => String(account.username || '').trim().toLowerCase()).filter(Boolean);
}

export function isOwnerUsername(username) {
  const safeUser = String(username || '').trim().toLowerCase();
  if (!safeUser) {
    return false;
  }

  return safeUser === MASTER_OWNER_USERNAME || safeUser === getAdminOwnerUsername();
}

// "View as visitor": a signed-in admin can browse public pages exactly as the
// public sees them. The cookie only ever hides admin extras, so it is safe to
// set from the browser.
export const VIEW_AS_COOKIE = 'xrkr_view_as';

export function isVisitorView(jar) {
  return jar?.get?.(VIEW_AS_COOKIE)?.value === 'visitor';
}
