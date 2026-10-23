import {projectSummary} from '../../../lib/xce/project-summary.mjs';
import {backend} from '../../../lib/xce/server';
import {owner,call,ensureLostAssets} from '../../../lib/xce/server';
import {isTrustedOrigin} from '../../../lib/xstudio-validation.mjs';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 let u;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401})}
 await ensureLostAssets(u);
 await backend().DB.prepare('CREATE TABLE IF NOT EXISTS xce_project_order (owner TEXT NOT NULL, project TEXT NOT NULL, position INTEGER NOT NULL, PRIMARY KEY(owner, project))').run();
 const order=await backend().DB.prepare('SELECT project, position FROM xce_project_order WHERE owner=?').bind(u).all();const ranks=new Map(order.results.map((r:any)=>[r.project,r.position]));
 const rows=await backend().DB.prepare('SELECT project, revision, manifest FROM xce_projects WHERE owner=? ORDER BY project').bind(u).all();
 rows.results.sort((a:any,b:any)=>Number(ranks.get(a.project)??Number.MAX_SAFE_INTEGER)-Number(ranks.get(b.project)??Number.MAX_SAFE_INTEGER)||a.project.localeCompare(b.project));
 return Response.json({deleted_projects:rows.results.filter((r:any)=>JSON.parse(r.manifest).deleted_at).map((r:any)=>({id:r.project,title:JSON.parse(r.manifest).campaign_name})),projects:rows.results.filter((r:any)=>!JSON.parse(r.manifest).deleted_at).map((r:any)=>{const m=JSON.parse(r.manifest);return {system_pool:m.system_pool,id:r.project,title:m.campaign_name||r.project,revision:r.revision,folder_locked:Boolean(m.folder_lock),cover_id:m.folder_lock?null:m.cover_image?.id||null,project_code:m.active_project_code,...projectSummary(m)}})},{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(req:Request){
 if(!isTrustedOrigin(req))return Response.json({error:'Origin required'},{status:403});
 let u;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401})}
 let data:any;try{data=await req.json()}catch{return Response.json({error:'Invalid project details'},{status:400})}
 try{const result=await call('create_project',{name:data?.name,...(data?.project_id?{project_id:data.project_id}:{})},u,req);const p=JSON.parse(result.content[0].text);return Response.json({id:p.project_id,title:p.name,project_code:p.project_code,revision:p.revision,assets:0,references:0},{status:201,headers:{'Cache-Control':'private, no-store'}})}catch(e){const error=(e as Error).message;return Response.json({error},{status:error.includes('already exists')?409:400})}
}
export async function PATCH(req:Request){
 if(!isTrustedOrigin(req))return Response.json({error:'Origin required'},{status:403});
 let u;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401})}
 try{const input:any=await req.json();if(Array.isArray(input.order)){const rows=await backend().DB.prepare('SELECT project, manifest FROM xce_projects WHERE owner=?').bind(u).all();const ids=rows.results.filter((r:any)=>!JSON.parse(r.manifest).deleted_at).map((r:any)=>r.project);if(input.order.length!==ids.length||new Set(input.order).size!==ids.length||input.order.some((id:any)=>!ids.includes(id)))throw Error('Projects changed. Refresh and retry.');await backend().DB.prepare('CREATE TABLE IF NOT EXISTS xce_project_order (owner TEXT NOT NULL, project TEXT NOT NULL, position INTEGER NOT NULL, PRIMARY KEY(owner, project))').run();await backend().DB.batch([backend().DB.prepare('DELETE FROM xce_project_order WHERE owner=?').bind(u),...input.order.map((id:string,position:number)=>backend().DB.prepare('INSERT INTO xce_project_order (owner, project, position) VALUES (?, ?, ?)').bind(u,id,position))]);return Response.json({saved:true},{headers:{'Cache-Control':'private, no-store'}})}const result=await call('select_project',{name:input.project_id},u,req);return Response.json(JSON.parse(result.content[0].text),{headers:{'Cache-Control':'private, no-store'}})}catch(e){return Response.json({error:(e as Error).message},{status:400})}
}
