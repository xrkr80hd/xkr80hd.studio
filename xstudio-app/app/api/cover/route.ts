import {owner,projectCover,requireFolder} from '../../../lib/xce/server';
import {isTrustedOrigin} from '../../../lib/xstudio-validation.mjs';
export const dynamic='force-dynamic';
async function handle(req:Request,action:string){
 if(action!=='view'&&!isTrustedOrigin(req))return Response.json({error:'Origin required'},{status:403});
 let u;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401})}
 try{const p=new URL(req.url).searchParams.get('project')||'';await requireFolder(req,u,p);let input:any={};if(action==='upload'){const f=(await req.formData()).get('file');if(!(f instanceof File)||f.size>6*1024*1024)throw Error('Choose a PNG, JPEG or WebP image up to 6 MB');input={name:f.name,mime_type:f.type,image_base64:Buffer.from(await f.arrayBuffer()).toString('base64')}}else if(action==='delete')input=await req.json();const result:any=await projectCover(u,p,action,input);if(action==='view')return new Response(result.file.body,{headers:{'Content-Type':result.mime_type,'X-Xstudio-Offline':result.offline?'enabled':'disabled','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});return Response.json(result,{headers:{'Cache-Control':'private, no-store'}})}catch(e){return Response.json({error:(e as Error).message},{status:(e as Error).message==='Folder locked'?423:(e as Error).message.includes('not found')?404:action==='view'?503:400})}
}
export const GET=(req:Request)=>handle(req,'view');
export const POST=(req:Request)=>handle(req,'upload');
export const DELETE=(req:Request)=>handle(req,'delete');
