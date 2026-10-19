import {CLASSIFY_SCOPE,METADATA_SCOPE} from '../mcp/security.mjs';
import {randomBytes,timingSafeEqual,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {digest,GatewayError,RESOURCE,SCOPE} from '../mcp/security.mjs';
import {databaseStore} from './state.mjs';

export const ISSUER='https://xstudio.xrkr80hd.studio';
export const random=()=>randomBytes(32).toString('hex');
const fail=(error,status=400)=>{const e=new GatewayError(error,status);e.oauth=true;throw e;};
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export const cookieName=id=>'__Host-xstudio_oauth_'+id;
export function discovery(){return {issuer:ISSUER,authorization_endpoint:ISSUER+'/oauth/authorize',token_endpoint:ISSUER+'/oauth/token',registration_endpoint:ISSUER+'/oauth/register',revocation_endpoint:ISSUER+'/oauth/revoke',response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],token_endpoint_auth_methods_supported:['none'],revocation_endpoint_auth_methods_supported:['none'],code_challenge_methods_supported:['S256'],scopes_supported:[SCOPE,CLASSIFY_SCOPE,METADATA_SCOPE],authorization_response_iss_parameter_supported:true};}
export function redirectURI(value){
 if(typeof value!=='string'||value.length>2048||/[\s]/.test(value))fail('invalid_redirect_uri');
 let u;try{u=new URL(value);}catch{fail('invalid_redirect_uri');}
 if(u.username||u.password||u.hash||value.length>2048||!((u.protocol==='https:')||(u.protocol==='http:'&&['127.0.0.1','[::1]'].includes(u.hostname))))fail('invalid_redirect_uri');
 return value;
}
export {safeReturn} from './return-path.mjs';
export function redisStore(env=process.env,fetcher=fetch){
 if(env.XSTUDIO_MCP_STATE_TOKEN)return databaseStore(env,fetcher);
 async function command(args){
  if(!env.XSTUDIO_MCP_REDIS_URL||!env.XSTUDIO_MCP_REDIS_TOKEN)fail('temporarily_unavailable',503);
  const url=new URL(env.XSTUDIO_MCP_REDIS_URL);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)fail('temporarily_unavailable',503);
  try{const r=await fetcher(url,{method:'POST',headers:{authorization:'Bearer '+env.XSTUDIO_MCP_REDIS_TOKEN,'content-type':'application/json'},body:JSON.stringify(args),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error();const v=await r.json();if(v.error)throw Error();return v.result;}catch{fail('temporarily_unavailable',503);}
 }
 const key=k=>'xstudio:oauth:'+k;
 return {
  async get(k){const v=await command(['GET',key(k)]);return v?JSON.parse(v):null;},
  async put(k,v,seconds){if(await command(['SET',key(k),JSON.stringify(v),'EX',String(seconds),'NX'])!=='OK')fail('temporarily_unavailable',503);},
  async take(k){const v=await command(['GETDEL',key(k)]);return v?JSON.parse(v):null;},
  async remove(k){await command(['DEL',key(k)]);},
  async rotate(k,expected,tombstone,seconds){
   const result=await command(['EVAL',"local v=redis.call('GET',KEYS[1]); if v~=ARGV[1] then return 0 end; redis.call('DEL',KEYS[1]); redis.call('SET',KEYS[2],'1','EX',ARGV[2]); return 1",'2',key(k),key(tombstone),JSON.stringify(expected),String(seconds)]);return result===1;
  },
  async used(k){return Boolean(await command(['EXISTS',key(k)]));}
 };
}
function checkScope(scope){if(scope!==undefined&&(typeof scope!=='string'||!scope.split(' ').includes(SCOPE)||scope.split(' ').some(s=>![SCOPE,CLASSIFY_SCOPE,METADATA_SCOPE].includes(s))))fail('invalid_scope');}
export function credentialCipher(secret){
 if(typeof secret!=='string'||secret.length<32)fail('temporarily_unavailable',503);
 const key=createHash('sha256').update('xstudio-oauth-delegation-v1:'+secret).digest();
 return {
  seal(token){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const bytes=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),bytes]).toString('base64url');},
  open(value){try{const bytes=Buffer.from(value,'base64url');if(bytes.length<29||bytes.length>1024)throw Error();const decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(12,28));const token=Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8');if(!/^xst_[a-f0-9]{64}$/.test(token))throw Error();return token;}catch{fail('invalid_token',401);}}
 };
}
export function oauthService({store,owner,upstreamToken,delegate,unseal,now=()=>Date.now()}){
 const expiry=seconds=>now()+seconds*1000;
 async function client(id){if(typeof id!=='string'||!/^xoc_[a-f0-9]{64}$/.test(id))fail('invalid_client',401);const c=await store.get('client:'+id);if(!c)fail('invalid_client',401);return c;}
 async function family(id){const g=await store.get('family:'+id);if(!g||g.expires_at<=now()||g.owner!==owner)fail('invalid_grant');return g;}
 async function issue(g,id){
  const access='xmo_'+random(),refresh='xmr_'+id+'.'+random();
  await store.put('access:'+digest(access),{family:id,client_id:g.client_id,expires_at:expiry(900)},900);
  await store.put('refresh:'+digest(refresh),{family:id,client_id:g.client_id,expires_at:g.expires_at},Math.max(1,Math.ceil((g.expires_at-now())/1000)));
  return {access_token:access,token_type:'Bearer',expires_in:900,refresh_token:refresh,scope:g.scope||SCOPE};
 }
 return {
  async register(a){
   if(!a||typeof a!=='object'||Array.isArray(a)||typeof a.client_name!=='string'||!a.client_name.trim()||a.client_name.length>150||!Array.isArray(a.redirect_uris)||a.redirect_uris.length<1||a.redirect_uris.length>10)fail('invalid_client_metadata');
   if(a.token_endpoint_auth_method&&a.token_endpoint_auth_method!=='none')fail('invalid_client_metadata');
   if(a.grant_types&&(!Array.isArray(a.grant_types)||a.grant_types.some(g=>!['authorization_code','refresh_token'].includes(g))))fail('invalid_client_metadata');
   if(a.response_types&&(!Array.isArray(a.response_types)||a.response_types.length!==1||a.response_types[0]!=='code'))fail('invalid_client_metadata');
   checkScope(a.scope);const c={client_id:'xoc_'+random(),client_name:a.client_name.trim(),redirect_uris:[...new Set(a.redirect_uris.map(redirectURI))],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code'],scope:a.scope||SCOPE,client_id_issued_at:Math.floor(now()/1000)};
   await store.put('client:'+c.client_id,c,365*86400);return c;
  },
  async begin(a,projects){
   const c=await client(a.client_id);if(!c.redirect_uris.includes(a.redirect_uri))fail('invalid_redirect_uri');
   if(a.response_type!=='code')fail('unsupported_response_type');checkScope(a.scope);
   if(a.resource!==RESOURCE)fail('invalid_target');
   if(a.code_challenge_method!=='S256'||typeof a.code_challenge!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(a.code_challenge))fail('invalid_request');
   if(a.state!==undefined&&(typeof a.state!=='string'||a.state.length>2048))fail('invalid_request');
   const flow=random(),csrf=random();
   const record={client_id:c.client_id,client_name:c.client_name,redirect_uri:a.redirect_uri,challenge:a.code_challenge,state:a.state||'',resource:RESOURCE,scope:a.scope||SCOPE,owner,csrf_hash:digest(csrf),projects:projects.map(p=>({id:p.id,name:p.name})),expires_at:expiry(600)};
   await store.put('flow:'+flow,record,600);return {flow,csrf,record};
  },
  async approve({flow,csrf,cookie,projects,approve}){
   if(!/^[a-f0-9]{64}$/.test(flow||''))fail('invalid_request');
   const f=await store.get('flow:'+flow);
   if(!f||f.owner!==owner||f.expires_at<=now()||!equal(csrf,cookie)||!equal(digest(csrf||''),f.csrf_hash))fail('invalid_request');
   if(!Array.isArray(projects)||projects.some(p=>!f.projects.some(x=>x.id===p))||new Set(projects).size!==projects.length||approve&&projects.length===0)fail('invalid_request');
   if(!await store.take('flow:'+flow))fail('invalid_request');
   const redirect=new URL(f.redirect_uri);redirect.searchParams.set('iss',ISSUER);if(f.state)redirect.searchParams.set('state',f.state);
   if(!approve){redirect.searchParams.set('error','access_denied');return redirect.toString();}
   const credential=delegate?await delegate(f.client_name,f.scope||SCOPE):null;
   const code='xcode_'+random();await store.put('code:'+digest(code),{...f,projects,...(credential?{backend_credential:credential}:{}),expires_at:expiry(60)},60);redirect.searchParams.set('code',code);return redirect.toString();
  },
  async token(a){
   const c=await client(a.client_id);if(a.resource!==RESOURCE)fail('invalid_target');checkScope(a.scope);
   if(a.grant_type==='authorization_code'){
    if(typeof a.code!=='string'||!/^xcode_[a-f0-9]{64}$/.test(a.code)||typeof a.code_verifier!=='string'||! /^[A-Za-z0-9._~-]{43,128}$/.test(a.code_verifier))fail('invalid_grant');
    const key='code:'+digest(a.code),f=await store.get(key);
    if(!f||f.expires_at<=now()||f.owner!==owner||f.client_id!==c.client_id||f.redirect_uri!==a.redirect_uri||!equal(f.challenge,Buffer.from(digest(a.code_verifier),'hex').toString('base64url')))fail('invalid_grant');
    if(a.scope&&a.scope.split(' ').some(s=>!(f.scope||SCOPE).split(' ').includes(s)))fail('invalid_scope');
    if(!await store.take(key))fail('invalid_grant');
    const id=random(),g={owner,client_id:c.client_id,projects:f.projects,scope:f.scope||SCOPE,expires_at:expiry(30*86400),resource:RESOURCE,...(f.backend_credential?{backend_credential:f.backend_credential}:{})};await store.put('family:'+id,g,30*86400);return issue(g,id);
   }
   if(a.grant_type==='refresh_token'){
    const match=/^xmr_([a-f0-9]{64})\.[a-f0-9]{64}$/.exec(a.refresh_token||'');if(!match)fail('invalid_grant');
    const id=match[1],g=await family(id);if(a.scope&&a.scope.split(' ').some(s=>!(g.scope||SCOPE).split(' ').includes(s)))fail('invalid_scope');if(g.client_id!==c.client_id)fail('invalid_grant');
    const key='refresh:'+digest(a.refresh_token),tombstone='used:'+digest(a.refresh_token),r=await store.get(key);
    if(!r){if(await store.used(tombstone))await store.remove('family:'+id);fail('invalid_grant');}
    if(r.family!==id||r.client_id!==c.client_id||r.expires_at<=now())fail('invalid_grant');
    if(!await store.rotate(key,r,tombstone,Math.max(1,Math.ceil((g.expires_at-now())/1000)))){await store.remove('family:'+id);fail('invalid_grant');}
    return issue(g,id);
   }
   fail('unsupported_grant_type');
  },
  async access(raw){
   if(!/^xmo_[a-f0-9]{64}$/.test(raw||''))fail('invalid_token',401);
   const r=await store.get('access:'+digest(raw));if(!r||r.expires_at<=now())fail('invalid_token',401);
   let g;try{g=await family(r.family);}catch{fail('invalid_token',401);}
   if(r.client_id!==g.client_id||g.resource!==RESOURCE)fail('invalid_token',401);
   return {scopes:new Set((g.scope||SCOPE).split(' ')),projects:new Set(g.projects),principal:'oauth:'+digest(r.family),owner,backendToken:g.backend_credential?unseal(g.backend_credential):upstreamToken};
  },
  async revoke(a){
   const c=await client(a.client_id);const raw=a.token||'';let familyId;
   if(/^xmo_[a-f0-9]{64}$/.test(raw)){const r=await store.get('access:'+digest(raw));if(r?.client_id===c.client_id)familyId=r.family;}
   if(/^xmr_[a-f0-9]{64}\.[a-f0-9]{64}$/.test(raw)){const r=await store.get('refresh:'+digest(raw));if(r?.client_id===c.client_id)familyId=r.family;else if(await store.used('used:'+digest(raw))){const id=raw.slice(4,68);const g=await store.get('family:'+id);if(g?.client_id===c.client_id)familyId=id;}}
   if(familyId)await store.remove('family:'+familyId);
  }
 };
}
