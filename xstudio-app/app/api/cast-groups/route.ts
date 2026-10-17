import {owner,load,save,requireFolder} from '../../../lib/xce/server';
import {worldRecords} from '../../../lib/xce/world-library.mjs';
import {assignCastGroup} from '../../../lib/xce/cast-groups.mjs';
import {isTrustedOrigin} from '../../../lib/xstudio-validation.mjs';
import {readBounded} from '../../../lib/xstudio-providers.mjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!isTrustedOrigin(req))return Response.json({error:'Invalid origin'},{status:403});
 let u;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401})}
 let a;try{a=JSON.parse((await readBounded(req,4096)).toString('utf8'))}catch{return Response.json({error:'Invalid request'},{status:400})}
 if(!a||typeof a!=='object'||!/^[-a-zA-Z0-9_]{1,80}$/.test(a.project_id||'')||typeof a.character_id!=='string'||!Number.isInteger(a.expected_revision))return Response.json({error:'Invalid cast assignment'},{status:400});
 try{await requireFolder(req,u,a.project_id);const {m,revision}=await load(u,a.project_id);if(revision!==a.expected_revision)return Response.json({error:'Project changed. Refresh and retry.'},{status:409});const next=assignCastGroup(m,a.character_id,a.group,worldRecords(m));await save(u,a.project_id,next,revision);return Response.json({saved:true,revision:revision+1,character_cast_groups:next.character_cast_groups});}catch(e){const message=(e as Error).message;return Response.json({error:message},{status:message==='Folder locked'?423:message.includes('Concurrent')?409:400})}
}
