import {GatewayError,redisLimiter,settings} from '../mcp/security.mjs';
import {backend,readJSON} from '../mcp/data.mjs';
import {XSTUDIO_ENDPOINT} from '../xce/xstudio-bridge.mjs';
import {stateSecret} from './state.mjs';
import {cookieName,credentialCipher,discovery,ISSUER,oauthService,redisStore,safeReturn} from './core.mjs';

const headers={'cache-control':'private, no-store, max-age=0','pragma':'no-cache','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json=(value,status=200,extra={})=>Response.json(value,{status,headers:{...headers,...extra}});
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function ownerJWT(context){const {data,error}=await context.client.auth.getSession();if(error||!data.session?.access_token)throw new GatewayError('login_required',401);return data.session.access_token;}
export async function issueReadDelegation(context,name,{fetcher=fetch,secret=stateSecret(),scope='asset:read'}={}){
 const token=await ownerJWT(context),cipher=credentialCipher(secret);
 const r=await fetcher(XSTUDIO_ENDPOINT+'?resource=tokens',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({label:'MCP OAuth: '+name.slice(0,90),provider:'mcp-oauth',scopes:scope.split(' ').some(s=>['asset:classify','asset:metadata'].includes(s))?['asset:read','asset:write']:['asset:read'],expires_in_days:31}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw new GatewayError('temporarily_unavailable',503);const result=await readJSON(r,16384);if(!/^xst_[a-f0-9]{64}$/.test(result.token||''))throw new GatewayError('temporarily_unavailable',503);return cipher.seal(result.token);
}
export function defaultService(context){
 const c=settings(),cipher=credentialCipher(stateSecret());
 return oauthService({store:redisStore(),owner:c.owner,upstreamToken:c.upstreamToken,delegate:context?(name,scope)=>issueReadDelegation(context,name,{scope}):undefined,unseal:value=>cipher.open(value)});
}
export function metadata(){return json(discovery());}
async function fields(req){
 const bytes=await readJSONBody(req,16384),type=(req.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
 if(type==='application/json'){try{return JSON.parse(bytes);}catch{throw new GatewayError('invalid_request',400);}}
 if(type==='application/x-www-form-urlencoded'){const form=new URLSearchParams(bytes),out={};for(const [k,v]of form){if(Object.hasOwn(out,k))throw new GatewayError('invalid_request',400);out[k]=v;}return out;}
 throw new GatewayError('invalid_request',415);
}
async function readJSONBody(req,max){
 if(Number(req.headers.get('content-length'))>max)throw new GatewayError('invalid_request',413);
 const reader=req.body?.getReader();if(!reader)throw new GatewayError('invalid_request',400);const chunks=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();throw new GatewayError('invalid_request',413);}chunks.push(Buffer.from(value));}
 return Buffer.concat(chunks).toString('utf8');
}
const failure=e=>json({error:e instanceof GatewayError?e.message:'temporarily_unavailable'},e instanceof GatewayError?e.status:503);
function returnToClient(location,flow){
 // Finish the POST with a new document. A form-action 'self' policy on the
 // consent page can block a 303 chain to an external OAuth callback in Chrome.
 // Navigation from this new document is not a form submission. The destination
 // was already checked against the exact registered redirect before code issue.
 const target=escape(location);
 return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${target}"><title>Return to your app</title></head><body><main><h1>Return to your app</h1><p>Returning to your app…</p><p><a href="${target}" rel="noreferrer">Continue to your app</a></p></main></body></html>`,{status:200,headers:{...headers,'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'",'x-frame-options':'DENY','set-cookie':`${cookieName(flow)}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}});
}

export async function publicEndpoint(req,kind,deps={}){
 try{
  if(new URL(req.url).search)throw new GatewayError('invalid_request',400);
  const origin=req.headers.get('origin');if(origin&&!settings().origins.includes(origin))throw new GatewayError('access_denied',403);
  const limit=deps.limit||redisLimiter();await limit('oauth:'+kind,kind==='register'?20:120);
  const a=await fields(req);if(!a||typeof a!=='object'||Array.isArray(a))throw new GatewayError('invalid_request',400);
  const service=deps.service||defaultService();
  if(kind==='register')return json(await service.register(a),201);
  if(kind==='token')return json(await service.token(a));
  await service.revoke(a);return new Response(null,{status:200,headers});
 }catch(e){return failure(e);}
}
function consentHTML(f){
 const list=f.record.projects.map(p=>`<label><input type="checkbox" name="project" value="${escape(p.id)}"> ${escape(p.name||p.id)} <small>(${escape(p.id)})</small></label>`).join('');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect to XSTUDIO</title><style>body{background:#11151d;color:#f4f5f8;font:17px system-ui;margin:0;padding:24px}main{max-width:640px;margin:5vh auto}h1{font-size:30px}label{display:block;padding:14px;border:1px solid #505869;margin:8px 0}input{width:20px;height:20px;vertical-align:middle}small{color:#aeb8c9}button{padding:14px 20px;margin:14px 10px 0 0;font:inherit;cursor:pointer}code{overflow-wrap:anywhere}.client{border:1px solid #505869;padding:16px}p{line-height:1.5}</style></head><body><main><h1>Connect to XSTUDIO</h1><p class="client"><strong>${escape(f.record.client_name)}</strong><br>Return address: <code>${escape(f.record.redirect_uri)}</code></p><p>This app will be able to read the projects you select, including character sheets and reference images. ${f.record.scope?.split(' ').includes('asset:metadata')?'It may also edit descriptive metadata and versioned reusable prompts in those projects. Approved images, identity traits and approvals remain unchanged. It cannot delete assets.':f.record.scope?.split(' ').includes('asset:classify')?'It may also update asset classification metadata in those projects. It cannot change images, primary categories or approvals, or delete assets.':'It cannot edit or delete your work.'}</p><form method="post" action="/oauth/authorize"><input type="hidden" name="flow" value="${f.flow}"><input type="hidden" name="csrf" value="${f.csrf}"><h2>Choose projects</h2>${list||'<p>No unlocked projects are available. You can cancel and return after adding or unlocking a project.</p>'}<button type="submit" name="decision" value="approve"${list?'':' disabled'}>Allow selected projects</button><button type="submit" name="decision" value="deny">Cancel</button></form></main></body></html>`;
}
export async function authorize(req,deps={}){
 try{
  const limit=deps.limit||redisLimiter();await limit('oauth:authorize',120);
  const getOwner=deps.owner||(async()=>{const {requireOwner}=await import('../xstudio-server.js');return requireOwner();});
  const context=await getOwner();
  if(context.response){
   if(req.method==='GET'&&context.response.status===401){const next=safeReturn(new URL(req.url).pathname+new URL(req.url).search);return new Response(null,{status:303,headers:{...headers,location:ISSUER+'/login?next='+encodeURIComponent(next)}});}
   return json({error:context.response.status===401?'login_required':'access_denied'},context.response.status);
  }
  const service=deps.service||defaultService(context);
  if(req.method==='GET'){
   const u=new URL(req.url);if(u.search.length>12000)throw new GatewayError('invalid_request',400);
   const args={};for(const [k,v]of u.searchParams){if(Object.hasOwn(args,k))throw new GatewayError('invalid_request',400);args[k]=v;}
   const rows=(await (deps.read||backend(await ownerJWT(context)))({op:'projects'})).data;
   if(!Array.isArray(rows))throw new GatewayError('temporarily_unavailable',503);
   const projects=rows.flatMap(row=>{let m;try{m=JSON.parse(row.manifest);}catch{return [];}return m.deleted_at||m.folder_lock?[]:[{id:row.project,name:m.campaign_name||row.project}];});
   const f=await service.begin(args,projects);
   return new Response(consentHTML(f),{status:200,headers:{...headers,'referrer-policy':'strict-origin','content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",'x-frame-options':'DENY','set-cookie':`${cookieName(f.flow)}=${f.csrf}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`}});
  }
  if(req.headers.get('origin')!==ISSUER)throw new GatewayError('access_denied',403);
  const type=(req.headers.get('content-type')||'').split(';')[0];if(type!=='application/x-www-form-urlencoded')throw new GatewayError('invalid_request',415);
  const form=new URLSearchParams(await readJSONBody(req,16384));
  for(const k of ['flow','csrf','decision'])if(form.getAll(k).length!==1)throw new GatewayError('invalid_request',400);
  if(!['approve','deny'].includes(form.get('decision')))throw new GatewayError('invalid_request',400);
  const flow=form.get('flow'),cookie=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName(flow)+'='))?.split('=')[1];
  const location=await service.approve({flow,csrf:form.get('csrf'),cookie,projects:form.getAll('project'),approve:form.get('decision')==='approve'});
  return returnToClient(location,flow);
 }catch(e){return failure(e);}
}
