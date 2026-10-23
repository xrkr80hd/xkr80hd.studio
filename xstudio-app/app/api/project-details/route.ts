import {owner,load,requireFolder} from '../../../lib/xce/server';
import {engineRequest} from '../../../lib/xce/session-backend';
import {projectEdit,editedProjectManifest} from '../../../lib/xce/project-edit.mjs';
import {cookieName} from '../../../lib/xce/folder-lock.mjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origin required'},{status:403});
 let u;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401})}
 try{
  const a=projectEdit(await req.json());await requireFolder(req,u,a.project_id);
  const {m,revision}=await load(u,a.project_id);
  if(!revision||revision!==a.expected_revision)return Response.json({error:'Project changed. Refresh and try again.'},{status:409});
  const manifest=editedProjectManifest(m,a);
  const result=await engineRequest({op:'edit_project',project:a.project_id,new_project:a.new_project_id,revision,manifest:JSON.stringify(manifest)});
  if(result.error)return Response.json({error:result.error},{status:409});
  const headers=new Headers({'Cache-Control':'private, no-store'});
  if(m.folder_lock&&a.project_id!==a.new_project_id){
   const oldName=cookieName(a.project_id),token=(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(oldName+'='))?.slice(oldName.length+1);
   if(token){headers.append('Set-Cookie',cookieName(a.new_project_id)+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict');headers.append('Set-Cookie',oldName+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0')}
  }
  return Response.json(result,{headers});
 }catch(e){return Response.json({error:(e as Error).message},{status:400})}
}
