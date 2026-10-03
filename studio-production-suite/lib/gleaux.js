import { getSupabaseAdmin } from './supabase-admin';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_USER_COOKIE, isAdminSessionValid, isOwnerUsername } from './admin-auth';
export { GLEAUX_BUCKET } from './gleaux-validation.mjs';
export const GLEAUX_DEFAULTS = { title: 'Lets Gleaux', description: 'The track inspired by the Gleaux for the Girls event at Walker Automotive. For the fighters, the survivors, and everyone standing beside them.', player_path: null, download_path: null, downloads_enabled: true };
export function gleauxOwner(request) {
  return isAdminSessionValid(request.cookies.get(ADMIN_SESSION_COOKIE)?.value) && isOwnerUsername(request.cookies.get(ADMIN_SESSION_USER_COOKIE)?.value);
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
export async function getGleauxSettings() {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Gleaux storage is unavailable.');
  const { data, error } = await db.from('gleaux_settings').select('*').eq('id', 1).single();
  if (error) throw new Error('Could not load Gleaux settings.');
  return data;
}
export async function getGleauxCount() {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Gleaux storage is unavailable.');
  const { count, error } = await db.from('gleaux_download_events').select('request_id', { count: 'exact', head: true });
  if (error) throw new Error('Could not load download count.');
  return count || 0;
}
