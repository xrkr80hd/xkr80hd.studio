import {assetCategory} from './equipment.mjs';
import {CAST_GROUPS,characterGroup} from './cast-groups.mjs';
import {worldRecords} from './world-library.mjs';
export function sceneCastIds(m,ids){
 if(!Array.isArray(ids)||ids.length>50||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)throw Error('Choose up to 50 distinct project characters');
 const characters=worldRecords(m).filter(a=>a.type==='characters'&&!a.deleted_at);
 for(const id of ids)if(!characters.some(a=>a.id===id))throw Error('Character is not in this project: '+id);
 return [...ids];
}
export function saveSceneCast(m,sceneId,ids){
 if(!m.scenes?.[sceneId]||m.scenes[sceneId].deleted_at)throw Error('Choose a scene reference in this project');
 const cast=sceneCastIds(m,ids),next=structuredClone(m);
 next.scenes[sceneId].character_ids=cast;next.scenes[sceneId].subject_count=cast.length;
 return next;
}
export function sceneReferences(m){const records=worldRecords(m);return Object.entries(m.scenes||{}).filter(([,s])=>!s.deleted_at).map(([id,s])=>({id,name:s.name||id,asset_code:s.asset_code||id,kind:'Scene / Storyboard Reference',source_kind:s.source_kind||'scene_blueprint',reference_ids:[...new Set([s.blueprint_id,...(s.reference_ids||[])].filter(Boolean))],character_ids:s.character_ids||[],characters:(s.character_ids||[]).map(id=>{const a=records.find(a=>a.id===id);return {id,name:a?.name||id,status:a?.status||'MISSING',reference_ids:a?.reference_ids||[]}}),identity_authority:'COMPOSITION_REFERENCE_ONLY',analysis_pending:!!s.analysis_pending}));}

export function sceneCastGroups(m){
 const records=worldRecords(m).filter(a=>a.type==='characters'&&!a.deleted_at),beast=a=>!!m.manifest_store?.creatures?.[a.id];
 const sort=rows=>rows.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
 return [...Object.entries(CAST_GROUPS).map(([id,label])=>({id,label:id==='main'?'Main Characters':id==='supporting'?'Supporting Characters':label,records:sort(records.filter(a=>!beast(a)&&characterGroup(m,a.id)===id))})),...Object.entries({creatures:'Creatures',beasts:'Beasts',magical_beings:'Magical Beings'}).map(([id,label])=>({id,label,records:sort(records.filter(a=>beast(a)&&assetCategory(m,a)===id))}))];
}
