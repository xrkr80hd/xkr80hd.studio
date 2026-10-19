import {isReferenceAttached} from './attachments.mjs';
const types={wardrobe:'wardrobe',character:'characters',creature:'creatures',prop:'props',vehicle:'vehicles',location:'locations',scene:'scenes_and_shots'};
export function presortedLibraryRows(manifest,assets){
 const attached=new Set(assets.flatMap(a=>[...(a.reference_ids||[]),...(a.intake_source_reference_ids||[]),a.source_image_id,a.blueprint_id].filter(Boolean)));
 const attachedKeys=new Set([...attached].map(id=>manifest.references?.[id]?.key).filter(Boolean));
 return Object.values(manifest.references||{}).filter(r=>!r.attached_to_scene&&types[r.presort?.type]&&!attached.has(r.id)&&!attachedKeys.has(r.key)&&!isReferenceAttached(manifest,r.id)&&!manifest.asset_triage?.processed?.['reference:'+r.id]).map(r=>({...r,id:r.id,name:r.presort.display_name||r.asset_name||r.name,type:types[r.presort.type],sourceReference:true,legacy:true,reference_ids:[r.id],status:'DRAFT'}));
}
