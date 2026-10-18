import {createHash} from 'node:crypto';
import {createRemoteJWKSet,jwtVerify} from 'jose';

export const RESOURCE='https://xstudio.xrkr80hd.studio/mcp';
export const SCOPE='asset:read';
export const digest=value=>createHash('sha256').update(value).digest('hex');
export class GatewayError extends Error {
 constructor(message,status=400){super(message);this.status=status;}
}
const fail=(message,status)=>{throw new GatewayError(message,status);};
const jwksCache=new Map();
const httpsURL=value=>{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.hash||u.search)throw Error('Invalid HTTPS configuration');return u;};
export function settings(env=process.env){
 const grants=JSON.parse(env.XSTUDIO_MCP_GRANTS||'[]');
 if(!Array.isArray(grants)||grants.length>200)throw Error('Invalid grant configuration');
 for(const g of grants){
  if(!g||!['api','oauth'].includes(g.type)||!Array.isArray(g.projects)||!g.projects.length||g.projects.length>1000||g.projects.some(p=>typeof p!=='string'||! /^[\w-]{1,80}$/.test(p))||!Number.isFinite(Date.parse(g.expires_at)))throw Error('Invalid grant configuration');
  if(g.type==='api'&&!/^[a-f0-9]{64}$/.test(g.token_sha256))throw Error('Invalid API grant');
  if(g.type==='oauth'&&(typeof g.subject!=='string'||!g.subject||typeof g.client_id!=='string'||!g.client_id))throw Error('Invalid OAuth grant');
 }
 const origins=(env.XSTUDIO_MCP_ORIGINS||'https://xstudio.xrkr80hd.studio').split(',').map(s=>s.trim());
 for(const origin of origins)if(httpsURL(origin).origin!==origin)throw Error('Invalid origin configuration');
 const issuer=env.XSTUDIO_MCP_OAUTH_ISSUER||'https://xstudio.xrkr80hd.studio';
 const jwks=env.XSTUDIO_MCP_OAUTH_JWKS||null;
 if(issuer){httpsURL(issuer);if(issuer!=='https://xstudio.xrkr80hd.studio')httpsURL(jwks);}
 if(grants.some(g=>g.type==='oauth')&&!issuer)throw Error('OAuth issuer not configured');
 if(grants.length&&!/^xst_[a-f0-9]{64}$/.test(env.XSTUDIO_MCP_UPSTREAM_TOKEN||''))throw Error('Read-only backend credential not configured');
 if(!/^[a-f0-9-]{36}$/i.test(env.XSTUDIO_OWNER_USER_ID||''))throw Error('Owner not configured');
 return {grants,origins,issuer,jwks,owner:env.XSTUDIO_OWNER_USER_ID,upstreamToken:env.XSTUDIO_MCP_UPSTREAM_TOKEN};
}
export function checkOrigin(request,config){
 const origin=request.headers.get('origin');
 if(origin&&!config.origins.includes(origin))fail('Origin not allowed',403);
 if(new URL(request.url).search)fail('Query parameters are not accepted',400);
}
export async function authenticate(request,config,{verify=jwtVerify,keySet}={}){
 const header=request.headers.get('authorization')||'';
 if(header.length>8192||!/^Bearer [^\s]+$/.test(header))fail('Authentication required',401);
 const raw=header.slice(7);let grant,backendToken,principal;
 if(/^xmo_[a-f0-9]{64}$/.test(raw)){const {oauthService,redisStore,credentialCipher}=await import('../oauth/core.mjs');const {stateSecret}=await import('../oauth/state.mjs');const cipher=credentialCipher(stateSecret());return oauthService({store:redisStore(),owner:config.owner,upstreamToken:config.upstreamToken,unseal:value=>cipher.open(value)}).access(raw);}
 if(/^xmc_[a-f0-9]{64}$/.test(raw)){
  grant=config.grants.find(g=>g.type==='api'&&g.token_sha256===digest(raw));
  backendToken=config.upstreamToken;principal='api:'+digest(raw);
 }else{
  if(!config.issuer)fail('Invalid credential',401);
  try{
   let keys=keySet;
   if(!keys){if(!jwksCache.has(config.jwks))jwksCache.set(config.jwks,createRemoteJWKSet(new URL(config.jwks),{timeoutDuration:5000,cooldownDuration:30000}));keys=jwksCache.get(config.jwks);}
   const {payload,protectedHeader}=await verify(raw,keys,{issuer:config.issuer,audience:RESOURCE,algorithms:['RS256','ES256'],requiredClaims:['sub','exp','iat','client_id'],maxTokenAge:'1h',clockTolerance:5});
   if(protectedHeader.typ!=='at+jwt'||typeof payload.sub!=='string'||typeof payload.client_id!=='string'||!Number.isFinite(payload.exp)||payload.exp*1000<=Date.now())fail('Invalid credential',401);
   if(typeof payload.scope!=='string'||!payload.scope.split(' ').includes(SCOPE))fail('Read scope required',403);
   grant=config.grants.find(g=>g.type==='oauth'&&g.subject===payload.sub&&g.client_id===payload.client_id);
   principal='oauth:'+digest(config.issuer+'|'+payload.sub+'|'+payload.client_id);backendToken=config.upstreamToken;
  }catch(error){if(error instanceof GatewayError)throw error;fail('Invalid credential',401);}
 }
 if(!grant||Date.parse(grant.expires_at)<=Date.now())fail('Invalid credential',401);
 return {projects:new Set(grant.projects),backendToken,principal,owner:config.owner};
}

// Atomic shared fixed windows. No in-memory fallback on serverless instances.
export function redisLimiter(env=process.env,fetcher=fetch){
 return async(key,limit)=>{
  if(env.XSTUDIO_MCP_STATE_TOKEN){const {databaseLimiter}=await import('../oauth/state.mjs');return databaseLimiter(env,fetcher)(key,limit);}
  if(!env.XSTUDIO_MCP_REDIS_URL||!env.XSTUDIO_MCP_REDIS_TOKEN)fail('Rate limiter not configured',503);
  const url=httpsURL(env.XSTUDIO_MCP_REDIS_URL);
  const script="local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],120) end; return n";
  let response;
  try{response=await fetcher(url,{method:'POST',headers:{authorization:'Bearer '+env.XSTUDIO_MCP_REDIS_TOKEN,'content-type':'application/json'},body:JSON.stringify(['EVAL',script,'1','xstudio:mcp:'+digest(key)+':'+Math.floor(Date.now()/60000)]),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw Error();const data=await response.json();if(!Number.isInteger(data.result)||data.result<1)throw Error();if(data.result>limit)fail('Rate limit exceeded',429);
  }catch(error){if(error instanceof GatewayError)throw error;fail('Rate limiter unavailable',503);}
 };
}
export function resourceMetadata(config){
 return {resource:RESOURCE,...(config.issuer?{authorization_servers:[config.issuer]}:{}),scopes_supported:[SCOPE],bearer_methods_supported:['header'],resource_name:'XSTUDIO read-only reference gateway'};
}
