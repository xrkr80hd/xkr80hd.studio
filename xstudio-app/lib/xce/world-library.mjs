import {characterContext,characterContextPrompt} from './character-network.mjs';
export const WORLD_TYPES={characters:'Characters',wardrobe:'Wardrobe',props:'Props',vehicles:'Vehicles',locations:'Locations',rooms:'Rooms',scenes_and_shots:'Scenes & Shots'};
export const IMAGE_FIELDS=['face_anchor_url','body_anchor_url','costume_anchors','exterior_anchor','interior_anchor','exterior_environment_anchor'];
export const WORLD_FIELDS={
 characters:['identity_lock','face_anchor_url','body_anchor_url','voice','traits','style_anchor'],
 wardrobe:['parent_character_id','costume_anchors','fabrics','palette','outfit_variant','style_anchor'],
 props:['scale_anchor','material_definition','detail_prompt','style_anchor'],
 vehicles:['exterior_anchor','interior_anchor','mechanical_wear','styling','style_anchor'],
 locations:['exterior_environment_anchor','world_geography','lighting_preset','style_anchor'],
 rooms:['parent_location_id','interior_bounds','architectural_layout','camera_bounds','lighting_preset','style_anchor'],
 scenes_and_shots:['shot_sequence','linked_asset_ids','camera_spec','movement_tags','beat_pacing','style_anchor']
};
export function emptyWorld(){return Object.fromEntries(Object.keys(WORLD_TYPES).map(k=>[k,{}]));}
export function worldRecords(manifest){
 const world=manifest.world_library||emptyWorld();
 const rows=Object.entries(world).flatMap(([type,items])=>Object.values(items||{}).map(a=>({...a,type})));
 for(const [type,items] of Object.entries(manifest.manifest_store||{})){
  const mapped=type==='creatures'?'characters':type==='shots'?'scenes_and_shots':type;
  if(!WORLD_TYPES[mapped])continue;
  for(const a of Object.values(items||{})){const id=a.asset_id||a.id;if(rows.some(x=>x.id===id))continue;rows.push({...a,id,type:mapped,legacy:true,reference_ids:[...new Set((a.status==='LOCKED'&&a.source_image_id?[a.source_image_id]:[a.source_image_id,...(a.reference_ids||[])]).filter(Boolean))],metadata:{identity_lock:a.generation_prompt||JSON.stringify(a.immutable_traits||{}),traits:JSON.stringify(a.immutable_traits||{}),style_anchor:a.medium||'',...(a.wardrobe_lock?{wardrobe_lock:JSON.stringify(a.wardrobe_lock)}:{})}});}
 }
 return rows;
}
export function validateWorld(world,manifest){
 if(!world||typeof world!=='object'||Array.isArray(world))throw Error('Invalid world library');
 const clean=emptyWorld();let count=0;const all=Object.values(world).flatMap(x=>Object.values(x||{}));
 for(const [type,items] of Object.entries(world)){
  if(!WORLD_TYPES[type]||!items||typeof items!=='object'||Array.isArray(items))throw Error('Unknown asset library');
  for(const [id,a] of Object.entries(items)){
   if(++count>2000||!/^[\w-]{1,128}$/.test(id)||a.id!==id||a.type!==type||typeof a.name!=='string'||!a.name.trim()||a.name.length>200)throw Error('Invalid asset');
   if(!['DRAFT','LOCKED'].includes(a.status))throw Error('Invalid approval state');
   if(!Array.isArray(a.reference_ids)||a.reference_ids.length>30||a.reference_ids.some(r=>!manifest.references?.[r]||manifest.references[r].role==='DIAGNOSTIC'))throw Error('Use saved project reference images only');
   const metadata={};for(const k of WORLD_FIELDS[type]){const v=a.metadata?.[k]||'';if(typeof v!=='string'||v.length>10000)throw Error('Invalid '+k);metadata[k]=v;}
   for(const key of IMAGE_FIELDS)if(metadata[key]&&!a.reference_ids.includes(metadata[key]))throw Error('Choose '+key.replaceAll('_',' ')+' from this asset’s project images');
   const parentKey=type==='wardrobe'?'parent_character_id':type==='rooms'?'parent_location_id':null;
   if(parentKey&&metadata[parentKey]){const parent=[...all,...worldRecords({...manifest,world_library:{}})].find(x=>x.id===metadata[parentKey]);if(!parent||parent.type!==(type==='wardrobe'?'characters':'locations'))throw Error('Choose a parent from this project');}
   if(a.status==='LOCKED'){
    if(!a.reference_ids.length)throw Error('A locked asset requires a saved visual anchor');
   }
   const prior=manifest.world_library?.[type]?.[id];
   const record={id,type,name:a.name.trim(),status:a.status,reference_ids:[...new Set(a.reference_ids)],thumbnail_reference_id:a.reference_ids[0]||'',metadata,...(prior?.asset_code?{asset_code:prior.asset_code,asset_code_record_id:prior.asset_code_record_id||id}:{})};
   if(prior?.status==='LOCKED'){const immutable=r=>({id:r.id,type:r.type,name:r.name.trim(),status:r.status,reference_ids:[...new Set(r.reference_ids)],thumbnail_reference_id:r.reference_ids[0]||'',metadata:Object.fromEntries(WORLD_FIELDS[type].filter(k=>!['voice','traits'].includes(k)).map(k=>[k,r.metadata?.[k]||'']))});if(JSON.stringify(immutable(record))!==JSON.stringify(immutable(prior)))throw Error('Locked assets are immutable. Duplicate a draft variant.');}
   clean[type][id]=record;
  }
 }
 for(const [type,items] of Object.entries(manifest.world_library||{}))for(const [id,a] of Object.entries(items))if(a.status==='LOCKED'&&!clean[type]?.[id])throw Error('Locked anchors cannot be removed by a library save');
 return clean;
}
export function bindProjectPrompt(manifest,projectId,text){
 if(!projectId)throw Error('Choose a project before compiling');
 const assets=worldRecords(manifest),matches=[...text.matchAll(/@\[([^\]]+)\]|@([\w-]+)/g)],bound=new Map();
 if(!matches.length)throw Error('Insert at least one @Asset from this project');
 const add=(target)=>{const hits=assets.filter(a=>a.id===target||a.name.toLowerCase()===target.toLowerCase());if(hits.length!==1)throw Error('Unknown or ambiguous project asset: '+target);const a=hits[0];if(bound.has(a.id))return;if(a.status!=='LOCKED')throw Error('Lock '+a.name+' before generation');if(!a.reference_ids?.length)throw Error('Missing visual anchor for '+a.name);for(const id of a.reference_ids)if(!manifest.references?.[id]||manifest.references[id].role==='DIAGNOSTIC')throw Error('Missing or invalid local reference '+id);bound.set(a.id,a);for(const key of ['parent_character_id','parent_location_id'])if(a.metadata?.[key])add(a.metadata[key]);for(const id of (a.metadata?.linked_asset_ids||'').split(',').map(v=>v.trim()).filter(Boolean))add(id);};
 matches.forEach(m=>add(m[1]||m[2]));
 const referenceIds=[...new Set([...bound.values()].flatMap(a=>a.reference_ids))];
 const references=referenceIds.map(id=>({reference_id:id,url:'/api/manifest?project='+encodeURIComponent(projectId)+'&file='+encodeURIComponent(id),role:manifest.references[id].role}));
 const continuity=characterContext(manifest,[...bound.keys()],assets);
 const locks=[...bound.values()].map(a=>({asset_id:a.id,name:a.name,type:a.type,anchor_tokens:Object.fromEntries(Object.entries(a.metadata||{}).map(([key,value])=>[key,IMAGE_FIELDS.includes(key)&&value?'/api/manifest?project='+encodeURIComponent(projectId)+'&file='+encodeURIComponent(value):value])),visual_parameters:a.immutable_traits||{},reference_ids:a.reference_ids}));
 return {character_continuity:continuity,project_id:projectId,source_origin:'LOCAL_PROJECT_STORE',allow_external_defaults:false,anchor_binding_verified:true,character_anchors:locks.filter(a=>a.type==='characters'),assets:locks,references,prompt:[characterContextPrompt(continuity),'Use only the attached saved project anchors. Never substitute franchise, public-web, remembered or generic character designs. Preserve identity, wardrobe, scale, materials, geometry and style. If a reference is inaccessible, stop.',...locks.map(a=>'LOCK '+a.name+' '+JSON.stringify(a.anchor_tokens)),text].join('\n'),rendered:false};
}
