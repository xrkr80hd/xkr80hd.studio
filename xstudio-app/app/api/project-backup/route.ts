import {owner,load,requireFolder} from '../../../lib/xce/server';
import {projectBackup} from '../../../lib/xce/project-backup.mjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origin required'},{status:403});
 try{const u=await owner(req),{project_id:p}=await req.json() as {project_id:string};if(!/^[a-zA-Z0-9_-]{1,80}$/.test(p))throw Error('Invalid project');await requireFolder(req,u,p);const {m,revision}=await load(u,p);if(!revision||m.deleted_at||m.system_pool)throw Error('Choose a saved creative project');const backup=projectBackup(m,{project_id:p,revision});return new Response(JSON.stringify(backup,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="'+p+'-records-r'+revision+'.json"','Cache-Control':'private, no-store'}})}catch(e){return Response.json({error:(e as Error).message},{status:400})}
}
