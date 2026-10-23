import {need,findAsset,same,refCheck} from './core.mjs';
const pattern=/^(?:@?xstudio\s+|@?xce\s+)?\/?(mcs(?:rl|cb)?(?:smpl|smple|simple)?|cmplx|complex|cb)\s+(.+?)\s+(?:[-–—]\s*)?edit\s*:?\s+([\s\S]+)$/i;
export function parseWardrobeCommand(command,defaults={}){
 const m=command.trim().match(pattern);need(m,'Expected character-sheet command, name, then edit and wardrobe modifications');
 const token=m[1].toLowerCase(),name=m[2].trim().replace(/\s*[-–—]\s*$/,'').replace(/^\[(.*)\]$/,'$1').trim(),mods=m[3].trim();
 need(name&&mods,'Character name and wardrobe edit are required');
 const layout=/smpl(?:e)?$|simple$/.test(token)?'simple':['cmplx','complex'].includes(token)?'complex':defaults.mode||'simple';
 const medium=token==='cb'||token.startsWith('mcscb')?'CB':token.startsWith('mcsrl')?'RL':defaults.medium||null;
 return {command:'MCS_EDIT',source_command:token,character_name:name,wardrobe_mods:mods,mode:layout,medium,requires_medium_from_reference:medium===null,target_deliverable:'character_turnaround',constraints:{lock_identity:true,lock_anatomy:true,apply_across_all_views:true,disallow_layout_shift:true}};
}
export function prepareWardrobe(m,p){
 const base=findAsset(m,p.base_asset_id);need(base?.asset_type==='character','Base must be a saved character reference draft or locked anchor');need(!findAsset(m,p.asset_id),'Use a new asset ID; do not overwrite the base or an existing version');
 const parsed=parseWardrobeCommand(p.command_text,base);
 const references=[...base.reference_ids];if(base.source_image_id&&!references.includes(base.source_image_id))references.push(base.source_image_id);refCheck(m,references);
 need(references.some(id=>m.references[id].role==='IDENTITY'),'Base IDENTITY reference required');
 const immutable_traits=structuredClone(base.immutable_traits);
 immutable_traits.costume_layers=[...p.resolved_costume_layers];if(p.resolved_wardrobe_material_spec!==undefined)immutable_traits.material_spec=p.resolved_wardrobe_material_spec;
 const identity_snapshot=structuredClone(base.immutable_traits);delete identity_snapshot.costume_layers;delete identity_snapshot.material_spec;
 const a={...structuredClone(base),asset_id:p.asset_id,name:parsed.character_name,status:'DRAFT',target_deliverable:'character_turnaround',mode:parsed.mode,medium:parsed.medium,immutable_traits,reference_ids:references,generation_review:null,wardrobe_edit:{command:parsed,base_asset_id:p.base_asset_id,identity_snapshot,original_material_spec:base.immutable_traits.material_spec,reference_ids:[...references],layout_mode:parsed.mode,medium:parsed.medium},action:'Neutral reference poses only. Apply the requested clothing and styling identically in front, exact profile, three-quarter, rear and both face close-ups. Preserve base facial structure, ethnic features, age, eye color, hairstyle silhouette and natural body proportions. Never infer nudity, lingerie or anatomy reshaping from subjective styling descriptions.'};
 delete a.source_image_id;delete a.locked_at;delete a.approval_instruction;delete a.finished_sheet_id;
 if(parsed.mode==='simple')a.equipment_callouts=[];
 // Old outfit callouts cannot carry into a new outfit. New complex callouts require fresh visual evidence.
 else a.equipment_callouts=[];
 return a;
}
export function checkWardrobe(a){if(!a.wardrobe_edit)return;const e=a.wardrobe_edit,t=structuredClone(a.immutable_traits);delete t.costume_layers;delete t.material_spec;need(same(t,e.identity_snapshot),'Wardrobe edit changed locked identity/anatomy tokens');need(a.mode===e.layout_mode&&a.medium===e.medium,'Wardrobe modifier cannot shift layout or rendering medium');need(same(a.reference_ids,e.reference_ids),'Wardrobe edit changed assigned base references');need(a.target_deliverable==='character_turnaround','Wardrobe edit must remain a turnaround sheet');}
export function wardrobeTokens(a){if(!a.wardrobe_edit)return [];return ['WARDROBE MODIFIER ONLY: '+a.wardrobe_edit.command.wardrobe_mods,'The following costume layers are the resolved wardrobe edit; clothing changes only. Preserve all non-wardrobe material features from the base image. Facial structure, ethnic features, age, eye color, hairstyle silhouette and natural body proportions are frozen. Apply this exact outfit consistently across all six views. No subjective descriptor authorizes anatomy changes, nudity, lingerie, a portrait-only result or any layout change.'];}
