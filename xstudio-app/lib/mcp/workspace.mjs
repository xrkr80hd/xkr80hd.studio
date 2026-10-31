import {saveCharacterDetails} from '../xce/character-network.mjs';
import {worldRecords} from '../xce/world-library.mjs';
import {WORLD_BUILDER_FIELDS,updateWorldBuilder} from '../xce/world-builder-fields.mjs';
import {compileWorld} from '../xce/world-builder.mjs';
import {WORLD_TYPES,WORLD_FIELDS,emptyWorld,validateWorld} from '../xce/world-library.mjs';
import {METADATA_SCHEMA} from '../xce/asset-metadata.mjs';
import {ASSET_FORM_SECTIONS} from '../xce/asset-form-layout.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {fresh} from '../xce/core.mjs';
import {deriveCode,lockNamespace,allocate,annotate} from '../xce/namespace.mjs';
import {codedRecords,recordId,assignAssetCodes} from '../xce/asset-codes.mjs';
import {uploadDestination,classifyUpload} from '../xce/upload-category.mjs';
import {stampProjectIdentity} from '../xce/project-identity.mjs';
import {usesReference} from '../xce/attachments.mjs';
import {purgeTrash} from '../xce/library.mjs';
import {imageBytes} from '../xce/xstudio-bridge.mjs';

export const workspaceScopes={update_character_profile:'asset:metadata',update_world_builder:'asset:write',create_world_asset:'asset:write',create_folder:'asset:write',update_folder:'asset:write',import_asset:'asset:write',import_project:'asset:write',delete_folder:'asset:delete',restore_folder:'asset:write',delete_assets:'asset:delete',restore_assets:'asset:write',purge_trash:'asset:delete'};
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
export async function workspaceOperation(name,a,{auth,request,getImage}){
 const scope=workspaceScopes[name];if(scope)check(auth.scopes?.has(scope),'Permission required: '+scope+'; reconnect and approve access');
 if(scope)check(a.confirm===true,'Explicit confirmation required');
 async function load(p,{deleted=false}={}){check(auth.projects.has(p),'Project not found or unavailable');const row=(await request({op:'load',project:p})).data;check(row,'Project not found or unavailable');const m=JSON.parse(row.manifest);check(!m.folder_lock,'Folder locked; unlock it in XSTUDIO');check(deleted||!m.deleted_at,'Project is in trash');return {m,revision:row.revision};}
 async function save(p,m,revision){const text=JSON.stringify(m);check(Buffer.byteLength(text)<1_900_000,'Project manifest too large');const r=await request({op:'save',project:p,revision,manifest:text});check(r.changes===1,'Concurrent project update; reload before retrying');const row=(await request({op:'load',project:p})).data;check(row?.revision===revision+1&&row.manifest===text,'Save verification uncertain; reload before retrying');return revision+1;}
 async function create(m){check(!a.project_id.startsWith('xce-'),'Reserved system folder ID');const prior=(await request({op:'load',project:a.project_id})).data;check(!prior,'Project ID already exists');
  delete m.active_project_code;delete m.auto_id_parser;const base=deriveCode(a.name);let code=(await request({op:'code',project:a.project_id})).data?.code;
  for(let i=0;!code&&i<1000;i++){const suffix=i?String(i+1):'',candidate=base.slice(0,4-suffix.length)+suffix;const r=await request({op:'reserve_code',project:a.project_id,code:candidate});if(r.reserved!==false){code=candidate;break;}}
  check(code,'Could not reserve project code');lockNamespace(m,code);m.campaign_name=a.name.trim();m._mcp_created_for=marker(auth);stampProjectIdentity(m,a.project_id);m.permits={};m.pending_action=null;delete m.folder_lock;delete m.deleted_at;assignAssetCodes(m);
  const revision=await save(a.project_id,m,0);auth.projects.add(a.project_id);return {saved:true,project_id:a.project_id,name:m.campaign_name,project_code:code,revision};}
 if(name==='create_folder')return create(fresh());
 if(name==='import_project'){const source=await load(a.source_project_id);check(!source.m.system_pool,'Choose a creative project');check(source.revision===a.expected_revision,'Source project changed; reload');return {...await create(structuredClone(source.m)),source_project_id:a.source_project_id,reference_images_reused:true,image_bytes_copied:false};}
 const {m:original,revision}=await load(a.project_id,{deleted:name==='restore_folder'||name==='list_trash'});const m=structuredClone(original);
 if(name==='export_world')return {project_id:a.project_id,revision,file_name:a.project_id+'-r'+revision+'.world.zip',format:'xce-portable-world',download_path:'/api/world-export?project_id='+encodeURIComponent(a.project_id),json_path:'/api/world-export?project_id='+encodeURIComponent(a.project_id)+'&format=json',includes:['world.json','DIRECTOR_BRIEF.md','original reference images','media-index.json'],note:'Open the download link while signed into XSTUDIO. The JSON-only file references images; the ZIP contains their original bytes. Destination import support must be checked.'};
 if(name==='get_world_builder')return {project_id:a.project_id,revision,world_builder:m.world_builder||{},character_network:m.character_network||{},context:compileWorld(m,a.project_id),schemas:{world_builder_fields:WORLD_BUILDER_FIELDS,asset_categories:WORLD_TYPES,asset_metadata:METADATA_SCHEMA,asset_form_sections:ASSET_FORM_SECTIONS}};
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
  const bytes=imageBytes(a.image_base64,a.mime_type);check(bytes.length<=2_500_000,'Import image must be at most 2.5 MB');
  const destination=uploadDestination(a.upload_category),id=allocate(m,destination.asset_type||'prop',a.name),key='xce/'+auth.owner+'/'+a.project_id+'/'+id+'-'+randomUUID();
  const sha256=createHash('sha256').update(bytes).digest('hex');await request({op:'file_put',key,mime_type:a.mime_type,base64:a.image_base64,name:a.name,library_visible:true});
  const stored=await getImage(key);check(stored&&createHash('sha256').update(Buffer.from(await stored.arrayBuffer())).digest('hex')===sha256,'Import image read-back verification failed');
  const ref=annotate({id,name:a.name,asset_name:a.name,...destination,mime_type:a.mime_type,key,size:bytes.length,content_sha256:sha256},m,destination.asset_type);m.references[id]=ref;
  const asset=classifyUpload(m,ref,a.upload_category);assignAssetCodes(m);result={reference_id:id,asset_id:asset?.asset_id||null,asset_code:asset?.asset_code||ref.asset_code,sha256,status:asset?'DRAFT':'REFERENCE',approved:false,verified:true};
 }else throw Error('Unknown workspace tool');
 m.history||=[];m.history.push({kind:'mcp_'+name,date:new Date().toISOString()});return {...result,saved:true,project_id:a.project_id,revision:await save(a.project_id,m,revision)};
}
