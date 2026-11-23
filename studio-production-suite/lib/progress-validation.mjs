export const PROGRESS_BUCKET = 'progress-photos';
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export const MAX_PHOTOS_PER_POST = 12;
export const MAX_TITLE = 140;
export const MAX_BODY = 8000;
export const PHOTO_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

export function photoType(name) {
  return PHOTO_TYPES[String(name).split('.').pop().toLowerCase()] || '';
}

export function safePhotoName(name) {
  return String(name || '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);
}

const PATH_RE = /^posts\/[0-9a-f-]{36}-[a-zA-Z0-9._-]+$/;
export function validPhotoPath(path) {
  return typeof path === 'string' && PATH_RE.test(path) && Boolean(photoType(path));
}

export function parseProgressPost(raw) {
  const title = String(raw?.title ?? '').trim();
  const body = String(raw?.body ?? '').replace(/\r\n/g, '\n').trim();
  const photos = Array.isArray(raw?.photo_paths) ? raw.photo_paths : [];
  if (title.length > MAX_TITLE) throw new Error(`Keep the title to ${MAX_TITLE} characters.`);
  if (body.length > MAX_BODY) throw new Error(`Keep the update to ${MAX_BODY} characters.`);
  if (photos.length > MAX_PHOTOS_PER_POST) throw new Error(`Add up to ${MAX_PHOTOS_PER_POST} photos per update.`);
  if (!photos.every(validPhotoPath)) throw new Error('One of the photos is invalid. Please upload it again.');
  const photo_paths = [...new Set(photos)];
  if (!title && !body && photo_paths.length === 0) throw new Error('Write something or add a photo first.');
  return { title, body, photo_paths };
}
