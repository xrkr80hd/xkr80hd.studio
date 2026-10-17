export const XSTUDIO_ENDPOINT='https://osbsjjoxepxezcmupcak.supabase.co/functions/v1/xstudio-assets-api';
const ORIGIN=new URL(XSTUDIO_ENDPOINT).origin;
const MAX=4*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const assert=(ok,message)=>{if(!ok)throw Error(message)};
export function imageBytes(base64,mime){
 assert(typeof base64==='string'&&/^[A-Za-z0-9+/]+={0,2}$/.test(base64),'Invalid image base64');
 const data=Buffer.from(base64,'base64');assert(data.length>0&&data.length<=MAX,'Xstudio API accepts images up to 4 MB');
 assert((mime==='image/png'&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||(mime==='image/jpeg'&&data[0]===255&&data[1]===216&&data[2]===255)||(mime==='image/webp'&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP'),'Image bytes do not match MIME type');return data;
}
export function xstudioClient(token,fetcher=fetch){
 assert(/^xst_[0-9a-f]{64}$/.test(token||''),'Xstudio connection secret is missing or invalid');
 async function api(url,options={}){
  let response;try{response=await fetcher(url,{...options,headers:{...options.headers,authorization:'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(20000)})}catch{throw Error('Xstudio API connection failed; no successful transfer is confirmed')}
  let data;try{data=await response.json()}catch{throw Error('Xstudio API returned an invalid response')}
  assert(response.ok,response.status===401?'Xstudio token expired, revoked, or unauthorized':`Xstudio API failed (HTTP ${response.status})`);return data;
 }
 async function download(id){assert(UUID.test(id||''),'Choose an actual Xstudio asset ID from xstudio_list_assets');const data=await api(XSTUDIO_ENDPOINT+'?id='+id);const url=new URL(data.signed_url);assert(url.origin===ORIGIN&&url.pathname.startsWith('/storage/v1/object/sign/xstudio-assets/'),'Unexpected Xstudio download destination');return data;}
 return {
  async list({limit=30,offset=0}={}){assert(Number.isInteger(limit)&&limit>=1&&limit<=100&&Number.isInteger(offset)&&offset>=0&&offset<=100000,'Invalid pagination');const data=await api(XSTUDIO_ENDPOINT+`?limit=${limit}&offset=${offset}`);assert(Array.isArray(data.assets),'Xstudio API does not support asset listing');return {connected:true,studio_url:'https://xstudio.xrkr80hd.studio/',...data};},
  async get(id){const link=await download(id);let response;try{response=await fetcher(link.signed_url,{redirect:'manual',signal:AbortSignal.timeout(20000)})}catch{throw Error('Xstudio image download failed')};assert(response.ok,'Xstudio image download failed');const mime=(response.headers.get('content-type')||'').split(';')[0];assert(['image/png','image/jpeg','image/webp'].includes(mime),'This asset is not a renderer-supported PNG, JPEG or WebP image');const reader=response.body.getReader();const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX){await reader.cancel();throw Error('Xstudio image exceeds 4 MB')};chunks.push(Buffer.from(value))}const bytes=Buffer.concat(chunks);const base64=bytes.toString('base64');imageBytes(base64,mime);return {asset_id:id,mime_type:mime,image_base64:base64,byte_size:size};},
  async save({name,mime_type,image_base64}){assert(typeof name==='string'&&name.trim().length>0&&name.length<=512,'Asset name is required (max 512 characters)');const data=imageBytes(image_base64,mime_type);const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mime_type];const form=new FormData();form.set('file',new Blob([data],{type:mime_type}),'image.'+ext);form.set('name',name.trim());form.set('kind','image');const result=await api(XSTUDIO_ENDPOINT,{method:'POST',body:form});assert(UUID.test(result.asset?.id||''),'Xstudio upload returned no asset ID');assert(result.asset.byte_size===data.length&&result.asset.mime_type===mime_type,'Xstudio upload metadata mismatch');await download(result.asset.id);return {saved:true,verified:true,asset:result.asset,studio_url:'https://xstudio.xrkr80hd.studio/',assigned_project:false,approved:false};}
 };
}
