import {owner,load,requireFolder,backend} from '../../../lib/xce/server';
import {worldExport,worldZip} from '../../../lib/mcp/world-export.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET(request:Request){
 try{const u=await owner(request),url=new URL(request.url),p=url.searchParams.get('project_id');if(!p||!/^[-\w]{1,80}$/.test(p))throw Error('Choose a valid project');await requireFolder(request,u,p);const {m,revision}=await load(u,p);if(!revision||m.deleted_at||m.system_pool)throw Error('Choose a saved creative world');
  const doc=worldExport(m,p,revision),json=url.searchParams.get('format')==='json';
  const body=json?JSON.stringify(doc,null,2):worldZip(m,p,revision,(key:string)=>backend().BUCKET.get(key));
  return new Response(body,{headers:{'content-type':json?'application/json':'application/zip','content-disposition':`attachment; filename="${p}-r${revision}.${json?'world.json':'world.zip'}"`,'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
 }catch(e){const error=(e as Error).message;return Response.json({error},{status:/owner|Sign in|Authenticated/.test(error)?401:/Folder locked/.test(error)?423:400,headers:{'cache-control':'no-store'}});}
}
