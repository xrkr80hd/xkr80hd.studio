import {workspaceOperation,workspaceTools} from './workspace.mjs';
import {retrieveCharacterReference} from './character-reference.mjs';
import {continuityOperation} from '../xce/continuity-service.mjs';
import {generationReferenceIds} from '../xce/visual-identity.mjs';
import {characterCref,prepareCharacterCref} from '../xce/character-cref.mjs';
import {referenceReader} from '../xce/composer-media.mjs';
import {sceneSequenceLedger} from '../xce/scene-sequence.mjs';
import {METADATA_SCHEMA,assetMetadata,updateAssetMetadata,updateGenerationPrompt,bulkMetadata} from '../xce/asset-metadata.mjs';
import {CLASSIFICATION_SCHEMA,classificationRows,classifyAssets} from '../xce/classifications.mjs';
import {XSTUDIO_ENDPOINT} from '../xce/xstudio-bridge.mjs';
import {codedRecords,recordId} from '../xce/asset-codes.mjs';
import {gradeLibrary} from '../xce/color-grades.mjs';
import {characterContext} from '../xce/character-network.mjs';
import {worldRecords} from '../xce/world-library.mjs';
import {GatewayError} from './security.mjs';

const notFound=()=>{throw new GatewayError('Record not found or unavailable',404);};
export async function readJSON(response,max=4*1024*1024){
 const reader=response.body?.getReader();if(!reader)throw new GatewayError('Backend unavailable',502);
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new GatewayError('Response too large; narrow the request',502);}chunks.push(Buffer.from(value));}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new GatewayError('Backend unavailable',502);}
}
export function backend(token,fetcher=fetch,{allowClassificationSave=false,allowWorkspaceWrite=false}={}){
 return async args=>{
  if(!['projects','load','file_get','code'].includes(args.op)&&!(allowClassificationSave&&args.op==='save')&&!(allowWorkspaceWrite&&['save','reserve_code','file_put'].includes(args.op)))throw new GatewayError('Read-only operation required',403);
  let r;try{r=await fetcher(XSTUDIO_ENDPOINT+'?resource=engine',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(args),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(25000)});}catch{throw new GatewayError('Backend unavailable',502);}
  if(!r.ok)throw new GatewayError(r.status===401?'Invalid credential':'Backend unavailable',r.status===401?401:502);
  return readJSON(r,args.op==='projects'?32*1024*1024:4*1024*1024);
 };
}
// Do not export storage paths, folder PIN hashes, session grants, or arbitrary URLs.
const PRIVATE=new Set(['key','storage_path','storage_bucket','folder_lock','session_hash','pin_hash','token_hash','salt','_mcp_created_for','mcp_locations']);
export function publicData(value){
 if(Array.isArray(value))return value.map(publicData);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!PRIVATE.has(k)).map(([k,v])=>[k,publicData(v)]));
 if(typeof value==='string'&&/^https?:\/\//i.test(value))return null;
 return value;
}
function manifest(row){let m;try{m=JSON.parse(row.manifest);}catch{throw new GatewayError('Saved manifest unavailable',502);}if(!m||typeof m!=='object'||m.deleted_at||m.folder_lock)return null;return m;}
const summary=(row,m)=>({project_id:row.project,name:m.campaign_name??null,project_code:m.active_project_code??null,revision:row.revision,system_pool:m.system_pool??false});
const allRecords=m=>codedRecords(m).filter(({record:r})=>!r.deleted_at&&!r.discarded_for_production);
const packed=(p,entry)=>({project_id:p,asset_id:recordId(entry.record),category:entry.type,metadata:publicData(entry.record)});
function find(m,id){const hits=allRecords(m).filter(({record:r})=>recordId(r)===id||r.asset_code===id);if(hits.length!==1)notFound();return hits[0];}
export function referenceIds(r,type){
 if(type==='reference')return [r.id];
 if(r.visual_identity)return generationReferenceIds({...r,reference_ids:[...(r.reference_ids||[]),...(r.source_image_id?[r.source_image_id]:[])]});
 if(r.status==='LOCKED'&&r.source_image_id)return [r.source_image_id];
 return [...new Set([...(r.reference_ids||r.assigned_reference_ids||[]),r.source_image_id,r.output_reference_id,r.blueprint_id,r.thumbnail_reference_id,...['face_anchor_url','body_anchor_url','costume_anchors','exterior_anchor','interior_anchor','exterior_environment_anchor'].map(k=>r.metadata?.[k])].filter(v=>typeof v==='string'&&v))];
}
export function dataSource(auth,request=backend(auth.backendToken,fetch,{allowClassificationSave:auth.scopes?.has('asset:classify')||auth.scopes?.has('asset:metadata')||auth.scopes?.has('asset:delete'),allowWorkspaceWrite:auth.scopes?.has('asset:write')}),{getImage=referenceReader(request)}={}){
 async function availableProject(p){
  if(!auth.projects.has(p))notFound();
  const row=(await request({op:'load',project:p})).data;if(!row)return null;const m=manifest(row);return m?{m,revision:row.revision}:null;
 }
 async function project(p){const saved=await availableProject(p);if(!saved)notFound();return saved;}
 async function references(m,p,ids,includeMedia){
  if(ids.length>60)throw new GatewayError('Too many references; narrow the request',400);
  return Promise.all(ids.map(async id=>{
   const r=m.references?.[id];if(!r||r.deleted_at)return {reference_id:id,status:'missing'};
   const base={reference_id:id,metadata:publicData(r)};
   if(!includeMedia)return base;
   // Membership comes from this authorized saved manifest, never a caller key.
   // Migrated/copied reference keys retain legacy owner/project path segments.
   // The Edge API separately verifies actual file ownership before signing.
   if(typeof r.key!=='string'||!r.key.startsWith('xce/')||r.key.length>1000)return {...base,status:'unavailable'};
   const {file}=await request({op:'file_get',key:r.key});if(!file)return {...base,status:'missing'};
   let url;try{url=new URL(file.url);}catch{throw new GatewayError('Invalid media destination',502);}
   if(url.origin!==new URL(XSTUDIO_ENDPOINT).origin||!['/storage/v1/object/sign/xstudio-assets/','/storage/v1/object/sign/xstudio-engine-files/'].some(prefix=>url.pathname.startsWith(prefix))||!url.searchParams.has('token'))throw new GatewayError('Invalid media destination',502);
   return {...base,media:{url:file.url,mime_type:file.mime_type,byte_size:file.size,expires_in:60},generation_input_allowed:r.role!=='DIAGNOSTIC'};
  }));
 }
 return async(name,a)=>{
  if(workspaceTools.has(name)){try{return publicData(await workspaceOperation(name,a,{auth,request,getImage}));}catch(e){if(e instanceof GatewayError)throw e;throw new GatewayError(e.message,e.message.startsWith('Permission required')?403:400);}}
  if(name==='get_character_reference'){
   try{return await retrieveCharacterReference(a,{projectIds:auth.projects,loadProject:availableProject,
    matches:(m,id)=>allRecords(m).filter(({record:r})=>recordId(r)===id||r.asset_code===id),
    readCref:(p,id)=>dataSource(auth,request,{getImage})('get_character_cref',{project_id:p,asset_id:id,include_media:true}),signReferences:references});
   }catch(e){if(e instanceof GatewayError)throw e;throw new GatewayError(e.message,400);}
  }
  if(name==='list_projects'){
   // Edge API revalidates expiry, revocation, owner membership and asset:read.
   const rows=(await request({op:'projects'})).data;if(!Array.isArray(rows))throw new GatewayError('Backend unavailable',502);
   const projects=rows.filter(r=>auth.projects.has(r.project)).flatMap(r=>{const m=manifest(r);return m?[summary(r,m)]:[];});
   return {projects:projects.slice(a.offset,a.offset+a.limit),next_offset:projects.length>a.offset+a.limit?a.offset+a.limit:null};
  }
  if(name==='bulk_update_asset_details'&&a.projects){
   if(!auth.scopes?.has('asset:metadata'))throw new GatewayError('Metadata permission required; reconnect with asset:metadata',403);
   const results=[];for(const batch of a.projects){try{results.push({project_id:batch.project_id,ok:true,...await dataSource(auth,request)('bulk_update_asset_details',{...batch,confirm:a.confirm})})}catch(e){results.push({project_id:batch.project_id,ok:false,error:e instanceof GatewayError?e.message:'Metadata update failed'})}}
   return {results};
  }
  const {m,revision}=await project(a.project_id);const p=a.project_id;
  if(['get_asset_identity','verify_vehicle_vin','manage_asset_identity'].includes(name)){
   if(name==='manage_asset_identity'&&!auth.scopes?.has('asset:metadata'))throw new GatewayError('Metadata permission required; reconnect with asset:metadata',403);
   if(name==='manage_asset_identity'&&a.expected_revision!==revision)throw new GatewayError('Project changed; reload before updating identity',409);
   try{const result=await continuityOperation(m,p,revision,name==='get_asset_identity'?{action:'read',...a}:name==='verify_vehicle_vin'?{action:'decode_vin',...a}:a,{getImage});
    if(result.manifest){const value=JSON.stringify(result.manifest);if(Buffer.byteLength(value)>1900000)throw new GatewayError('Project manifest too large',413);const saved=await request({op:'save',project:p,revision,manifest:value});if(saved.changes!==1)throw new GatewayError('Concurrent project update; reload',409);const verified=await project(p);if(verified.revision!==revision+1||JSON.stringify(verified.m)!==value)throw new GatewayError('Save verification uncertain; reload before retrying',409);}
    const {images,...details}=result.data;const safe=publicData(details);const provenance=(raw,clean)=>{if(!raw||!clean||typeof raw!=='object'||typeof clean!=='object')return;for(const [key,value]of Object.entries(raw)){if(key==='source_url'&&typeof value==='string'&&/^https:\/\/vpic\.nhtsa\.dot\.gov\/api\/vehicles\//.test(value))clean[key]=value;else provenance(value,clean[key]);}};provenance(details,safe);return {...safe,...(images?{images}:{}),project_id:p,revision:revision+(result.manifest?1:0)};
   }catch(e){if(e instanceof GatewayError)throw e;throw new GatewayError(e.message,400)}
  }
  if(name==='get_project_classification_schema')return {project_id:p,revision,schema:CLASSIFICATION_SCHEMA,metadata_schema:METADATA_SCHEMA};
  if(['get_asset_details','get_asset_generation_prompt'].includes(name)){let detail;try{detail=assetMetadata(m,p,revision,a.asset_id)}catch(e){throw new GatewayError(e.message,404)}return name==='get_asset_details'?detail:{asset_id:a.asset_id,project_id:p,revision,...detail.generation_prompt};}
  if(['update_asset_details','bulk_update_asset_details','update_asset_generation_prompt'].includes(name)){
   if(!auth.scopes?.has('asset:metadata'))throw new GatewayError('Metadata permission required; reconnect with asset:metadata',403);
   if(a.confirm!==true)throw new GatewayError('Explicit confirmation required',400);
   if(a.expected_revision!==revision)throw new GatewayError('Project changed; reload before updating metadata',409);
   let result;try{result=name==='bulk_update_asset_details'?bulkMetadata(m,p,revision,a.updates):name==='update_asset_generation_prompt'?updateGenerationPrompt(m,p,revision,a.asset_id,a.expected_version,a.text,a.provenance):updateAssetMetadata(m,p,revision,a.asset_id,a.expected_version,a.patch)}catch(e){throw new GatewayError(e.message,400)}
   if(result.changed){const value=JSON.stringify(result.manifest);if(Buffer.byteLength(value)>1900000)throw new GatewayError('Project manifest too large',413);const saved=await request({op:'save',project:p,revision,manifest:value});if(saved.changes!==1)throw new GatewayError('Concurrent project update; reload',409);const verified=await project(p);if(verified.revision!==revision+1||JSON.stringify(verified.m)!==value)throw new GatewayError('Save verification uncertain; reload before retrying',409);}
   return {project_id:p,revision:revision+(result.changed?1:0),changed:result.changed,...(result.results?{results:result.results}:{asset:result.asset})};
  }
  if(name==='get_asset_classifications')return {project_id:p,revision,schema:CLASSIFICATION_SCHEMA,assets:classificationRows(m,p,revision).filter(r=>!a.asset_ids||a.asset_ids.includes(r.asset_id))};
  if(['update_asset_classification','bulk_update_asset_classifications'].includes(name)){
   if(!auth.scopes?.has('asset:classify'))throw new GatewayError('Classification permission required; reconnect with asset:classify',403);
   if(a.confirm!==true)throw new GatewayError('Explicit confirmation required',400);
   if(a.expected_revision!==revision)throw new GatewayError('Project changed; reload before classifying',409);
   let result;try{result=classifyAssets(m,p,revision,a.expected_revision,name==='update_asset_classification'?[{asset_id:a.asset_id,classification:a.classification,expected_version:a.expected_version}]:a.updates)}catch(e){throw new GatewayError(e.message,400)}
   if(result.changed){const value=JSON.stringify(result.manifest);if(Buffer.byteLength(value)>1900000)throw new GatewayError('Project manifest too large',413);const saved=await request({op:'save',project:p,revision,manifest:value});if(saved.changes!==1)throw new GatewayError('Concurrent project update; reload',409);const verified=await project(p);if(verified.revision!==revision+1||JSON.stringify(verified.m)!==value)throw new GatewayError('Save verification uncertain; reload before retrying',409);}
   return {project_id:p,revision:revision+(result.changed?1:0),results:result.results,assets:result.assets,changed:result.changed};
  }
  if(name==='get_project')return {...summary({project:p,revision},m),asset_count:allRecords(m).length,scene_ids:Object.keys(m.scenes||{})};
  if(['list_project_assets','search_assets','list_establishing_shots'].includes(name)){
   let rows=allRecords(m);
   if(a.category)rows=rows.filter(r=>r.type===a.category);
   if(name==='search_assets'){const q=a.query.toLocaleLowerCase();rows=rows.filter(({record:r})=>[recordId(r),r.asset_code,r.name,r.asset_name].some(v=>typeof v==='string'&&v.toLocaleLowerCase().includes(q)));}
   if(name==='list_establishing_shots')rows=rows.filter(({record:r})=>[r.shot_type,r.camera?.shot,r.camera_spec?.framing,r.metadata?.shot_type].some(v=>v==='establishing'||v==='establishing shot'));
   return {project_id:p,assets:rows.slice(a.offset,a.offset+a.limit).map(r=>({...packed(p,r),...classificationRows(m,p,revision).find(c=>c.asset_id===recordId(r.record))})),next_offset:rows.length>a.offset+a.limit?a.offset+a.limit:null};
  }
  if(name==='get_color_grades')return {project_id:p,grades:publicData(gradeLibrary(m)),assignments:publicData(m.color_grades?.assignments||{})};
  if(name==='get_composition_rules')return {project_id:p,character_network:publicData(m.character_network||{}),compositions:publicData(m.composer?.compositions||{}),intelligence:publicData(m.composer?.intelligence||{}),...(a.character_ids?{applicable:publicData(characterContext(m,a.character_ids,worldRecords(m)))}:{}),application_rule:'Apply enabled saved clauses only when both linked characters are selected. Never add a character to activate a clause.'};
  if(name==='get_scene_references'){
   const entry=find(m,a.scene_id);if(entry.type!=='scene'&&entry.type!=='keyframe'&&entry.record.type!=='scenes_and_shots')notFound();
   const sequence=entry.type==='scene'||entry.record.type==='scenes_and_shots'?sceneSequenceLedger({...entry.record,scene_id:a.scene_id},m):null;const ids=[...new Set([...referenceIds(entry.record,entry.type),...(sequence?.anchors||[]).map(b=>b.reference_id)])];return {...packed(p,entry),...(sequence?{reference_sequence:sequence}:{}),references:await references(m,p,ids,a.include_media)};
  }
  const entry=find(m,a.asset_id);
  const classification=classificationRows(m,p,revision).find(r=>r.asset_id===recordId(entry.record));
  if(['get_character_cref','get_character_anchor'].includes(name)){
   try{
    const cref=characterCref(m,p,a.asset_id,revision);
    const identity={...packed(p,entry),...classification};
    if(a.include_media===false||(name==='get_character_anchor'&&a.include_media!==true))return {...identity,cref,references:await references(m,p,cref.reference_ids,false)};
    const result=await prepareCharacterCref(m,p,a.asset_id,revision,getImage);
    const current=await project(p);if(current.revision!==revision)throw new GatewayError('Project changed while loading CREF. Retry retrieval.',409);
    return {...identity,...result,references:await references(m,p,cref.reference_ids,false)};
   }catch(e){if(e instanceof GatewayError)throw e;throw new GatewayError(e.message,400);}

  }
  if(name.startsWith('get_character_')&&entry.type!=='character')notFound();
  const ids=referenceIds(entry.record,entry.type);
  return {...packed(p,entry),...classification,references:await references(m,p,ids,a.include_media)};
 };
}


