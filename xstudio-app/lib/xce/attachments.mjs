const assetRecords=m=>[...Object.values(m.manifest_store||{}).flatMap(Object.values),...Object.values(m.world_library||{}).flatMap(Object.values),...Object.values(m.scenes||{}),...stateRecords(m)];
const stateRecords=m=>Object.entries(m.state_variants||{}).flatMap(([character,states])=>Object.values(states).map(s=>({...s,name:s.name+' alternate form',character_id:character})));
export const usesReference=(r,id)=>['reference_ids','assigned_reference_ids','character_ids','prop_ids','location_ids','assigned_character_ids','anchor_ids'].some(k=>r[k]?.includes(id))||['base_asset_id','supersedes','selected_anchor_id','image_reference_id','source_reference_id','source_image_id','output_reference_id','preview_reference_id','blueprint_id','scene_id'].some(k=>r[k]===id)||(r.equipment_callouts||[]).some(c=>c.source_reference_id===id)||(r.wardrobe_edit?.reference_ids||[]).includes(id)||Object.values(r.shots||{}).some(s=>usesReference(s,id));
export function attachmentInfo(m,r){
 if(r.category==='references'||r.id&&!r.asset_id){const id=r.id||r.asset_id;const linked=assetRecords(m).filter(a=>usesReference(a,id));const names=[...new Set(linked.map(a=>a.name||a.asset_type||'scene'))];return {attached:names.length>0,label:names.length?'Attached to '+names[0]+(names.length>1?' + '+(names.length-1)+' more':''):'Not attached',names};}
 const ids=[...(r.reference_ids||[]),r.source_image_id,r.preview_reference_id,r.output_reference_id].filter(Boolean);const attached=ids.some(id=>m.references?.[id]);return {attached,label:attached?'Image attached':'No image attached',names:[]};
}

export const isReferenceAttached=(m,id)=>assetRecords(m).some(record=>usesReference(record,id));
export const unassignedReferences=m=>Object.values(m.references||{}).filter(r=>!isReferenceAttached(m,r.id));
