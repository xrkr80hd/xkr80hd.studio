import {validateSceneSequence,sceneSequenceLedger,sceneSequence} from './scene-sequence.mjs';
import {worldRecords} from './world-library.mjs';
import {characterGroup} from './cast-groups.mjs';
import {sceneCastIds} from './scene-cast.mjs';
export function castCounts(m,ids,input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid cast quantities');
 const counts={};for(const id of ids){const count=input[id]??1;if(!Number.isInteger(count)||count<1||count>100)throw Error('Choose a cast quantity from 1 to 100');if(count>1&&!['background','extras','military'].includes(characterGroup(m,id)))throw Error('Multiple instances are available for background cast, extras and units');counts[id]=count;}return counts;
}
export function editSceneRecord(m,{entity,id,data}){
 if(!['scene','keyframe'].includes(entity))throw Error('Choose a scene or keyframe');
 const next=structuredClone(m),sceneShots=Object.values(next.scenes||{}).flatMap(s=>Object.values(s.shots||{})).filter(s=>s.asset_id===id);
 const record=entity==='scene'?next.scenes?.[id]||next.world_library?.scenes_and_shots?.[id]:next.manifest_store?.shots?.[id]||sceneShots[0];if(!record)throw Error('Scene or keyframe no longer exists');
 if(typeof data.name!=='string'||!data.name.trim()||data.name.length>200)throw Error('Name required (max 200 characters)');
 const cast=sceneCastIds(next,data.character_ids),counts=castCounts(next,cast,data.character_counts),assets=worldRecords(next);
 const assigned=(ids,types)=>{if(!Array.isArray(ids)||ids.length>100||ids.some(id=>typeof id!=='string'||!assets.some(a=>a.id===id&&!a.deleted_at&&types.includes(a.type))))throw Error('Choose existing project assets');return [...new Set(ids)];};
 const props=assigned(data.prop_ids,['props','vehicles']),locations=assigned(data.location_ids,['locations','rooms']);
 const patch={name:data.name.trim(),character_ids:cast,character_counts:counts,subject_count:Object.values(counts).reduce((a,b)=>a+b,0),prop_ids:props,location_ids:locations};
 for(const field of ['blocking','lighting_palette']){if(typeof data[field]!=='string'||data[field].length>10000)throw Error('Invalid '+field);patch[field]=data[field];}
 if(entity==='keyframe'){
  for(const [field,keys] of [['camera_spec',['framing','angle','lens_feel','screen_direction']],['action_continuity',['start_state','end_state']]]){const values={};for(const key of keys){const value=data[field]?.[key]??'';if(typeof value!=='string'||value.length>4000)throw Error('Invalid '+field);values[key]=value;}patch[field]=values;}
  patch.assigned_character_ids=cast;patch.anchor_ids=[...new Set([...cast,...props,...locations])];
  patch.assigned_reference_ids=[...new Set(patch.anchor_ids.flatMap(id=>{const a=assets.find(a=>a.id===id);return a?.reference_ids||[];}))];
 }
 if(entity==='scene'&&data.reference_sequence!==undefined){patch.reference_sequence=validateSceneSequence(data.reference_sequence,next);const oldSequenceIds=new Set(sceneSequence(record,next).map(b=>b.reference_id));if(record.type!=='scenes_and_shots')patch.reference_ids=[...new Set([...(record.reference_ids||[]).filter(ref=>!oldSequenceIds.has(ref)),...patch.reference_sequence.map(b=>b.reference_id)])];}
 const targets=entity==='keyframe'?[record,...sceneShots]:[record];for(const target of targets){Object.assign(target,patch);if(entity==='keyframe'){delete target.compiled_prompt_tokens;delete target.generation_prompt;delete target.prompt_reference_ids;target.composition_needs_recompile=true;}}
 next.permits={};return {manifest:next,record,...(entity==='scene'?{scene_ledger:sceneSequenceLedger({...record,scene_id:record.scene_id||record.id},next)}:{})};
}
