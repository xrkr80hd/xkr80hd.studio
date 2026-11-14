import {getSupabaseAdmin} from './supabase-admin';
import {getAdminConfig} from './admin-auth';
import {GAME_COOKIE,readGameSession,gameCredentialVersion} from './game-night-session.mjs';
export function isGameOwner(username){const configured=process.env.GAME_NIGHT_OWNER_USERNAME||getAdminConfig().accounts[0]?.username;return !!configured&&String(username).toLowerCase()===configured.toLowerCase();}
export async function gameOwnerCredentialVersion(username){if(!isGameOwner(username))return null;const {data,error}=await gameDb().from('admin_users').select('password_hash,is_enabled').eq('username',username).maybeSingle();if(error)throw Error('Site admin lookup unavailable');if(data)return data.is_enabled?gameCredentialVersion(data.password_hash,getAdminConfig().sessionToken):null;const account=getAdminConfig().accounts.find(a=>a.username.toLowerCase()===username.toLowerCase());return account?gameCredentialVersion(account.password,getAdminConfig().sessionToken):null;}
export function gameDb(){const db=getSupabaseAdmin();if(!db)throw Error('Game storage unavailable');return db;}
export async function gameIdentity(request){const secret=getAdminConfig().sessionToken;const session=readGameSession(request.cookies.get(GAME_COOKIE)?.value,secret);if(!session)return null;const username=session.username;if(isGameOwner(username)){const version=await gameOwnerCredentialVersion(username);return version&&session.credentialVersion===version?{username,owner:true}:null;}const {data,error}=await gameDb().from('game_night_hosts').select('username,is_enabled,password_hash').eq('username',username).maybeSingle();if(error||!data?.is_enabled||session.credentialVersion!==gameCredentialVersion(data.password_hash,secret))return null;return {username,owner:false};}
export function sameOrigin(request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function smallJson(request,limit=3800000){if(Number(request.headers.get('content-length')||0)>limit)throw Error('Request too large');const text=await request.text();if(Buffer.byteLength(text)>limit)throw Error('Request too large');return JSON.parse(text);}
export const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};

export function mediaPaths(value,out=new Set()){if(!value||typeof value!=='object')return out;if(typeof value.storagePath==='string')out.add(value.storagePath);for(const child of Object.values(value))mediaPaths(child,out);return out;}
// Media in a snapshot that belongs to another Game Master is allowed only when a shared category uses it.
export async function sharedMediaFor(value,username,db=gameDb()){const foreign=[...mediaPaths(value)].filter(p=>!p.startsWith(username+'/'));if(!foreign.length)return new Set();const {data,error}=await db.from('game_night_categories').select('media_paths').overlaps('media_paths',foreign);if(error)throw Error('Could not check shared media');const shared=new Set(data.flatMap(row=>row.media_paths));return new Set(foreign.filter(p=>shared.has(p)));}

// Signed URLs are bearer links for the current game, refreshed when its owner loads a workspace.
// sharedPaths: media referenced by a category in the shared library, which every Game Master may use.
export async function refreshGameMedia(snapshot,username,db=gameDb(),sharedPaths=new Set()){
  const paths=new Set();
  function collect(value){if(!value||typeof value!=="object")return;if(typeof value.storagePath==='string'){if(value.storagePath.includes('..')||!(value.storagePath.startsWith(username+'/')||sharedPaths.has(value.storagePath)))throw Error('Invalid media owner');paths.add(value.storagePath);}for(const child of Object.values(value))collect(child);}
  collect(snapshot);if(!paths.size)return snapshot;
  const {data,error}=await db.storage.from('game-night-media').createSignedUrls([...paths],86400);
  if(error)throw Error('Could not refresh clue media');
  const urls=new Map(data.filter(item=>item.signedUrl).map(item=>[item.path,item.signedUrl]));
  function apply(value){if(!value||typeof value!=="object")return;if(value.storagePath){if(!urls.has(value.storagePath))throw Error('Clue media unavailable');value.data=urls.get(value.storagePath);}for(const child of Object.values(value))apply(child);}
  apply(snapshot);return snapshot;
}

