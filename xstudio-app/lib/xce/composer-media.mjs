import {XSTUDIO_ENDPOINT} from './xstudio-bridge.mjs';
import {readBounded} from '../xstudio-providers.mjs';
const MAX=6*1024*1024;
// Verify the private signed destination before fetching. Bound the stream before allocation.
export function referenceReader(request,fetcher=fetch){return async key=>{
 const {file}=await request({op:'file_get',key});if(!file)return null;
 if(!Number.isInteger(file.size)||file.size<1||file.size>MAX)throw Error('Reference exceeds supported image size');
 const url=new URL(file.url);if(url.origin!==new URL(XSTUDIO_ENDPOINT).origin||!['/storage/v1/object/sign/xstudio-engine-files/','/storage/v1/object/sign/xstudio-assets/'].some(p=>url.pathname.startsWith(p)))throw Error('Unexpected private reference URL');
 const response=await fetcher(url.toString(),{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Reference download failed');const bytes=await readBounded(response,MAX);if(bytes.length!==file.size)throw Error('Reference size mismatch');return {size:bytes.length,arrayBuffer:async()=>bytes,httpMetadata:{contentType:file.mime_type}};
};}
