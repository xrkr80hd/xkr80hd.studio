import 'server-only';
import {requireOwner} from '../xstudio-server';
import {engineRequest} from './session-backend';
import {referenceReader} from './composer-media.mjs';
import {XSTUDIO_ENDPOINT} from './xstudio-bridge.mjs';
import {authorizeTransport,openProject,persistComposition,ComposerError} from './composer-access.mjs';
import {readBounded} from '../xstudio-providers.mjs';
import {catalogue,prepareComposition,saveComposition,editIntelligence,researchBrief} from './composer-service.mjs';
import {CONFIG_SCHEMA} from './composer.mjs';
import {CAST_GROUPS,assignCastGroup} from './cast-groups.mjs';
import {CHARACTER_RELATIONS} from './character-network.mjs';
import {saveCharacterDetails} from './character-network.mjs';
import {worldRecords} from './world-library.mjs';
import {compositionBundle} from './composer-export.mjs';

export const json=(body:any,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const ApiError=ComposerError;
// Bearer access uses the existing scoped-token verifier; no new credential store.
async function connection(req:Request){
 const authorization=authorizeTransport(req);
 if(authorization){
  const request=async(args:any)=>{const r=await fetch(XSTUDIO_ENDPOINT+'?resource=engine',{method:'POST',headers:{Authorization:authorization,'Content-Type':'application/json',apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},body:JSON.stringify(args),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(25000)});if(!r.ok)throw new ApiError(r.status===401?'Invalid or expired connector':r.status===403?'Connector permission denied':'Studio connection unavailable',r.status===401||r.status===403?r.status:503);return r.json()};
  await request({op:'context'});return request;
 }
 const context=await requireOwner();if(context.response)throw new ApiError('Sign in required',context.response.status);return engineRequest;
}
export async function composerRequest(req:Request){
 try{
  const request=await connection(req),query=new URL(req.url).searchParams;
  const args=req.method==='GET'?Object.fromEntries(query):JSON.parse((await readBounded(req,150000)).toString('utf8'));
  const action=args.action||'inventory';
  if(action==='schema')return json({module:'XCE_COMPOSER',configuration_schema:CONFIG_SCHEMA,cast_groups:CAST_GROUPS,character_relations:CHARACTER_RELATIONS,source_url:'https://xstudio.xrkr80hd.studio',instruction:'Use this live schema and current inventory. Site and plugin share this endpoint and project records.'});
  if(action==='projects'){
   const rows=(await request({op:'projects'})).data||[];
   return json({projects:rows.flatMap((row:any)=>{const m=JSON.parse(row.manifest);return m.deleted_at||m.system_pool?[]:[{id:row.project,name:m.campaign_name||row.project,folder_locked:Boolean(m.folder_lock)}]})});
  }
  const p=args.project_id;const {manifest:m,revision}=await openProject(request,req,p);
  if(action==='inventory'){const c=catalogue(m,p,revision);if(args.q)c.assets=c.assets.filter((a:any)=>(a.name+' '+a.asset_code).toLowerCase().includes(String(args.q).toLowerCase()));if(args.category)c.assets=c.assets.filter((a:any)=>a.category===args.category);return json(c);}
  if(action==='resolve'){const matches=catalogue(m,p,revision).assets.filter((a:any)=>a.id===args.asset_id||a.asset_code===args.asset_code);if(matches.length!==1)throw new ApiError('Exact asset not found or ambiguous',404);return json({project_id:p,asset:matches[0],images_retrieved:false,next_action:'Use execution with this exact asset_id to retrieve verified bytes.'});}
  if(action==='research')return json(researchBrief(m,p,args.asset_id));
  if(action==='read'){
   const c=m.composer?.compositions?.[args.id];if(!c)throw new ApiError('Composition not found',404);
   return json({record:c,revision}); // Stored configuration only; never claim stale verification.
  }
  if(req.method!=='POST')throw Error('Use POST for this operation');
  const write=(next:any)=>persistComposition(request,p,next,revision,args.expected_revision);
  if(action==='cast_group'){
   if(args.confirm!==true)throw Error('Explicit save confirmation required');
   const next=assignCastGroup(m,args.character_id,args.group,worldRecords(m));
   const updated=await write(next);return json({saved:true,revision:updated,character_cast_groups:next.character_cast_groups});
  }
  if(action==='character_details'){
   if(args.confirm!==true)throw Error('Explicit save confirmation required');
   const next=saveCharacterDetails(m,args.character_id,args.details,worldRecords(m));
   const updated=await write(next);return json({saved:true,revision:updated,character_network:next.character_network});
  }
  if(action==='intelligence'){
   if(args.confirm!==true)throw Error('Explicit save confirmation required');
   const result=editIntelligence(m,args.asset_id,args.profile,args.approve===true,args.expected_version,args.confirm);
   const next=await write(result.manifest);return json({saved:true,revision:next,profile:result.profile});
  }
  let config=args.configuration;
  if(action==='duplicate'){
   const old=m.composer?.compositions?.[args.id];if(!old)throw new ApiError('Composition not found',404);if(args.expected_version!==old.version)throw new ApiError('Composition changed; reopen it',409);config=old.configuration;
  }
  if(!['compile','execution','export','save','duplicate'].includes(action))throw Error('Unknown composer operation');
  const {output,images}=await prepareComposition(m,p,config,referenceReader(request));
  if(action==='save'||action==='duplicate'){
   const result=saveComposition(m,{...args,id:action==='duplicate'?undefined:args.id},output);
   const next=await write(result.manifest);return json({saved:true,revision:next,record:result.record,output});
  }
  if(action==='execution')return json({output,rendered:false,images:images.map((i:any)=>({reference_id:i.reference_id,mime_type:i.mime_type,image_base64:i.bytes.toString('base64')})),instruction:'Supply these exact image bytes to the authorized renderer, then visually review identity. No generation has occurred.'});
  if(action==='export'){
   return new Response(compositionBundle(output,images) as any,{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="xce-composer.zip"','Cache-Control':'private, no-store'}});
  }
  return json({output,revision});
 }catch(e){const err=e as any;return json({error:err.message||'Composition failed'},err.status||(/changed|Concurrent/.test(err.message)?409:400));}
}
