import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
Deno.serve(async request=>{
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const raw=(request.headers.get('authorization')||'').replace(/^Bearer /,'');if(!/^xst_[a-f0-9]{64}$/.test(raw))return json({error:'Unauthorized'},401);
  const url=Deno.env.get('SUPABASE_URL')!;let key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');try{key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||key;}catch{}
  const admin=createClient(url,key!,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(key?.startsWith('sb_secret_')&&headers.get('authorization')===`Bearer ${key}`)headers.delete('authorization');return fetch(input,{...init,headers});}}});
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))),b=>b.toString(16).padStart(2,'0')).join('');
  const {data:token,error}=await admin.from('xstudio_api_tokens').select('owner_id,expires_at,revoked_at,scopes,provider').eq('token_hash',hash).eq('provider','mcp-state').maybeSingle();
  if(error||!token||token.revoked_at||Date.parse(token.expires_at)<=Date.now()||!token.scopes?.includes('asset:read'))return json({error:'Unauthorized'},401);
  const {data:owner}=await admin.from('xstudio_owners').select('user_id').eq('user_id',token.owner_id).maybeSingle();if(!owner)return json({error:'Unauthorized'},401);
  if(Number(request.headers.get('content-length'))>150000)return json({error:'Request too large'},413);
  const reader=request.body?.getReader();if(!reader)return json({error:'Invalid body'},400);let size=0;const chunks=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>150000){await reader.cancel();return json({error:'Request too large'},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const a=JSON.parse(new TextDecoder().decode(bytes));if(!['get','put','take','remove','rotate','used','limit'].includes(a.op)||typeof a.key!=='string'||a.key.length>300||!Number.isInteger(a.ttl)||a.ttl<0||a.ttl>31622400)return json({error:'Invalid operation'},400);
  let k=a.key;if(a.op==='limit')k='rate:'+k+':'+Math.floor(Date.now()/60000);
  const {data,result,error:rpcError}=await admin.rpc('xstudio_oauth_state_op',{p_owner:token.owner_id,p_op:a.op,p_key:k,p_value:a.value,p_ttl:a.ttl,p_extra:a.extra});
  if(rpcError)return json({error:'State operation failed'},503);return json({result:data??result??null});
 }catch{return json({error:'State unavailable'},503);}
});
