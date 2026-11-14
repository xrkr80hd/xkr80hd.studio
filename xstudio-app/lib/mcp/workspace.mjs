import {saveCharacterDetails} from '../xce/character-network.mjs';
import {worldRecords} from '../xce/world-library.mjs';
import {WORLD_BUILDER_FIELDS,updateWorldBuilder} from '../xce/world-builder-fields.mjs';
import {compileWorld} from '../xce/world-builder.mjs';
import {WORLD_TYPES,WORLD_FIELDS,emptyWorld,validateWorld} from '../xce/world-library.mjs';
import {METADATA_SCHEMA} from '../xce/asset-metadata.mjs';
import {ASSET_FORM_SECTIONS} from '../xce/asset-form-layout.mjs';
import {WORLD_PRESETS} from '../xce/world-presets.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {fresh} from '../xce/core.mjs';
import {deriveCode,lockNamespace,allocate,annotate} from '../xce/namespace.mjs';
import {codedRecords,recordId,assignAssetCodes} from '../xce/asset-codes.mjs';
import {uploadDestination,classifyUpload} from '../xce/upload-category.mjs';
import {stampProjectIdentity} from '../xce/project-identity.mjs';
import {usesReference} from '../xce/attachments.mjs';
import {purgeTrash} from '../xce/library.mjs';
import {imageBytes} from '../xce/xstudio-bridge.mjs';
import {imageMime} from '../xce/composer-service.mjs';
import {emptyStory} from '../xce/story.mjs';
import {upsertScript,unzipPackage,scriptDrafts,mergeScriptDrafts} from '../xce/world-zip-import.mjs';
import {readPackage,resolveWorld,applyRecords,attachImage,referenceIdFor} from '../xce/world-package.mjs';
import {fetchFile as defaultFetchFile,ZIP_MAX_BYTES} from './file-fetch.mjs';

const MAX_IMAGE_BYTES=2_500_000,IMPORT_TIME_BUDGET_MS=40_000,SAVE_EVERY=10;
const normTitle=s=>String(s||'').trim().toLowerCase();
const slugify=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const sha256Of=bytes=>createHash('sha256').update(bytes).digest('hex');

export const workspaceScopes={update_character_profile:'asset:metadata',update_world_builder:'asset:write',create_world_asset:'asset:write',create_folder:'asset:write',update_folder:'asset:write',import_asset:'asset:write',import_image_file:'asset:write',import_world_zip:'asset:write',save_script:'asset:write',import_project:'asset:write',delete_folder:'asset:delete',restore_folder:'asset:write',delete_assets:'asset:delete',restore_assets:'asset:write',purge_trash:'asset:delete'};
export const workspaceTools=new Set([...Object.keys(workspaceScopes),'list_trash','get_world_builder','export_world']);
const check=(ok,message)=>{if(!ok)throw Error(message);};
const marker=auth=>createHash('sha256').update('xstudio-created-project-v1:'+auth.principal).digest('hex');
export async function includeCreatedProjects(auth,request){
 if(!auth.scopes?.has('asset:write'))return;
 const rows=(await request({op:'projects'})).data;check(Array.isArray(rows),'Project discovery unavailable');
 for(const row of rows){let m;try{m=JSON.parse(row.manifest);}catch{throw Error('Saved manifest unavailable');}
  // Only this exact delegation's new folders; existing grants never widen retroactively.
  if(m._mcp_created_for===marker(auth))auth.projects.add(row.project);
 }
}
function locations(m){
 return [...Object.entries(m.world_library||{}).flatMap(([bucket,rows])=>Object.entries(rows).map(([key,record])=>({path:['world_library',bucket],key,record}))),
  ...Object.entries(m.manifest_store||{}).flatMap(([bucket,rows])=>Object.entries(rows).map(([key,record])=>({path:['manifest_store',bucket],key,record}))),
  ...Object.entries(m.references||{}).map(([key,record])=>({path:['references'],key,record})),...Object.entries(m.scenes||{}).map(([key,record])=>({path:['scenes'],key,record}))];
}
const collection=(m,path)=>path.reduce((o,k)=>o?.[k],m);
function dependency(r,id){return usesReference(r,id)||Object.values(r.metadata||{}).includes(id);}
export function trashAssets(m,selectors){
 const selected=selectors.map(id=>{const hits=codedRecords(m).filter(({record:r})=>recordId(r)===id||r.asset_code===id);check(hits.length===1,'Asset not found or ambiguous');return hits[0];});
 const ids=new Set(selected.map(({record})=>recordId(record)));check(ids.size===selectors.length,'Duplicate selected assets');
 const others=[...codedRecords(m).filter(({record})=>!ids.has(recordId(record))).map(e=>e.record),...Object.values(m.shot_lists||{}),...Object.values(m.state_variants||{}).flatMap(Object.values)];
 for(const id of ids)check(!others.some(r=>dependency(r,id)),'Asset is used by another saved record; remove its assignments first');
 m.trash||={};
 for(const {record,type}of selected){const id=recordId(record),key=type+':'+id;check(!m.trash[key],'Trash already contains this ID');
  const entries=locations(m).filter(e=>recordId(e.record)===id);check(entries.length,'Asset location unavailable');
  m.trash[key]={entity:type,id,record:structuredClone(record),deleted_at:new Date().toISOString(),mcp_locations:entries.map(e=>({...e,record:structuredClone(e.record)}))};
  for(const e of entries)delete collection(m,e.path)[e.key];
  for(const scene of Object.values(m.scenes||{}))for(const [n,shot]of Object.entries(scene.shots||{}))if(shot.asset_id===id)delete scene.shots[n];
 }
 for(const k of ['active_asset_id','active_scene','active_reference_id'])if(ids.has(m[k]))m[k]=null;
 if(ids.has(m.pending_action?.asset_id))m.pending_action=null;m.permits={};
 return {deleted:ids.size,recoverable:true,stored_image_bytes_deleted:false};
}
export function restoreAssets(m,keys){
 check(new Set(keys).size===keys.length,'Duplicate trash selections');
 for(const key of keys){const t=m.trash?.[key];check(t,'Deleted asset not found');check(!codedRecords(m).some(({record})=>recordId(record)===recordId(t.record)),'Asset ID already exists');
  // Native website trash entries and MCP entries use the same record shape.
  const path=t.mcp_locations?.[0]?.path|| (t.entity==='reference'?['references']:t.entity==='scene'?['scenes']:['manifest_store',({character:'characters',creature:'creatures',prop:'props',vehicle:'vehicles',location:'locations',keyframe:'shots'})[t.entity]]);
  const entries=t.mcp_locations||[{path,key:t.id||recordId(t.record),record:t.record}];
  for(const e of entries){check(collection(m,e.path),'Unsupported trash record');check(!collection(m,e.path)[e.key],'Asset ID already exists');}
  for(const id of [...(t.record.reference_ids||[]),t.record.source_image_id,t.record.blueprint_id].filter(Boolean))check(m.references?.[id]||keys.some(k=>m.trash[k]?.entity==='reference'&&recordId(m.trash[k].record)===id),'Restore required reference first');
 }
 // References first, then assets and scenes.
 for(const key of [...keys].sort((a,b)=>Number(!a.startsWith('reference:'))-Number(!b.startsWith('reference:')))){
  const t=m.trash[key],paths=t.mcp_locations||[{path:t.entity==='reference'?['references']:t.entity==='scene'?['scenes']:['manifest_store',({character:'characters',creature:'creatures',prop:'props',vehicle:'vehicles',location:'locations',keyframe:'shots'})[t.entity]],key:t.id||recordId(t.record),record:t.record}];
  for(const e of paths)collection(m,e.path)[e.key]=structuredClone(e.record);
  if(t.entity==='keyframe'&&t.record.scene_id){check(m.scenes?.[t.record.scene_id],'Restore this shot’s scene first');m.scenes[t.record.scene_id].shots||={};m.scenes[t.record.scene_id].shots[String(t.record.shot_number)]=structuredClone(t.record);}
  delete m.trash[key];
 }m.permits={};return {restored:keys.length};
}
export async function workspaceOperation(name,a,{auth,request,getImage,fetchFile=defaultFetchFile,now=Date.now}){
 const scope=workspaceScopes[name];if(scope)check(auth.scopes?.has(scope),'Permission required: '+scope+'; reconnect and approve access');
 if(scope)check(a.confirm===true,'Explicit confirmation required');
 async function load(p,{deleted=false}={}){check(auth.projects.has(p),'Project not found or unavailable');const row=(await request({op:'load',project:p})).data;check(row,'Project not found or unavailable');const m=JSON.parse(row.manifest);check(!m.folder_lock,'Folder locked; unlock it in XSTUDIO');check(deleted||!m.deleted_at,'Project is in trash');return {m,revision:row.revision};}
 async function storeImage(m,{bytes,mime_type,name,upload_category,dedupe=true}){
  const sha256=createHash('sha256').update(bytes).digest('hex');
  const prior=dedupe&&Object.values(m.references||{}).find(r=>r?.content_sha256===sha256&&!r.deleted_at);
  if(prior){const asset=codedRecords(m).find(e=>(e.record.reference_ids||[]).includes(prior.id));return {reference_id:prior.id,asset_id:asset?recordId(asset.record):null,asset_code:asset?.record.asset_code||prior.asset_code||null,sha256,status:asset?'DRAFT':'REFERENCE',approved:false,verified:true,reused:true};}
  const destination=uploadDestination(upload_category),id=allocate(m,destination.asset_type||'prop',name),key='xce/'+auth.owner+'/'+a.project_id+'/'+id+'-'+randomUUID();
  await request({op:'file_put',key,mime_type,base64:Buffer.from(bytes).toString('base64'),name,library_visible:true});
  const stored=await getImage(key);check(stored&&createHash('sha256').update(Buffer.from(await stored.arrayBuffer())).digest('hex')===sha256,'Import image read-back verification failed');
  m.references||={};const ref=annotate({id,name,asset_name:name,...destination,mime_type,key,size:bytes.length,content_sha256:sha256},m,destination.asset_type);m.references[id]=ref;
  const asset=classifyUpload(m,ref,upload_category);assignAssetCodes(m);
  return {reference_id:id,asset_id:asset?.asset_id||null,asset_code:asset?.asset_code||ref.asset_code,sha256,status:asset?'DRAFT':'REFERENCE',approved:false,verified:true,reused:false};
 }
 async function save(p,m,revision){const text=JSON.stringify(m);check(Buffer.byteLength(text)<1_900_000,'Project manifest too large');const r=await request({op:'save',project:p,revision,manifest:text});check(r.changes===1,'Concurrent project update; reload before retrying');const row=(await request({op:'load',project:p})).data;check(row?.revision===revision+1&&row.manifest===text,'Save verification uncertain; reload before retrying');return revision+1;}
 async function create(m){check(!a.project_id.startsWith('xce-'),'Reserved system folder ID');const prior=(await request({op:'load',project:a.project_id})).data;check(!prior,'Project ID already exists');
  delete m.active_project_code;delete m.auto_id_parser;const base=deriveCode(a.name);let code=(await request({op:'code',project:a.project_id})).data?.code;
  for(let i=0;!code&&i<1000;i++){const suffix=i?String(i+1):'',candidate=base.slice(0,4-suffix.length)+suffix;const r=await request({op:'reserve_code',project:a.project_id,code:candidate});if(r.reserved!==false){code=candidate;break;}}
  check(code,'Could not reserve project code');lockNamespace(m,code);m.campaign_name=a.name.trim();m._mcp_created_for=marker(auth);stampProjectIdentity(m,a.project_id);m.permits={};m.pending_action=null;delete m.folder_lock;delete m.deleted_at;assignAssetCodes(m);
  const revision=await save(a.project_id,m,0);auth.projects.add(a.project_id);return {saved:true,project_id:a.project_id,name:m.campaign_name,project_code:code,revision};}
 if(name==='create_folder')return create(fresh());
 if(name==='import_project'){const source=await load(a.source_project_id);check(!source.m.system_pool,'Choose a creative project');check(source.revision===a.expected_revision,'Source project changed; reload');return {...await create(structuredClone(source.m)),source_project_id:a.source_project_id,reference_images_reused:true,image_bytes_copied:false};}
 if(name==='import_world_zip')return importWorldZip();
 async function importWorldZip(){
  const started=now(),overBudget=()=>now()-started>IMPORT_TIME_BUDGET_MS;
  const files=unzipPackage(await fetchFile(a.file,{maxBytes:ZIP_MAX_BYTES}));
  const pkg=readPackage(files,String(a.file.file_name||'world.zip').slice(0,200));
  let packageWorld=null;
  const list=((await request({op:'projects'})).data||[]).filter(r=>auth.projects.has(r.project)).flatMap(r=>{let pm;try{pm=JSON.parse(r.manifest);}catch{return [];}if(pm.deleted_at)return [];
   if(pkg.package_id&&!pm.system_pool&&pm.xce_world_packages?.[pkg.package_id])packageWorld=r.project;
   return [{id:r.project,title:pm.campaign_name||r.project,system_pool:Boolean(pm.system_pool)}];});
  // A World Builder `nw` ZIP asks for a new world only the first time: once a world holds this package, resends fill that world.
  const chosen=a.project_id||packageWorld||null;
  const world=resolveWorld(list,pkg,chosen,{createNew:a.create_new===true||(a.create_new===undefined&&!chosen&&pkg.world_mode==='new'),name:a.new_name||''});
  if(world.mode==='ambiguous')return {mode:'ambiguous',name:world.name,candidates:list.filter(x=>!x.system_pool&&normTitle(x.title)===normTitle(world.name)).map(x=>({id:x.id,title:x.title})),complete:false,warnings:pkg.warnings};
  let p=world.project_id,mode='existing';
  if(world.mode==='create'){p='w-'+(slugify(world.name)||'world').slice(0,60)+'-'+randomUUID().slice(0,8);a={...a,project_id:p,name:world.name};await create(fresh());mode='created';}
  let {m,revision}=await load(p);check(!m.system_pool,'Choose a creative world');
  const applied=applyRecords(m,pkg,{project_id:p,revision,choices:{}});m=applied.manifest;
  const scripts={added:[],same:[],kept:[]};
  try{
   const ws=m.story_workspace||{document:emptyStory(),revision:0,updated_at:null},merged=mergeScriptDrafts(ws.document,scriptDrafts(files),m);
   Object.assign(scripts,{added:merged.added,same:merged.same,kept:merged.kept});
   if(merged.added.length)m.story_workspace={document:merged.story,revision:(ws.revision||0)+1,updated_at:new Date().toISOString()};
  }catch(e){scripts.failed=e.message;}
  m.history||=[];m.history.push({kind:'mcp_import_world_zip',date:new Date().toISOString()});
  revision=await save(p,m,revision);
  const images={added:0,skipped_duplicate:0,skipped_locked:[],too_large:[],failed:[],remaining:0};let pending=[],error=null;
  const hasSha=(mm,sha)=>Object.values(mm.references||{}).some(r=>r?.content_sha256===sha&&!r.deleted_at);
  // Save attached images; if the website saved in between, reload and re-attach so neither side is lost.
  async function persist(){
   if(!pending.length)return;
   try{revision=await save(p,m,revision);}
   catch(e){
    if(!/Concurrent|verification uncertain/.test(e.message))throw e;
    ({m,revision}=await load(p));
    for(const args of pending)if(!hasSha(m,args.sha256)){try{m=attachImage(m,args);}catch{/* locked or removed meanwhile: leave it */}}
    revision=await save(p,m,revision);
   }
   pending=[];
  }
  for(let i=0;i<pkg.images.length;i++){
   const img=pkg.images[i];
   if(img.too_large){images.too_large.push(img.file);continue;}
   if(overBudget()){images.remaining=pkg.images.slice(i).filter(x=>!x.too_large).length;break;}
   const bytes=files[img.file],sha256=sha256Of(bytes);
   if(hasSha(m,sha256)){images.skipped_duplicate++;continue;}
   const label=(img.asset_key&&pkg.assets.find(x=>x.key===img.asset_key)?.name)||img.file.split('/').pop().replace(/\.[^.]+$/,'');
   const reference_id=referenceIdFor(m,img.category,label),key='xce/'+auth.owner+'/'+p+'/'+reference_id+'-'+randomUUID();
   const args={reference_id,key,name:label,mime_type:img.mime_type,size:bytes.length,sha256,category:img.category,asset_id:img.asset_key?applied.id_map[img.asset_key]||null:null};
   let next;
   try{next=attachImage(m,args);}
   catch(e){if(/locked/i.test(e.message))images.skipped_locked.push(img.file);else images.failed.push({file:img.file,reason:e.message});continue;}
   try{
    await request({op:'file_put',key,mime_type:img.mime_type,base64:Buffer.from(bytes).toString('base64'),name:label,library_visible:true});
    const stored=await getImage(key);check(stored&&sha256Of(Buffer.from(await stored.arrayBuffer()))===sha256,'Import image read-back verification failed');
    m=next;images.added++;pending.push(args);
    if(pending.length>=SAVE_EVERY)await persist();
   }catch(e){error=e.message;images.remaining=pkg.images.slice(i).filter(x=>!x.too_large).length;break;}
  }
  try{await persist();}catch(e){error=error||e.message;images.added-=pending.length;}
  return {project_id:p,name:m.campaign_name||world.name,mode,revision,report:applied.report,images,scripts,warnings:pkg.warnings,complete:images.remaining===0&&!error,...(error?{error}:{})};
 }
 const {m:original,revision}=await load(a.project_id,{deleted:name==='restore_folder'||name==='list_trash'});const m=structuredClone(original);
 if(name==='export_world')return {project_id:a.project_id,revision,file_name:a.project_id+'-r'+revision+'.world.zip',format:'xce-portable-world',download_path:'/api/world-export?project_id='+encodeURIComponent(a.project_id),json_path:'/api/world-export?project_id='+encodeURIComponent(a.project_id)+'&format=json',includes:['world.json','DIRECTOR_BRIEF.md','original reference images','media-index.json'],note:'Open the download link while signed into XSTUDIO. The JSON-only file references images; the ZIP contains their original bytes. Destination import support must be checked.'};
 if(name==='get_world_builder')return {project_id:a.project_id,revision,world_builder:m.world_builder||{},character_network:m.character_network||{},context:compileWorld(m,a.project_id),power_tiers:Object.fromEntries(Object.entries(m.asset_details||{}).filter(([,d])=>d?.power_tier).map(([id,d])=>[id,d.power_tier])),schemas:{world_builder_fields:WORLD_BUILDER_FIELDS,asset_categories:WORLD_TYPES,asset_metadata:METADATA_SCHEMA,asset_form_sections:ASSET_FORM_SECTIONS,world_presets:WORLD_PRESETS}};
 if(name==='list_trash')return {project_id:a.project_id,revision,folder_deleted:Boolean(m.deleted_at),items:Object.entries(m.trash||{}).slice(a.offset,a.offset+a.limit).map(([key,t])=>({key,entity:t.entity||null,id:t.id||recordId(t.record),name:t.record?.name||null,deleted_at:t.deleted_at||null})),next_offset:Object.keys(m.trash||{}).length>a.offset+a.limit?a.offset+a.limit:null};
 check(revision===a.expected_revision,'Project changed; reload before writing');check(!m.system_pool,'System pools cannot be changed by workspace tools');let result={};
 if(name==='update_character_profile'){const details={...(a.gender!==undefined?{gender:a.gender}:{}),...(a.quick_details!==undefined?{quick_details:a.quick_details}:{}),...(a.links!==undefined?{links:a.links}:{})};check(Object.keys(details).length,'Provide profile details');Object.assign(m,saveCharacterDetails(m,a.asset_id,details,worldRecords(m)));result={asset_id:a.asset_id,character_network:m.character_network};}
 else if(name==='update_world_builder'){
  check(!a.patch.firestarter_state||a.patch.firestarter_state.project_id===a.project_id,'Narrative state belongs to a different project');updateWorldBuilder(m,a.patch);result={world_builder:m.world_builder};
 }else if(name==='create_world_asset'){
  check(Object.hasOwn(WORLD_TYPES,a.category)||a.category==='creatures','Choose a valid world asset category');
  check(!codedRecords(m).some(({record:r,type})=>r.name?.trim().toLowerCase()===a.name.trim().toLowerCase()&&type===({characters:'character',creatures:'creature',props:'prop',vehicles:'vehicle',locations:'location',wardrobe:'wardrobe',rooms:'room',scenes_and_shots:'keyframe'})[a.category]),'An asset with this name already exists in this category; open it instead');
  const id=randomUUID();
  if(a.category==='creatures'){m.manifest_store.creatures||={};m.manifest_store.creatures[id]={asset_id:id,asset_type:'creature',name:a.name.trim(),status:'DRAFT',reference_ids:[],immutable_traits:{},mode:'simple',medium:'RL',target_deliverable:'creature_sheet',analysis_pending:true};}
  else {const record={id,type:a.category,name:a.name.trim(),status:'DRAFT',reference_ids:[],thumbnail_reference_id:'',metadata:Object.fromEntries(WORLD_FIELDS[a.category].map(k=>[k,'']))};const world={...emptyWorld(),...m.world_library};world[a.category]={...world[a.category],[id]:record};m.world_library=validateWorld(world,m);}
  assignAssetCodes(m);result={asset_id:id,asset_code:codedRecords(m).find(e=>recordId(e.record)===id).record.asset_code,name:a.name.trim(),category:a.category,status:'DRAFT',approved:false};
 }else if(name==='update_folder'){check(a.name!==undefined||a.description!==undefined,'Supply a folder name or description');if(a.name!==undefined)m.campaign_name=a.name.trim();if(a.description!==undefined)m.project_description=a.description.trim();stampProjectIdentity(m,a.project_id);result={name:m.campaign_name,description:m.project_description||''};}
 else if(name==='delete_folder'){m.deleted_at=new Date().toISOString();m.permits={};result={deleted:true,recoverable:true};}
 else if(name==='restore_folder'){check(m.deleted_at,'Folder is not deleted');delete m.deleted_at;result={restored:true};}
 else if(name==='delete_assets')result=trashAssets(m,a.asset_ids);
 else if(name==='restore_assets')result=restoreAssets(m,a.trash_keys);
 else if(name==='purge_trash')result={...purgeTrash(m,{keys:a.trash_keys,confirm:true}),stored_image_bytes_deleted:false};
 else if(name==='import_asset'){
  const bytes=imageBytes(a.image_base64,a.mime_type);check(bytes.length<=MAX_IMAGE_BYTES,'Import image must be at most 2.5 MB');
  const stored=await storeImage(m,{bytes,mime_type:a.mime_type,name:a.name,upload_category:a.upload_category,dedupe:false});delete stored.reused;result=stored;
 }else if(name==='import_image_file'){
  const bytes=await fetchFile(a.file,{maxBytes:MAX_IMAGE_BYTES}),mime=imageMime(Buffer.from(bytes));
  check(mime,'Only PNG, JPEG or WebP images can be imported');
  result=await storeImage(m,{bytes,mime_type:mime,name:a.name,upload_category:a.upload_category});
 }else if(name==='save_script'){
  const ws=m.story_workspace||{document:emptyStory(),revision:0,updated_at:null};
  const r=upsertScript(ws.document,{title:a.title,body:a.body,kind:a.kind||'script'},m);
  m.story_workspace={document:r.story,revision:(ws.revision||0)+1,updated_at:new Date().toISOString()};
  const draft=r.story.documents.find(d=>d.id===r.id);result={draft_id:r.id,title:draft.title,kind:draft.kind,action:r.action};
 }else throw Error('Unknown workspace tool');
 m.history||=[];m.history.push({kind:'mcp_'+name,date:new Date().toISOString()});return {...result,saved:true,project_id:a.project_id,revision:await save(a.project_id,m,revision)};
}
