import {getSupabaseAdmin} from './supabase-admin';
import {getAdminConfig,isOwnerUsername} from './admin-auth';
import {GAME_COOKIE,readGameSession,gameCredentialVersion} from './game-night-session.mjs';
export function gameDb(){const db=getSupabaseAdmin();if(!db)throw Error('Game storage unavailable');return db;}
export async function gameIdentity(request){const secret=getAdminConfig().sessionToken;const session=readGameSession(request.cookies.get(GAME_COOKIE)?.value,secret);if(!session)return null;const username=session.username;if(isOwnerUsername(username))return {username,owner:true};const {data,error}=await gameDb().from('game_night_hosts').select('username,is_enabled,password_hash').eq('username',username).maybeSingle();if(error||!data?.is_enabled||session.credentialVersion!==gameCredentialVersion(data.password_hash,secret))return null;return {username,owner:false};}
export function sameOrigin(request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function smallJson(request,limit=3800000){if(Number(request.headers.get('content-length')||0)>limit)throw Error('Request too large');const text=await request.text();if(Buffer.byteLength(text)>limit)throw Error('Request too large');return JSON.parse(text);}
export const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
