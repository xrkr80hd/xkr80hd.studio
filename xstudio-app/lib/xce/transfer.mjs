function copyAssetDetails(source,dest,mapping){
 for(const [oldId,newId] of mapping){const details=source.asset_details?.[oldId];if(!details)continue;dest.asset_details||={};dest.asset_details[newId]={...structuredClone(details),equipment_ids:(details.equipment_ids||[]).map(id=>mapping.get(id)||(source===dest?id:null)).filter(Boolean),clauses:(details.clauses||[]).flatMap(c=>{const character=mapping.get(c.character_id)||(source===dest?c.character_id:null);return character&&(dest.manifest_store?.characters?.[character]||dest.world_library?.characters?.[character])?[{...c,character_id:character}]:[]})};}
}
import {allocate,newSceneId,annotate,shotId} from './namespace.mjs';
import {need,categories,findAsset} from './core.mjs';
import {manage} from './manage.mjs';
export function transfer(source,dest,a){
 if(!a.destination_id)return transferAutomatic(source,dest,a);
 const category=categories[a.entity];const src=a.entity==='reference'?source.references:a.entity==='scene'?source.scenes:source.manifest_store[category];
 const dst=a.entity==='reference'?dest.references:a.entity==='scene'?dest.scenes:dest.manifest_store[category];
 const record=src[a.id];need(record,'Source record not found');need(!dst[a.destination_id]&&!findAsset(dest,a.destination_id),'Destination ID already exists');
 need(source!==dest||a.id!==a.destination_id,'Choose a different destination ID');
 // Check the entire move before any mutation.
 if(a.operation==='move')manage(structuredClone(source),{entity:a.entity,action:'delete',id:a.id,confirm:true});
 const dependencies=new Map();
 const addRef=id=>{need(source.references[id],'Missing source reference '+id);if(dest.references[id])need(dest.references[id].key===source.references[id].key,'Reference ID conflict: '+id);else dependencies.set('reference:'+id,{type:'reference',id,record:source.references[id]})};
 const addAsset=id=>{const r=findAsset(source,id);need(r,'Missing assigned anchor '+id);const existing=findAsset(dest,id);if(existing){need(JSON.stringify(existing)===JSON.stringify(r),'Anchor ID conflict: '+id);}else dependencies.set(r.asset_type+':'+id,{type:r.asset_type,id,record:r});for(const ref of r.reference_ids||[])addRef(ref);if(r.source_image_id)addRef(r.source_image_id)};
 if(a.entity==='scene'){
  addRef(record.blueprint_id);for(const id of [...record.character_ids,...record.prop_ids,...record.location_ids])addAsset(id);
  for(const shot of Object.values(record.shots||{})){for(const id of shot.assigned_reference_ids||[])addRef(id);const reviewed=source.manifest_store.shots[shot.asset_id];for(const id of [shot.source_image_id,shot.output_reference_id,reviewed?.source_image_id,reviewed?.output_reference_id].filter(Boolean))addRef(id)}
 }else if(a.entity!=='reference'){
  for(const ref of record.reference_ids||[])addRef(ref);if(record.source_image_id)addRef(record.source_image_id);
 }
 for(const dep of dependencies.values()){const copy=structuredClone(dep.record);delete copy.asset_code;delete copy.asset_code_record_id;(dep.type==='reference'?dest.references:dest.manifest_store[categories[dep.type]])[dep.id]=copy;}
 const copy=structuredClone(record);if(a.entity==='reference')copy.id=a.destination_id;else if(a.entity==='scene'){
  copy.scene_id=a.destination_id;
  for(const shot of Object.values(copy.shots||{})){shot.scene_id=a.destination_id;shot.asset_id=a.destination_id+'-shot-'+shot.shot_number;need(!findAsset(dest,shot.asset_id),'Shot ID conflict');const original=source.manifest_store.shots[Object.values(record.shots).find(s=>s.shot_number===shot.shot_number)?.asset_id];if(original)dest.manifest_store.shots[shot.asset_id]={...structuredClone(original),scene_id:a.destination_id,asset_id:shot.asset_id}}
 }else copy.asset_id=a.destination_id;
 if(a.operation==='duplicate'){delete copy.asset_code;delete copy.asset_code_record_id}else copy.asset_code_record_id=copy.asset_id||copy.scene_id||copy.id;
 copy.name=a.name?.trim()||copy.name||a.destination_id;copy.copied_from={project_id:a.project_id,id:a.id};dst[a.destination_id]=copy;
 copyAssetDetails(source,dest,new Map([[a.id,a.destination_id],...[...dependencies.values()].filter(d=>d.type!=='reference').map(d=>[d.id,d.id])]));
 if(a.operation==='move')manage(source,{entity:a.entity,action:'delete',id:a.id,confirm:true});
 dest.permits={};dest.history.push({kind:'transfer',...a,date:new Date().toISOString()});
 return {saved:true,operation:a.operation,id:a.destination_id,copied_dependencies:dependencies.size};
}

// Rebase identifiers and every reference edge when transferring to a new namespace.
function transferAutomatic(source,dest,a){
 const sourceCollection=a.entity==='reference'?source.references:a.entity==='scene'?source.scenes:source.manifest_store[categories[a.entity]];
 const original=sourceCollection[a.id];need(original,'Source record not found');
 if(a.operation==='move')manage(structuredClone(source),{entity:a.entity,action:'delete',id:a.id,confirm:true});
 const copies=new Map(),mapping=new Map();
 const reserve=(type,id,r,name,root)=>{if(mapping.has(id))return mapping.get(id);const next=type==='scene'?newSceneId(dest):allocate(dest,type==='reference'?(r.asset_type||'character'):type,name||r.asset_name||r.name||id,root);mapping.set(id,next);copies.set(id,{type,record:structuredClone(r),next,name});return next;};
 const rootName=a.name?.trim()||original.name||original.asset_name||a.id;
 const main=reserve(a.entity,a.id,original,rootName);
 const copyRef=id=>{need(source.references[id],'Missing source reference '+id);if(source===dest){mapping.set(id,id);return;}const r=source.references[id];reserve('reference',id,r,r.asset_name||r.name)};
 const copyAsset=id=>{const r=findAsset(source,id);need(r,'Missing anchor '+id);if(source===dest){mapping.set(id,id);return;}reserve(r.asset_type,id,r,r.name);for(const ref of r.reference_ids||[])copyRef(ref);if(r.source_image_id)copyRef(r.source_image_id)};
 if(a.entity==='scene'){
  copyRef(original.blueprint_id);for(const id of [...original.character_ids,...original.prop_ids,...original.location_ids])copyAsset(id);
  const sceneMeta=annotate({scene_id:main},dest,'scene');
  for(const shot of Object.values(original.shots||{})){const r=source.manifest_store.shots[shot.asset_id]||shot;const id=shotId(dest,sceneMeta,shot.shot_number);mapping.set(shot.asset_id,id);copies.set(shot.asset_id,{type:'keyframe',record:structuredClone(r),next:id});for(const ref of r.assigned_reference_ids||[])copyRef(ref);if(r.source_image_id)copyRef(r.source_image_id);if(r.output_reference_id)copyRef(r.output_reference_id);}
 }else if(a.entity!=='reference'){for(const ref of original.reference_ids||[])copyRef(ref);if(original.source_image_id)copyRef(original.source_image_id)}
 const scalar=new Set(['id','asset_id','scene_id','reference_id','blueprint_id','source_image_id','output_reference_id','preview_reference_id','base_asset_id','source_reference_id','supersedes']);
 const arrays=new Set(['reference_ids','assigned_reference_ids','character_ids','prop_ids','location_ids','assigned_character_ids','anchor_ids']);
 const rewire=(o)=>{if(!o||typeof o!=='object')return;for(const [k,v]of Object.entries(o)){if(scalar.has(k)&&typeof v==='string'&&mapping.has(v))o[k]=mapping.get(v);else if(arrays.has(k)&&Array.isArray(v))o[k]=v.map(id=>mapping.get(id)||id);else if(k!=='copied_from')rewire(v)}};
 for(const [id,c]of copies){const r=c.record;rewire(r);if(c.type==='reference')r.id=c.next;else if(c.type==='scene')r.scene_id=c.next;else r.asset_id=c.next;if(c.name)r.name=c.name;if(a.operation==='move'&&id===a.id)r.asset_code_record_id=c.next;else{delete r.asset_code;delete r.asset_code_record_id;}annotate(r,dest,c.type==='reference'?(r.asset_type||'character'):c.type);r.copied_from={project_id:a.project_id,id};const dst=c.type==='reference'?dest.references:c.type==='scene'?dest.scenes:dest.manifest_store[categories[c.type]];need(!dst[c.next]&&!findAsset(dest,c.next),'Destination ID already exists');dst[c.next]=r;}
 copyAssetDetails(source,dest,mapping);
 if(a.operation==='move')manage(source,{entity:a.entity,action:'delete',id:a.id,confirm:true});
 dest.permits={};dest.history.push({kind:'transfer',...a,destination_id:main,date:new Date().toISOString()});
 return {saved:true,operation:a.operation,id:main,copied_dependencies:copies.size-1};
}
