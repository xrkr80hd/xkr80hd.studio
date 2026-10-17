import {backend} from '../../../lib/xce/server';
import {owner,load,requireFolder} from '../../../lib/xce/server';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 let u;try{u=await owner(req)}catch{return new Response('Sign in required',{status:401})}
 const url=new URL(req.url),p=url.searchParams.get('project')||'default';if(!/^[a-zA-Z0-9_-]{1,80}$/.test(p))return new Response('Invalid project',{status:400});
 try{await requireFolder(req,u,p)}catch(error){const locked=(error as Error).message==='Folder locked';return Response.json({error:locked?'Folder locked':'Studio temporarily unavailable'},{status:locked?423:503})}
 const {m,revision}=await load(u,p);const id=url.searchParams.get('file');
 if(id){const r=url.searchParams.get('deleted')==='1'?m.trash?.['reference:'+id]?.record:m.references[id];if(!r)return new Response('Not found',{status:404});const file=await backend().BUCKET.get(r.key);if(!file)return new Response('Not found',{status:404});return new Response(file.body,{headers:{'Content-Type':r.mime_type,'Content-Disposition':`${url.searchParams.get('download')==='1'?'attachment':'inline'}; filename="${id}.${r.mime_type==='image/svg+xml'?'svg':r.mime_type.split('/')[1]}"`,'X-Xstudio-Offline':m.folder_lock?'disabled':'enabled','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'"}});}
 const privateFolder=Boolean(m.folder_lock);delete m.folder_lock;
 if(m.cover_image)delete m.cover_image.key;
 for(const r of Object.values(m.references) as any[])delete r.key;
 for(const t of Object.values(m.trash||{}) as any[])if(t.record)delete t.record.key;
 return Response.json({...m,revision},{headers:{'Content-Disposition':'attachment; filename="anchor_manifest.json"','X-Xstudio-Offline':privateFolder?'disabled':'enabled','Cache-Control':'private, no-store'}});
}
