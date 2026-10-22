import {worldRecords} from './world-library.mjs';
import {triageKey} from './asset-triage.mjs';
import {assetPreviewReference} from './asset-preview.mjs';
import {characterLinks} from './character-network.mjs';

export const assetId=a=>a.asset_id||a.scene_id||a.id;
export function viewerRecord(a){return {...a,category:a.sourceReference?'references':a.asset_type==='scene'?'scenes':a.type==='scenes_and_shots'?'shots':a.category||a.type};}

/** Resolve selection keys against saved records; a stale selection must not show a lookalike. */
export function selectedViewerRecords(manifest,keys){
 const records=[...worldRecords(manifest),...Object.values(manifest.scenes||{}).map(a=>({...a,id:a.scene_id,asset_type:'scene',category:'scenes'})),...Object.values(manifest.references||{}).map(a=>({...a,category:'references'}))];
 const byKey=new Map();
 for(const a of records){if(a.deleted_at)continue;byKey.set(triageKey(a),viewerRecord(a));}
 return keys.flatMap(key=>byKey.has(key)?[byKey.get(key)]:[]);
}

// Hide empty serialized placeholders and internal material specifications in previews.
export function previewAttributes(value){
 if(typeof value==='string'){try{const parsed=JSON.parse(value);if(parsed&&typeof parsed==='object')return previewAttributes(parsed)}catch{}return value;}
 if(Array.isArray(value))return value.map(previewAttributes).filter(v=>v!==''&&v!==null&&v!==undefined&&(typeof v!=='object'||Object.keys(v).length));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='material_spec').map(([key,v])=>[key,previewAttributes(v)]).filter(([,v])=>v!==''&&v!==null&&v!==undefined&&(typeof v!=='object'||Object.keys(v).length)));
 return value;
}
/** Data only: never mount editors or create drafts during inspection. */
export function assetViewData(manifest,asset){
 const id=assetId(asset),details=manifest.asset_details?.[id]||{},profile=details.metadata_profile||{};
 const current=worldRecords(manifest).find(a=>a.id===id)||manifest.scenes?.[id]||manifest.references?.[id]||asset;
 const record={...asset,...current},references=manifest.references||{},primary=assetPreviewReference(record,references);
 const imageIds=[...new Set([primary,...(record.reference_ids||[]),...Object.values(record.metadata||{}).filter(value=>typeof value==='string'&&Object.hasOwn(references,value))].filter(ref=>ref&&references[ref]&&!references[ref].deleted_at&&references[ref].role!=='DIAGNOSTIC'))];
 const fields=previewAttributes({...profile,...record.immutable_traits,...record.metadata,...manifest.character_network?.details?.[id],...(Object.hasOwn(profile,'silhouette')?{silhouette:profile.silhouette}:{})});
 for(const key of ['text','source','updated_at'])delete fields[key];
 for(const key of ['provenance','analysis_status'])delete fields[key];
 const records=worldRecords(manifest),name=target=>records.find(a=>a.id===target)?.name||target;
 const relationships=characterLinks(manifest,id).map(link=>({...link,target_name:name(link.target_id)}));
 const equipment=(details.equipment_ids||[]).map(target=>({id:target,name:name(target)}));
 const clauses=[...(details.clauses||[]).map(c=>({...c,asset_name:name(c.character_id)})),...Object.entries(manifest.asset_details||{}).flatMap(([propId,d])=>(d.clauses||[]).filter(c=>c.character_id===id).map(c=>({...c,asset_name:name(propId)})))];
 const assignedTo=Object.entries(manifest.asset_details||{}).filter(([,d])=>(d.equipment_ids||[]).includes(id)).map(([target])=>({id:target,name:name(target)}));
 return {record,id,imageIds,relationships,equipment,assignedTo,clauses,description:details.description||profile.description||'',biography:manifest.character_stories?.[id]?.text||profile.biography||'',quickDetails:manifest.character_network?.details?.[id]?.text||'',classification:details.secondary_classification||details.classification||'',tags:record.tags||details.tags||[],fields,prompt:details.reusable_prompt?.text||record.generation_prompt||'',variations:[...(record.alternate_costumes||[]),...Object.values(manifest.state_variants?.[id]||{})]};
}
