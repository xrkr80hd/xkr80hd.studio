import { isUuid } from './xstudio-validation.mjs';

const ALLOWED_SCOPES = new Set(['asset:read', 'asset:write']);

export function parseTokenRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Invalid token request.' };
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const provider = typeof body.provider === 'string' ? body.provider.trim().toLowerCase() : '';
  const scopes = body.scopes;
  const days = body.expires_in_days === undefined ? 30 : body.expires_in_days;
  if (!label || label.length > 80 || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(provider)) return { error: 'Invalid label or provider.' };
  if (!Array.isArray(scopes) || !scopes.length || scopes.length > 2 || new Set(scopes).size !== scopes.length || scopes.some(scope => !ALLOWED_SCOPES.has(scope))) {
    return { error: 'Invalid token scopes.' };
  }
  if (!Number.isInteger(days) || days < 1 || days > 90) return { error: 'Invalid expiry.' };
  return { value: { label, provider, scopes, expires_in_days: days } };
}

export function parseCredentialId(value) {
  return isUuid(value) ? value : null;
}
