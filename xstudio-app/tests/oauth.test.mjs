import test from 'node:test';
import assert from 'node:assert/strict';
import {oauthService,redirectURI,safeReturn,discovery,ISSUER,cookieName,redisStore} from '../lib/oauth/core.mjs';
import {authorize,publicEndpoint} from '../lib/oauth/http.mjs';
import {digest,RESOURCE,settings} from '../lib/mcp/security.mjs';
import {gateway} from '../lib/mcp/server.mjs';
const owner='11111111-1111-4111-8111-111111111111',upstreamToken='xst_'+'a'.repeat(64);
function setup(){
 let time=Date.now();const records=new Map();
 const store={async get(k){const v=records.get(k);return v&&v.until>time?structuredClone(v.data):null;},async put(k,v,ttl){if(await store.get(k))throw Error('duplicate');records.set(k,{data:structuredClone(v),until:time+ttl*1000});},async take(k){const v=await store.get(k);if(!records.has(k))return null;records.delete(k);return v;},async remove(k){records.delete(k);},async rotate(k,v,t,ttl){const current=records.get(k);if(!current||JSON.stringify(current.data)!==JSON.stringify(v))return false;records.delete(k);records.set(t,{data:1,until:time+ttl*1000});return true;},async used(k){return !!await store.get(k);}};
 const service=oauthService({store,owner,upstreamToken,now:()=>time});return {service,records,store,advance:ms=>{time+=ms;}};
}
const verifier='a'.repeat(43),challenge=Buffer.from(digest(verifier),'hex').toString('base64url');
const callback='https://client.example/callback';
async function pending(s,overrides={}){const client=await s.register({client_name:'Test client',redirect_uris:[callback]});const args={client_id:client.client_id,redirect_uri:callback,response_type:'code',resource:RESOURCE,scope:'asset:read',code_challenge:challenge,code_challenge_method:'S256',state:'roundtrip-state',...overrides};return {client,args,flow:await s.begin(args,[{id:'P',name:'Exact project'},{id:'OTHER',name:'Other'}])};}
const consent=(f,extra={})=>({flow:f.flow.flow,csrf:f.flow.csrf,cookie:f.flow.csrf,projects:['P'],approve:true,...extra});
async function approved(s){const f=await pending(s);const uri=new URL(await s.approve(consent(f)));return {...f,code:uri.searchParams.get('code'),uri};}
const exchange=f=>({client_id:f.client.client_id,code:f.code,redirect_uri:callback,grant_type:'authorization_code',resource:RESOURCE,code_verifier:verifier});
async function issued(s){const f=await approved(s);return {...f,tokens:await s.token(exchange(f))};}

test('discovery exposes native issuer, DCR, consent, token, revocation and S256',()=>{const d=discovery();assert.equal(d.issuer,ISSUER);assert.equal(d.authorization_endpoint,ISSUER+'/oauth/authorize');assert.ok(d.registration_endpoint);assert.deepEqual(d.code_challenge_methods_supported,['S256']);assert.deepEqual(d.token_endpoint_auth_methods_supported,['none']);});
test('native issuer is advertised without an external provider',()=>{const c=settings({XSTUDIO_OWNER_USER_ID:owner});assert.equal(c.issuer,ISSUER);});
test('registration creates a public client, never an access grant',async()=>{const {service,records}=setup();const c=await service.register({client_name:'Grok test',redirect_uris:[callback]});assert.match(c.client_id,/^xoc_/);assert.equal(c.client_secret,undefined);assert.equal([...records.keys()].filter(k=>k.startsWith('family:')).length,0);});
for(const uri of ['http://evil.example/callback','https://client.example/cb#frag','javascript:alert(1)','https://user:password@client.example/cb','file:///tmp/a'])test('redirect validation rejects '+uri,()=>assert.throws(()=>redirectURI(uri)));
test('loopback literal HTTP callback allowed; localhost hostname is not',()=>{assert.equal(redirectURI('http://127.0.0.1:19876/callback'),'http://127.0.0.1:19876/callback');assert.throws(()=>redirectURI('http://localhost:1234/callback'));});
test('DCR rejects write scopes and unsupported client authentication',async()=>{const {service}=setup();await assert.rejects(service.register({client_name:'bad',redirect_uris:[callback],scope:'asset:write'}));await assert.rejects(service.register({client_name:'bad',redirect_uris:[callback],token_endpoint_auth_method:'client_secret_post'}));});
test('unregistered and mismatched redirect never issue authorization codes',async()=>{const {service}=setup();const f=await pending(service);await assert.rejects(service.begin({...f.args,redirect_uri:'https://evil.example/cb'},[]));await assert.rejects(service.begin({...f.args,client_id:'xoc_'+'b'.repeat(64)},[]));});
for(const overrides of [{code_challenge_method:'plain'},{code_challenge:''},{resource:'https://other.example/mcp'},{scope:'asset:write'},{response_type:'token'}])test('authorization rejects '+JSON.stringify(overrides),async()=>{await assert.rejects(pending(setup().service,overrides));});
test('explicit consent binds state, exact callback, owner and selected projects',async()=>{const {service}=setup();const f=await approved(service);assert.equal(f.uri.origin,'https://client.example');assert.equal(f.uri.searchParams.get('state'),'roundtrip-state');assert.equal(f.uri.searchParams.get('iss'),ISSUER);const t=await service.token(exchange(f));const a=await service.access(t.access_token);assert.deepEqual([...a.projects],['P']);assert.equal(a.owner,owner);assert.equal(a.backendToken,upstreamToken);});
test('no preselected projects and no consent means no token',async()=>{const {service}=setup();const f=await pending(service);await assert.rejects(service.approve(consent(f,{projects:[]})));await assert.rejects(service.access('xmo_'+'b'.repeat(64)));});
test('consent rejects forged CSRF, missing browser cookie and foreign project',async()=>{const {service}=setup();const f=await pending(service);for(const v of [{csrf:'forged'},{cookie:undefined},{projects:['FORBIDDEN']}])await assert.rejects(service.approve(consent(f,v)));});
test('cancel returns access_denied and no code',async()=>{const {service}=setup();const f=await pending(service);const u=new URL(await service.approve(consent(f,{approve:false,projects:[]})));assert.equal(u.searchParams.get('error'),'access_denied');assert.equal(u.searchParams.get('code'),null);});
test('consent form and authorization code are single-use, including concurrent redemption',async()=>{const {service}=setup();const f=await approved(service);await assert.rejects(service.approve(consent(f)));const r=await Promise.allSettled([service.token(exchange(f)),service.token(exchange(f))]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);});
test('PKCE rejects wrong verifier and never downgrades to plain',async()=>{const {service}=setup();const f=await approved(service);await assert.rejects(service.token({...exchange(f),code_verifier:'b'.repeat(43)}));assert.ok((await service.token(exchange(f))).access_token);});
test('token exchange bound to client, redirect and resource',async()=>{const {service}=setup();const f=await approved(service),other=await service.register({client_name:'Other',redirect_uris:[callback]});for(const a of [{client_id:other.client_id},{redirect_uri:'https://client.example/wrong'},{resource:'https://other.example'}])await assert.rejects(service.token({...exchange(f),...a}));});
test('authorization codes expire after sixty seconds',async()=>{const {service,advance}=setup();const f=await approved(service);advance(61000);await assert.rejects(service.token(exchange(f)));});
test('access tokens expire after fifteen minutes',async()=>{const {service,advance}=setup();const f=await issued(service);advance(901000);await assert.rejects(service.access(f.tokens.access_token));});
test('refresh rotates credentials and retains only consented project scopes',async()=>{const {service,advance}=setup();const f=await issued(service);advance(901000);const t=await service.token({grant_type:'refresh_token',client_id:f.client.client_id,resource:RESOURCE,refresh_token:f.tokens.refresh_token});assert.notEqual(t.refresh_token,f.tokens.refresh_token);assert.deepEqual([...(await service.access(t.access_token)).projects],['P']);});
test('refresh-token reuse revokes the entire family including newly issued tokens',async()=>{const {service}=setup();const f=await issued(service);const a={grant_type:'refresh_token',client_id:f.client.client_id,resource:RESOURCE,refresh_token:f.tokens.refresh_token};const t=await service.token(a);await assert.rejects(service.token(a));await assert.rejects(service.access(t.access_token));await assert.rejects(service.access(f.tokens.access_token));});
test('refresh grant expires after thirty days',async()=>{const {service,advance}=setup();const f=await issued(service);advance(31*86400000);await assert.rejects(service.token({grant_type:'refresh_token',client_id:f.client.client_id,resource:RESOURCE,refresh_token:f.tokens.refresh_token}));});
test('revocation immediately invalidates access and refresh tokens',async()=>{const {service}=setup();const f=await issued(service);await service.revoke({client_id:f.client.client_id,token:f.tokens.access_token});await assert.rejects(service.access(f.tokens.access_token));await assert.rejects(service.token({grant_type:'refresh_token',client_id:f.client.client_id,resource:RESOURCE,refresh_token:f.tokens.refresh_token}));});
test('different client cannot revoke another client grant',async()=>{const {service}=setup();const f=await issued(service),other=await service.register({client_name:'Other',redirect_uris:[callback]});await service.revoke({client_id:other.client_id,token:f.tokens.access_token});assert.ok(await service.access(f.tokens.access_token));});
test('only credential hashes are persisted; no raw access/refresh/code/CSRF values',async()=>{const {service,records}=setup();const f=await issued(service);const text=JSON.stringify([...records.entries()]);for(const secret of [f.code,f.flow.csrf,f.tokens.access_token,f.tokens.refresh_token])assert.ok(!text.includes(secret));});
test('login return accepts only local OAuth authorization paths',()=>{for(const p of ['https://evil.example','//evil.example','/api/secret','/oauth/authorize?x=1\nLocation:bad'])assert.equal(safeReturn(p),'/');assert.equal(safeReturn('/oauth/authorize?client_id=a'),'/oauth/authorize?client_id=a');});
const getRequest=args=>new Request(ISSUER+'/oauth/authorize?'+new URLSearchParams(args));
const httpDeps=s=>({service:s,limit:async()=>{},owner:async()=>({user:{id:owner}}),read:async()=>({data:[{project:'P',manifest:JSON.stringify({campaign_name:'<script>bad</script>'})},{project:'LOCKED',manifest:JSON.stringify({folder_lock:{}})},{project:'TRASH',manifest:JSON.stringify({deleted_at:'date'})}]})});
test('consent HTML escapes client/project names, hides locked/deleted projects and sets secure cookie/CSP',async()=>{const {service}=setup();const f=await pending(service);const r=await authorize(getRequest(f.args),httpDeps(service)),html=await r.text();assert.equal(r.status,200);assert.ok(html.includes('&lt;script&gt;bad&lt;/script&gt;'));assert.ok(!html.includes('value="LOCKED"'));assert.ok(!html.includes('value="TRASH"'));assert.ok(!html.includes(' checked'));assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(r.headers.get('referrer-policy'),'strict-origin');});
test('unauthenticated consent redirects to existing login with safe return',async()=>{const {service}=setup(),f=await pending(service);const r=await authorize(getRequest(f.args),{...httpDeps(service),owner:async()=>({response:new Response(null,{status:401})})});assert.equal(r.status,303);const target=new URL(r.headers.get('location'));assert.equal(target.pathname,'/login');assert.ok(target.searchParams.get('next').startsWith('/oauth/authorize?'));});
test('cross-origin consent POST blocked before issuing credentials',async()=>{const {service}=setup();const r=await authorize(new Request(ISSUER+'/oauth/authorize',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/x-www-form-urlencoded'},body:'flow=bad'}),httpDeps(service));assert.equal(r.status,403);});
test('browser consent roundtrip issues code after explicit selected-project approval',async()=>{const {service}=setup(),f=await pending(service),deps=httpDeps(service);const get=await authorize(getRequest(f.args),deps),html=await get.text(),flow=/name="flow" value="([a-f0-9]+)"/.exec(html)[1],csrf=/name="csrf" value="([a-f0-9]+)"/.exec(html)[1];const post=await authorize(new Request(ISSUER+'/oauth/authorize',{method:'POST',headers:{origin:ISSUER,cookie:cookieName(flow)+'='+csrf,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({flow,csrf,project:'P',decision:'approve'})}),deps);assert.equal(post.status,200);const result=await post.text();const callbackURL=/href="([^"]+)"/.exec(result)[1].replaceAll('&amp;','&');const code=new URL(callbackURL).searchParams.get('code');assert.match(code,/^xcode_/);});
test('public registration and token endpoints use bounded JSON/form bodies and OAuth errors',async()=>{const {service}=setup(),deps={service,limit:async()=>{}};const register=await publicEndpoint(new Request(ISSUER+'/oauth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({client_name:'Native',redirect_uris:[callback]})}),'register',deps);assert.equal(register.status,201);const bad=await publicEndpoint(new Request(ISSUER+'/oauth/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'client_id=unknown'}),'token',deps);assert.equal(bad.status,401);assert.equal((await bad.json()).error,'invalid_client');const large=await publicEndpoint(new Request(ISSUER+'/oauth/register',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(16385)}),'register',deps);assert.equal(large.status,413);});
test('native authorized token reaches MCP handshake/tool discovery; revoked token denied',async()=>{const {service}=setup(),f=await issued(service);const deps={config:settings({XSTUDIO_OWNER_USER_ID:owner}),limit:async()=>{},audit:()=>{},backend:async()=>({data:null}),authenticate:request=>service.access(request.headers.get('authorization').slice(7))};const req=()=>new Request(RESOURCE,{method:'POST',headers:{authorization:'Bearer '+f.tokens.access_token,'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})});const r=await gateway(req(),deps);assert.equal((await r.json()).result.tools.length,24);await service.revoke({client_id:f.client.client_id,token:f.tokens.access_token});assert.equal((await gateway(req(),deps)).status,401);});
test('Redis OAuth store fails closed and uses atomic GETDEL/EVAL for single-use state',async()=>{await assert.rejects(redisStore({}).get('x'),/temporarily/);const calls=[];const store=redisStore({XSTUDIO_MCP_REDIS_URL:'https://redis.example',XSTUDIO_MCP_REDIS_TOKEN:'secret'},async(url,init)=>{const a=JSON.parse(init.body);calls.push(a);return Response.json({result:a[0]==='EVAL'?1:null});});await store.take('code:hash');await store.rotate('refresh:hash',{family:'id'},'used:hash',20);assert.equal(calls[0][0],'GETDEL');assert.equal(calls[1][0],'EVAL');});

test('complete native OAuth flow over real HTTP: discovery, registration, consent, PKCE, MCP SDK, refresh, revocation',async()=>{
 const {createServer}=await import('node:http');
 const {Client}=await import('@modelcontextprotocol/sdk/client/index.js');
 const {StreamableHTTPClientTransport}=await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
 const {service}=setup(),deps=httpDeps(service);
 const nativeConfig=settings({XSTUDIO_OWNER_USER_ID:owner});
 const http=createServer(async(req,res)=>{
  try{
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const request=new Request(ISSUER+req.url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
   const path=new URL(request.url).pathname;let r;
   if(path==='/.well-known/oauth-authorization-server')r=Response.json(discovery());
   else if(path==='/oauth/authorize')r=await authorize(request,deps);
   else if(path.startsWith('/oauth/'))r=await publicEndpoint(request,path.split('/').at(-1),deps);
   else r=await gateway(request,{config:nativeConfig,limit:async()=>{},audit:()=>{},backend:async()=>({data:null}),authenticate:request=>service.access(request.headers.get('authorization').slice(7)),execute:async(name,args)=>({project_id:args.project_id,name:'Actual test project'})});
   res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));
  }catch{res.writeHead(500);res.end();}
 });
 await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+http.address().port;
 const post=async(path,body)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
 let mcp;
 try{
  const d=await (await fetch(base+'/.well-known/oauth-authorization-server')).json();assert.equal(d.issuer,ISSUER);
  const registration=await fetch(base+'/oauth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({client_name:'HTTP integration client',redirect_uris:[callback]})});assert.equal(registration.status,201);const c=await registration.json();
  const args={client_id:c.client_id,redirect_uri:callback,resource:RESOURCE,response_type:'code',scope:'asset:read',code_challenge:challenge,code_challenge_method:'S256',state:'http-state'};
  const page=await fetch(base+'/oauth/authorize?'+new URLSearchParams(args)),html=await page.text();assert.equal(page.status,200);
  const flow=/name="flow" value="([a-f0-9]+)"/.exec(html)[1],csrf=/name="csrf" value="([a-f0-9]+)"/.exec(html)[1];
  const consent=await fetch(base+'/oauth/authorize',{method:'POST',redirect:'manual',headers:{origin:ISSUER,cookie:cookieName(flow)+'='+csrf,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({flow,csrf,project:'P',decision:'approve'})});assert.equal(consent.status,200);
  const returnPage=await consent.text();assert.ok(returnPage.includes('http-equiv="refresh"'));assert.equal(consent.headers.get('referrer-policy'),'no-referrer');const redirect=new URL(/href="([^"]+)"/.exec(returnPage)[1].replaceAll('&amp;','&'));assert.equal(redirect.searchParams.get('state'),'http-state');
  const exchanged=await post('/oauth/token',{grant_type:'authorization_code',client_id:c.client_id,resource:RESOURCE,redirect_uri:callback,code:redirect.searchParams.get('code'),code_verifier:verifier});assert.equal(exchanged.status,200);const tokens=await exchanged.json();
  mcp=new Client({name:'native-oauth-sdk-test',version:'1'});await mcp.connect(new StreamableHTTPClientTransport(new URL(base+'/mcp'),{requestInit:{headers:{authorization:'Bearer '+tokens.access_token}}}));
  assert.equal((await mcp.listTools()).tools.length,24);assert.equal((await mcp.callTool({name:'get_project',arguments:{project_id:'P'}})).structuredContent.project_id,'P');
  const refreshed=await post('/oauth/token',{grant_type:'refresh_token',client_id:c.client_id,resource:RESOURCE,refresh_token:tokens.refresh_token});assert.equal(refreshed.status,200);const next=await refreshed.json();assert.notEqual(next.refresh_token,tokens.refresh_token);
  assert.equal((await post('/oauth/revoke',{client_id:c.client_id,token:next.refresh_token})).status,200);
  const denied=await fetch(base+'/mcp',{method:'POST',headers:{authorization:'Bearer '+next.access_token,'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})});assert.equal(denied.status,401);
 }finally{if(mcp)await mcp.close();http.closeAllConnections();await new Promise(resolve=>http.close(resolve));}
});

test('consent creates a read-only delegation only after approval and stores it encrypted',async()=>{
 const {credentialCipher}=await import('../lib/oauth/core.mjs');const {store,records}=setup(),cipher=credentialCipher('s'.repeat(64));let calls=0;
 const service=oauthService({store,owner,delegate:async()=>{calls++;return cipher.seal(upstreamToken);},unseal:v=>cipher.open(v)});
 const f=await pending(service);assert.equal(calls,0);await assert.rejects(service.approve(consent(f,{csrf:'bad'})));assert.equal(calls,0);
 const location=await service.approve(consent(f)),code=new URL(location).searchParams.get('code');assert.equal(calls,1);
 const tokens=await service.token(exchange({...f,code}));assert.equal((await service.access(tokens.access_token)).backendToken,upstreamToken);assert.ok(!JSON.stringify([...records]).includes(upstreamToken));
 const encrypted=cipher.seal(upstreamToken);assert.equal(cipher.open(encrypted),upstreamToken);assert.throws(()=>cipher.open('corrupted'));assert.throws(()=>credentialCipher('different'.repeat(8)).open(encrypted));
});

test('delegation calls only existing owner token endpoint with read-only scope; browser session never persisted',async()=>{
 const {issueReadDelegation}=await import('../lib/oauth/http.mjs'),{credentialCipher}=await import('../lib/oauth/core.mjs');const secret='s'.repeat(64);let submitted;
 const value=await issueReadDelegation({client:{auth:{getSession:async()=>({data:{session:{access_token:'owner-session-secret'}}})}}},'Test client',{secret,fetcher:async(url,init)=>{assert.equal(url,'https://osbsjjoxepxezcmupcak.supabase.co/functions/v1/xstudio-assets-api?resource=tokens');assert.equal(init.headers.authorization,'Bearer owner-session-secret');submitted=JSON.parse(init.body);assert.equal(init.redirect,'error');return Response.json({token:upstreamToken});}});
 assert.deepEqual(submitted.scopes,['asset:read']);assert.equal(submitted.expires_in_days,31);assert.equal(credentialCipher(secret).open(value),upstreamToken);assert.ok(!value.includes('owner-session-secret'));
 await assert.rejects(issueReadDelegation({client:{auth:{getSession:async()=>({data:{},error:new Error()})}}},'Test',{secret}),/login_required/);
});

test('Fuchsia durable adapter pins backend, sends server credential in header, and fails closed',async()=>{
 const {databaseStore,databaseLimiter,stateCall,stateSecret}=await import('../lib/oauth/state.mjs');const env={XSTUDIO_MCP_STATE_TOKEN:'xst_'+'f'.repeat(64)};const calls=[];
 const fetcher=async(url,init)=>{assert.equal(url,'https://osbsjjoxepxezcmupcak.supabase.co/functions/v1/xstudio-oauth-state');assert.equal(init.headers.authorization,'Bearer '+env.XSTUDIO_MCP_STATE_TOKEN);assert.equal(init.redirect,'error');const a=JSON.parse(init.body);calls.push(a);return Response.json({result:a.op==='get'?{saved:true}:a.op==='limit'?61:true});};
 const store=databaseStore(env,fetcher);assert.deepEqual(await store.get('test'),{saved:true});await store.put('test',{saved:true},60);assert.equal(await store.rotate('test',{saved:true},'used:test',60),true);await assert.rejects(databaseLimiter(env,fetcher)('test',60),/Rate limit/);await assert.rejects(stateCall({})('get','test'),/not configured/);assert.equal(stateSecret(env),env.XSTUDIO_MCP_STATE_TOKEN);assert.deepEqual(calls.map(c=>c.op),['get','put','rotate','limit']);
});

test('consent still rejects missing or opaque origins after the page-policy repair',async()=>{
 const {service}=setup();
 for(const origin of [null,'null','https://evil.example']){
  const headers={'content-type':'application/x-www-form-urlencoded'};if(origin!==null)headers.origin=origin;
  const r=await authorize(new Request(ISSUER+'/oauth/authorize',{method:'POST',headers,body:'flow=bad'}),httpDeps(service));assert.equal(r.status,403);
 }
});
test('classification permission is explicitly consented and cannot be added through token refresh',async()=>{const {service}=setup();const f=await pending(service,{scope:'asset:read asset:classify'});assert.equal(f.flow.record.scope,'asset:read asset:classify');const url=await service.approve(consent(f)),code=new URL(url).searchParams.get('code');const tokens=await service.token({grant_type:'authorization_code',client_id:f.client.client_id,redirect_uri:callback,resource:RESOURCE,code,code_verifier:verifier});assert.ok((await service.access(tokens.access_token)).scopes.has('asset:classify'));const read=await issued(service);assert.equal((await service.access(read.tokens.access_token)).scopes.has('asset:classify'),false);await assert.rejects(service.token({grant_type:'refresh_token',client_id:read.client.client_id,resource:RESOURCE,refresh_token:read.tokens.refresh_token,scope:'asset:read asset:classify'}),/invalid_scope/);});
