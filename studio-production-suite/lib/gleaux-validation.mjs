export const GLEAUX_BUCKET = 'gleaux-audio';
export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;
export const AUDIO_TYPES = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg', flac: 'audio/flac' };
export function audioType(name) { return AUDIO_TYPES[String(name).split('.').pop().toLowerCase()] || ''; }
export function validAudioPath(path, slot) {
  return typeof path === 'string' && new RegExp(`^${slot}/[a-zA-Z0-9._-]+$`).test(path) && Boolean(audioType(path));
}
export function parseGleauxSettings(raw) {
  const title = String(raw.title || '').trim();
  const description = String(raw.description || '').trim();
  if (!title || title.length > 100 || description.length > 600) throw new Error('Enter a title (up to 100 characters) and description (up to 600).');
  return { title, description, downloads_enabled: raw.downloads_enabled === true };
}
