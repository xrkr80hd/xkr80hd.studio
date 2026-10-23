import {GatewayError} from '../mcp/security.mjs';
const ENDPOINT='https://osbsjjoxepxezcmupcak.supabase.co/functions/v1/xstudio-oauth-state';
export function stateCall(env=process.env,fetcher=fetch){return async(op,key,value=null,ttl=0,extra=null)=>{
 if(!/^xst_[a-f0-9]{64}$/.test(env.XSTUDIO_MCP_STATE_TOKEN||''))throw new GatewayError('State storage not configured',503);
 try{const r=await fetcher(ENDPOINT,{method:'POST',headers:{authorization:'Bearer '+env.XSTUDIO_MCP_STATE_TOKEN,'content-type':'application/json'},body:JSON.stringify({op,key,value,ttl,extra}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const data=await r.json();return data.result;}catch{throw new GatewayError('State storage unavailable',503);}
};}
export function databaseStore(env=process.env,fetcher=fetch){const call=stateCall(env,fetcher);return {
 get:k=>call('get',k),put:(k,v,ttl)=>call('put',k,v,ttl).then(ok=>{if(!ok)throw new GatewayError('State conflict',503);}),take:k=>call('take',k),remove:k=>call('remove',k),rotate:(k,v,t,ttl)=>call('rotate',k,v,ttl,t),used:k=>call('used',k)
};}
export function databaseLimiter(env=process.env,fetcher=fetch){const call=stateCall(env,fetcher);return async(key,limit)=>{const count=await call('limit',key,null,120);if(!Number.isInteger(count)||count<1)throw new GatewayError('Rate limiter unavailable',503);if(count>limit)throw new GatewayError('Rate limit exceeded',429);};}
export const stateSecret=(env=process.env)=>env.XSTUDIO_MCP_STATE_TOKEN||env.XSTUDIO_MCP_REDIS_TOKEN;
