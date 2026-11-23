// Pure rules for YourLocal community accounts. No database or network here,
// so every rule can be unit tested.

export const MEMBER_TYPES = [
  { key: 'business', label: 'Local business', blurb: 'Shops, restaurants, services and makers.' },
  { key: 'band', label: 'Band', blurb: 'Groups writing, releasing or playing out.' },
  { key: 'artist', label: 'Artist', blurb: 'Solo musicians, visual artists and creators.' },
  { key: 'podcast', label: 'Podcast', blurb: 'Local shows, interviews and audio series.' },
  { key: 'blogger', label: 'Blogger', blurb: 'Writers covering the local scene.' },
];

export const MEMBER_TYPE_KEYS = MEMBER_TYPES.map((type) => type.key);

export const COMMUNITY_BUCKET = 'community';
export const MEMBER_COOKIE = 'yl_member';
export const MEMBER_SESSION_SECONDS = 60 * 60 * 24 * 30;

const MB = 1024 * 1024;

// Per-member upload allowance. Kept small on purpose for staging.
export const MEDIA_LIMITS = {
  audio: { count: 3, maxBytes: 25 * MB, label: 'songs or episodes' },
  video: { count: 2, maxBytes: 50 * MB, label: 'videos' },
  image: { count: 12, maxBytes: 10 * MB, label: 'photos' },
};

const MIME_KIND = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/x-m4a': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/ogg': 'audio',
  'audio/flac': 'audio',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
};

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'PR', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

function text(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/.test(email) ? email : '';
}

export function toHandle(value) {
  const base = String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return base.length >= 3 ? base : `${base || 'member'}-local`.slice(0, 40);
}

export function mediaKindForMime(mime) {
  return MIME_KIND[String(mime || '').toLowerCase()] || '';
}

export function safeFileName(name) {
  const cleaned = String(name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+/, '')
    .slice(-80);
  return cleaned || 'file';
}

// Checks the sign-up details. Returns { ok, value } or { ok: false, error }.
export function validateSignup(input = {}) {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, error: 'Enter a valid email address.' };
  const profile = validateProfile(input, { requireLocation: true });
  if (!profile.ok) return profile;
  if (!MEMBER_TYPE_KEYS.includes(profile.value.member_type)) return { ok: false, error: 'Pick what kind of account this is.' };
  return { ok: true, value: { ...profile.value, email } };
}

// Checks editable profile fields. Only fields that are present are returned.
export function validateProfile(input = {}, { requireLocation = false } = {}) {
  const value = {};

  if (input.display_name !== undefined || requireLocation) {
    const name = text(input.display_name, 80);
    if (name.length < 2) return { ok: false, error: 'Enter a name with at least 2 characters.' };
    value.display_name = name;
  }

  if (input.member_type !== undefined) {
    const type = String(input.member_type || '').trim().toLowerCase();
    if (!MEMBER_TYPE_KEYS.includes(type)) return { ok: false, error: 'Pick what kind of account this is.' };
    value.member_type = type;
  }

  if (input.city !== undefined || requireLocation) {
    const city = text(input.city, 80);
    if (requireLocation && city.length < 2) return { ok: false, error: 'Enter your city or town.' };
    value.city = city || null;
  }

  if (input.state !== undefined || requireLocation) {
    const state = String(input.state || '').trim().toUpperCase();
    if (!US_STATES.includes(state)) return { ok: false, error: 'Pick your state.' };
    value.state = state;
  }

  if (input.zip !== undefined || requireLocation) {
    const zip = String(input.zip || '').trim().slice(0, 5);
    if (!/^[0-9]{5}$/.test(zip)) return { ok: false, error: 'Enter a 5-digit ZIP code.' };
    value.zip = zip;
  }

  if (input.tagline !== undefined) value.tagline = text(input.tagline, 140) || null;
  if (input.bio !== undefined) value.bio = String(input.bio ?? '').trim().slice(0, 2000) || null;

  if (input.website_url !== undefined) {
    const raw = String(input.website_url || '').trim().slice(0, 300);
    if (raw && !/^https:\/\/[^\s]+\.[^\s]+$/i.test(raw)) return { ok: false, error: 'Website must start with https://' };
    value.website_url = raw || null;
  }

  return { ok: true, value };
}

// Decides whether one more file of this kind and size is allowed.
export function checkUploadAllowed({ mime, size, existingCount }) {
  const kind = mediaKindForMime(mime);
  if (!kind) return { ok: false, error: 'That file type is not supported. Use JPG, PNG, WebP, MP3, M4A, WAV, OGG, FLAC, MP4, WebM or MOV.' };
  const limit = MEDIA_LIMITS[kind];
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) return { ok: false, error: 'The file looks empty.' };
  if (bytes > limit.maxBytes) return { ok: false, error: `That file is too big. ${capitalize(kind)} files can be up to ${Math.round(limit.maxBytes / MB)} MB.` };
  if (Number(existingCount) >= limit.count) return { ok: false, error: `You can have up to ${limit.count} ${limit.label}. Remove one to add another.` };
  return { ok: true, kind };
}

// A storage path is only accepted if it sits inside the member's own folder.
export function isOwnStoragePath(memberId, path) {
  const safePath = String(path || '');
  return Boolean(memberId) && safePath.startsWith(`${memberId}/`) && !safePath.includes('..') && !safePath.includes('//');
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
