import {createHash} from 'node:crypto';
import {owner,load,save,requireFolder,backend} from '../../../lib/xce/server';
import {approveCharacterAnchor,unlockCharacterAnchor} from '../../../lib/xce/anchor-approval.mjs';
import {imageMime} from '../../../lib/xce/composer-service.mjs';
import {isTrustedOrigin} from '../../../lib/xstudio-validation.mjs';
import {readBounded} from '../../../lib/xstudio-providers.mjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!isTrustedOrigin(req))return Response.json({error:'Invalid origin'},{status:403});
 let u;try{u=await owner(req)}catch{return Response.json({error:'Sign in required'},{status:401})}
 let a;try{a=JSON.parse((await readBounded(req,8192)).toString('utf8'))}catch{return Response.json({error:'Invalid request'},{status:400})}
 if(!a||!/^[-a-zA-Z0-9_]{1,80}$/.test(a.project_id||'')||!/^[-a-zA-Z0-9_]{1,128}$/.test(a.asset_id||'')||typeof a.source_image_id!=='string'||!Number.isInteger(a.expected_revision)||a.confirm!==true)return Response.json({error:'Current character details and an explicit lock or unlock action are required'},{status:400});
 try{
  await requireFolder(req,u,a.project_id);const {m,revision}=await load(u,a.project_id);
  if(m.deleted_at||m.system_pool)throw Error('Choose an existing creative project');
  if(revision!==a.expected_revision)return Response.json({error:'Project changed. Reopen the character and try again.'},{status:409});
  const action=a.action||'lock';if(!['lock','unlock'].includes(action))throw Error('Unknown anchor action');
  if(action==='unlock'){
   const result=unlockCharacterAnchor(m,a);await save(u,a.project_id,result.manifest,revision);
   const check=await load(u,a.project_id),stored=check.m.manifest_store?.characters?.[a.asset_id];
   if(stored?.status!=='DRAFT'||stored.source_image_id!==a.source_image_id)throw Error('Unlock verification uncertain. Refresh before retrying.');
   return Response.json({saved:true,status:'DRAFT',revision:check.revision,asset:stored},{headers:{'Cache-Control':'private, no-store'}});
  }
  const ref=m.references?.[a.source_image_id];if(!ref?.key||ref.role==='DIAGNOSTIC')throw Error('Saved production image required');
  const file=await backend().BUCKET.get(ref.key);if(!file||file.size>6*1024*1024)throw Error('Character image is missing or exceeds 6 MB');
  const bytes=Buffer.from(await file.arrayBuffer());if(bytes.length>6*1024*1024||imageMime(bytes)!==ref.mime_type)throw Error('Stored character image failed verification');
  const sha256=createHash('sha256').update(bytes).digest('hex');
  const result=approveCharacterAnchor(m,{...a,sha256});await save(u,a.project_id,result.manifest,revision);
  const check=await load(u,a.project_id),stored=check.m.manifest_store?.characters?.[a.asset_id];
  if(stored?.status!=='LOCKED'||stored.source_image_id!==a.source_image_id||stored.owner_image_approval?.sha256!==sha256)throw Error('Lock verification uncertain. Refresh before retrying.');
  return Response.json({saved:true,status:'LOCKED',revision:check.revision,asset:stored},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){const message=(e as Error).message;return Response.json({error:message},{status:message.includes('Folder locked')?423:message.includes('Concurrent')?409:400})}
}
