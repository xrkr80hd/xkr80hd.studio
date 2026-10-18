import {allocate} from './namespace.mjs';
import {transfer} from './transfer.mjs';
import {worldRecords,IMAGE_FIELDS} from './world-library.mjs';
import {usesReference} from './attachments.mjs';
export function copyWorldAsset(source,destination,id,projectId,destinationId,mapping=new Map()){
 if(mapping.has(id))return mapping.get(id);
 const record=Object.values(source.world_library||{}).flatMap(Object.values).find(r=>r.id===id);if(!record)throw Error('Native asset unavailable');
 const copy=structuredClone(record),refs=new Map();
 for(const ref of record.reference_ids||[]){if(!source.references?.[ref]?.key)throw Error('Required source image missing');const key='ref:'+ref;if(!mapping.has(key))mapping.set(key,transfer(source,destination,{entity:'reference',id:ref,project_id:projectId,destination_project_id:destinationId,operation:'duplicate'}).id);refs.set(ref,mapping.get(key));}
 for(const key of ['parent_character_id','parent_location_id'])if(copy.metadata?.[key]){const parent=worldRecords(source).find(r=>r.id===copy.metadata[key]);if(!parent)throw Error('Required parent anchor missing');if(!mapping.has(parent.id)){if(parent.legacy){const entity=parent.asset_type||({characters:'character',locations:'location'})[parent.type];mapping.set(parent.id,transfer(source,destination,{entity,id:parent.id,project_id:projectId,destination_project_id:destinationId,operation:'duplicate'}).id)}else copyWorldAsset(source,destination,parent.id,projectId,destinationId,mapping)}copy.metadata[key]=mapping.get(parent.id);}
 const type=({characters:'character',props:'prop',vehicles:'vehicle',locations:'location'})[record.type]||'prop',next=allocate(destination,type,record.name);copy.id=next;copy.reference_ids=record.reference_ids.map(r=>refs.get(r));copy.thumbnail_reference_id=copy.reference_ids[0]||'';for(const key of IMAGE_FIELDS)if(refs.has(copy.metadata?.[key]))copy.metadata[key]=refs.get(copy.metadata[key]);delete copy.asset_code;delete copy.asset_code_record_id;destination.world_library||={};destination.world_library[copy.type]||={};destination.world_library[copy.type][next]=copy;mapping.set(id,next);
 if(source.character_cast_groups?.[id]){destination.character_cast_groups||={};destination.character_cast_groups[next]=source.character_cast_groups[id]}
 return next;
}
export function removeWorldAssets(m,items){const ids=new Set(items.map(x=>x.id));for(const r of [...worldRecords(m),...Object.values(m.scenes||{})]){const rid=r.id||r.asset_id||r.scene_id;if(!ids.has(rid)&&[...ids].some(id=>usesReference(r,id)||Object.values(r.metadata||{}).includes(id)))throw Error('Selected asset is used by '+(r.name||rid));}for(const {id} of items){const r=Object.values(m.world_library||{}).flatMap(Object.values).find(a=>a.id===id);if(!r)throw Error('Selected native asset unavailable');m.trash||={};m.trash['world:'+id]={entity:'world',id,record:structuredClone(r),deleted_at:new Date().toISOString()};delete m.world_library[r.type][id];}}
