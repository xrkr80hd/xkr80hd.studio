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
export function backend(token,fetcher=fetch){
 return async args=>{
  if(!['projects','load','file_get'].includes(args.op))throw new GatewayError('Read-only operation required',403);
  let r;try{r=await fetcher(XSTUDIO_ENDPOINT+'?resource=engine',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(args),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(25000)});}catch{throw new GatewayError('Backend unavailable',502);}
  if(!r.ok)throw new GatewayError(r.status===401?'Invalid credential':'Backend unavailable',r.status===401?401:502);
  return readJSON(r,args.op==='projects'?32*1024*1024:4*1024*1024);
 };
}
// Do not export storage paths, folder PIN hashes, session grants, or arbitrary URLs.
const PRIVATE=new Set(['key','storage_path','storage_bucket','folder_lock','session_hash','pin_hash','token_hash','salt']);
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
 if(r.status==='LOCKED'&&r.source_image_id)return [r.source_image_id];
 return [...new Set([...(r.reference_ids||r.assigned_reference_ids||[]),r.source_image_id,r.output_reference_id,r.blueprint_id,r.thumbnail_reference_id,...['face_anchor_url','body_anchor_url','costume_anchors','exterior_anchor','interior_anchor','exterior_environment_anchor'].map(k=>r.metadata?.[k])].filter(v=>typeof v==='string'&&v))];
}
export function dataSource(auth,request=backend(auth.backendToken)){
 async function project(p){
  if(!auth.projects.has(p))notFound();
  const row=(await request({op:'load',project:p})).data;if(!row)notFound();const m=manifest(row);if(!m)notFound();return {m,revision:row.revision};
 }
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
  if(name==='list_projects'){
   // Edge API revalidates expiry, revocation, owner membership and asset:read.
   const rows=(await request({op:'projects'})).data;if(!Array.isArray(rows))throw new GatewayError('Backend unavailable',502);
   const projects=rows.filter(r=>auth.projects.has(r.project)).flatMap(r=>{const m=manifest(r);return m?[summary(r,m)]:[];});
   return {projects:projects.slice(a.offset,a.offset+a.limit),next_offset:projects.length>a.offset+a.limit?a.offset+a.limit:null};
  }
  const {m,revision}=await project(a.project_id);const p=a.project_id;
  if(name==='get_project')return {...summary({project:p,revision},m),asset_count:allRecords(m).length,scene_ids:Object.keys(m.scenes||{})};
  if(['list_project_assets','search_assets','list_establishing_shots'].includes(name)){
   let rows=allRecords(m);
   if(a.category)rows=rows.filter(r=>r.type===a.category);
   if(name==='search_assets'){const q=a.query.toLocaleLowerCase();rows=rows.filter(({record:r})=>[recordId(r),r.asset_code,r.name,r.asset_name].some(v=>typeof v==='string'&&v.toLocaleLowerCase().includes(q)));}
   if(name==='list_establishing_shots')rows=rows.filter(({record:r})=>[r.shot_type,r.camera?.shot,r.camera_spec?.framing,r.metadata?.shot_type].some(v=>v==='establishing'||v==='establishing shot'));
   return {project_id:p,assets:rows.slice(a.offset,a.offset+a.limit).map(r=>packed(p,r)),next_offset:rows.length>a.offset+a.limit?a.offset+a.limit:null};
  }
  if(name==='get_color_grades')return {project_id:p,grades:publicData(gradeLibrary(m)),assignments:publicData(m.color_grades?.assignments||{})};
  if(name==='get_composition_rules')return {project_id:p,character_network:publicData(m.character_network||{}),compositions:publicData(m.composer?.compositions||{}),intelligence:publicData(m.composer?.intelligence||{}),...(a.character_ids?{applicable:publicData(characterContext(m,a.character_ids,worldRecords(m)))}:{}),application_rule:'Apply enabled saved clauses only when both linked characters are selected. Never add a character to activate a clause.'};
  if(name==='get_scene_references'){
   const entry=find(m,a.scene_id);if(entry.type!=='scene'&&entry.type!=='keyframe'&&entry.record.type!=='scenes_and_shots')notFound();
   const ids=referenceIds(entry.record,entry.type);return {...packed(p,entry),references:await references(m,p,ids,a.include_media)};
  }
  const entry=find(m,a.asset_id);
  if(name.startsWith('get_character_')&&entry.type!=='character')notFound();
  if(name==='get_character_anchor'&&entry.record.status!=='LOCKED')throw new GatewayError('No saved locked character anchor',404);
  const ids=referenceIds(entry.record,entry.type);
  if(name==='get_character_anchor'&&!ids.length)throw new GatewayError('Saved anchor references are missing',404);
  return {...packed(p,entry),references:await references(m,p,ids,a.include_media)};
 };
}
