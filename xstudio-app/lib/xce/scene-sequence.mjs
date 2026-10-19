const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id);
export const SEQUENCE_CONTINUITY='Preserve the parent scene lighting, environment geometry, wardrobe and locked character models. Do not invent absent characters or change identity between frames.';
export function sceneSequence(scene,m){
 if(Array.isArray(scene.reference_sequence))return structuredClone(scene.reference_sequence);
 return [...new Set([scene.blueprint_id,...(scene.reference_ids||[])].filter(Boolean))].map((id,index)=>({id:'ref_'+String(index+1),reference_id:id,description:m.references?.[id]?.asset_name||m.references?.[id]?.name||'Reference image',camera:'',advance_seconds:index?3:0,continuity:''}));
}
export function validateSceneSequence(input,m){
 if(!Array.isArray(input)||input.length>100)throw Error('Choose up to 100 scene reference beats');
 const ids=new Set(),refs=new Set();return input.map((beat,index)=>{
  if(!beat||typeof beat!=='object'||Object.keys(beat).some(k=>!['id','reference_id','description','camera','advance_seconds','continuity'].includes(k))||!validId(beat.id)||ids.has(beat.id))throw Error('Invalid or duplicate sequence beat ID');
  const ref=m.references?.[beat.reference_id];if(!validId(beat.reference_id)||!ref||ref.deleted_at||ref.role==='DIAGNOSTIC'||refs.has(beat.reference_id))throw Error('Choose distinct saved project images for the sequence');
  ids.add(beat.id);refs.add(beat.reference_id);const result={id:beat.id,reference_id:beat.reference_id};
  for(const key of ['description','camera','continuity']){const text=beat[key]??'';if(typeof text!=='string'||text.length>2000)throw Error('Sequence '+key+' must be up to 2,000 characters');result[key]=text.trim();}
  if(typeof beat.advance_seconds!=='number'||!Number.isFinite(beat.advance_seconds)||beat.advance_seconds<0||beat.advance_seconds>600)throw Error('Choose a time advance from 0 to 600 seconds');
  result.advance_seconds=index?beat.advance_seconds:0;return result;
 });
}
export function sceneSequenceLedger(scene,m){
 const beats=sceneSequence(scene,m),name=scene.name||scene.scene_id||scene.id;
 return {scene_id:scene.scene_id||scene.id,name,kind:'ORDERED_SCENE_REFERENCE_SEQUENCE',identity_authority:'SAVED_PARENT_SCENE_AND_LOCKED_ASSETS',continuity_directive:SEQUENCE_CONTINUITY,generation_authorized:false,anchors:beats.map((beat,index)=>({beat_id:beat.id,shot_number:index+1,reference_id:beat.reference_id,name:name+' - Beat '+String(index+1).padStart(2,'0')+': '+([beat.description,beat.camera].filter(Boolean).join(' / ')||'Reference image'),action:beat.description,camera:beat.camera,advance_seconds:index?beat.advance_seconds:0,previous_beat_id:index?beats[index-1].id:null,continuity_instruction:index?'Frame '+(index+1)+' inherits the camera position and ending pose of Frame '+index+'; advances '+beat.advance_seconds+' seconds. '+(beat.continuity||SEQUENCE_CONTINUITY):'Establish the parent scene spatial and visual anchor. '+(beat.continuity||SEQUENCE_CONTINUITY)}))};
}
// A scene sequence appears in the existing shot-list selector; it is never a second stored scene/list.
export function sceneSequenceLists(m){return [...Object.entries(m.scenes||{}),...Object.entries(m.world_library?.scenes_and_shots||{})].map(([id,s])=>({...s,scene_id:id})).filter(s=>!s.deleted_at&&(s.reference_sequence?.length||s.reference_ids?.length||s.blueprint_id)).map(s=>{const ledger=sceneSequenceLedger(s,m);return {id:s.scene_id,name:s.name||s.scene_id,source_scene_id:s.scene_id,shots:ledger.anchors.map(a=>({id:a.beat_id,title:a.name,image_reference_id:a.reference_id,panel:{action:a.action,cameraMove:a.camera,duration:a.advance_seconds||3,notes:a.continuity_instruction}})),ledger}});}

export const SCENE_SEQUENCE_SCHEMA={type:'array',maxItems:100,items:{type:'object',additionalProperties:false,required:['id','reference_id','description','camera','advance_seconds','continuity'],properties:{id:{type:'string',pattern:'^[a-zA-Z0-9_-]{1,128}$'},reference_id:{type:'string',description:'Existing image ID in this project'},description:{type:'string',maxLength:2000},camera:{type:'string',maxLength:2000},advance_seconds:{type:'number',minimum:0,maximum:600},continuity:{type:'string',maxLength:2000}}}};
