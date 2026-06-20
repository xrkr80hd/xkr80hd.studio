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

export function isAdminSessionValid(cookieValue) {
  const { sessionToken } = getAdminConfig();
  return Boolean(sessionToken) && cookieValue === sessionToken;
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
