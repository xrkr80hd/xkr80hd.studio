import {sheetContract} from './sheet-contract.mjs';
import {parseAssetCommand as parseContinuityCommand} from './asset-command.mjs';
import {assertIdentity,identityTokens,vehicleFormatTokens,generationReferenceIds} from './visual-identity.mjs';
import {assetContext,assetContextPrompt} from './asset-details.mjs';
import {compileWorld,worldContextHeader} from './world-builder.mjs';
import {effectiveGrade,gradePrompt,GLOBAL_NEGATIVE} from './color-grades.mjs';
import {shotId} from './namespace.mjs';
import {checkWardrobe,wardrobeTokens} from './wardrobe.mjs';
export const categories={character:'characters',creature:'creatures',prop:'props',location:'locations',vehicle:'vehicles',keyframe:'shots'};
export const fresh=()=>({system:'xstudio_cinematic_engine',version:'2.1.0',campaign_name:null,active_scene:null,mode:'PRODUCTION',pending_action:null,references:{},scenes:{},permits:{},manifest_store:{characters:{},creatures:{},props:{},locations:{},vehicles:{},shots:{}},history:[]});
export function need(ok,msg){if(!ok)throw Error(msg)}
export function findAsset(m,id){for(const c of Object.values(categories)){if(m.manifest_store[c]?.[id])return m.manifest_store[c]?.[id]}return null}
export function traitTokens(t={}){return [t.silhouette,t.face_features,...(t.costume_layers||[]),t.material_spec,...(t.color_palette_hex||[]),...(t.other_locked_tokens||[])].filter(Boolean)}
export function formatTokens(a){
 const contract=sheetContract(a);
 if(a.asset_type==='vehicle'||a.target_deliverable==='vehicle_turnaround')return vehicleFormatTokens(a);
 if(a.target_deliverable==='character_turnaround')return [contract.instruction,a.mode==='simple'?'Text-free six equal full-height columns in one horizontal artwork strip, approximately 1920:940. In order: front full body; exact 90-degree side full body; three-quarter full body; rear full body; front face portrait; exact 90-degree profile face portrait. Last two columns show complete heads, hair, chin, neck and shoulders, never chest-only. Neutral gray studio in all columns, four bodies share scale and baseline with all extremities visible and safe margins. Exactly six panels total. Source images supply appearance only; ignore their panel arrangement. No second row, stacked portraits, blueprint, inset, equipment panel, detail callout or annotation. No text/name/footer inside source artwork. Footer is typeset afterward.':'16:9 complex six-view sheet: four full-body columns (front, exact 90-degree side, three-quarter, rear) plus front face and exact 90-degree profile face portraits stacked at right. Complete heads and all body extremities. Neutral gray studio. Only explicitly evidenced equipment callouts: '+JSON.stringify(a.equipment_callouts||[]),a.medium==='RL'?'Full-scale photographic live-action materials and natural anatomy. No game-render or miniature look.':'Detailed mature comic-book rendering; preserve exact source design.'];
 if(a.target_deliverable==='creature_sheet')return [a.mode==='complex'?'16:9 complex creature/beast reference sheet: full-body front, exact side, three-quarter and rear views plus source-evidenced head, anatomy and surface-detail insets.':'16:9 simple creature/beast reference sheet: four complete full-body views, front, exact side, three-quarter and rear; no callouts or detail insets.','Preserve species-specific anatomy, limb count, proportions, wings, tails, horns, fur/scales and source markings. Show all extremities with generous margins. Never impose human posture or invent anatomy hidden by the source.',a.medium==='CB'?'Mature comic-book creature rendering.':'Photographic realistic creature materials.'];
 if(a.target_deliverable==='prop_sheet')return [a.mode==='simple'?'Simple sheet: hero, front, side and rear views; no callouts or detail panels.':'Complex sheet: hero and orthographic views with visually evidenced material/detail insets only.',a.asset_type==='vehicle'?'Vehicle reference: preserve body geometry, wheels and visible equipment.':'Prop reference: preserve source design.',a.medium==='CB'?'Mature comic-book rendering.':'Photographic realistic materials.','16:9 non-functional film prop reference sheet: complete hero view and orthographic views appropriate to the selected layout. Preserve exact silhouette and safe material appearance. No functional construction instructions.'];
 if(a.target_deliverable==='location_map')return [a.mode==='complex'?'Complex location sheet: boundary views plus overhead map and visually evidenced landmark details.':'Simple location sheet: key boundary views and overhead map; no detail insets.',a.medium==='CB'?'Mature comic-book environment rendering.':'Photographic realistic environment materials.','16:9 spatial location anchor with assigned wall/boundary views and true overhead map. Preserve fixed geometry, world orientation, doors, footprints and landmarks. Unknown surfaces remain proposed; no invented measurements.'];
 return [];
}
export function canonical(a,m){return [(a.aspect_ratio||'16:9')+' / '+a.target_deliverable,'Asset: '+a.name,...(m.asset_details?.[a.asset_id||a.id]?.description?['USER-SAVED ASSET DESCRIPTION '+JSON.stringify(m.asset_details[a.asset_id||a.id])]:[]),...(a.reference_preservation?['Use the assigned source images as the visual authority. Preserve visible identity, silhouette, clothing, materials and colors; do not invent hidden details.']:[]),...formatTokens(a),...wardrobeTokens(a),...traitTokens(a.immutable_traits),...identityTokens(a),a.lighting_palette,a.action].filter(Boolean)}
export function active(m){need(m.mode==='PRODUCTION','Production is paused or in BRNSTRM. Explicit execution is required.');}
export function refCheck(m,ids){need(ids.length>0,'At least one accessible image reference is required');for(const id of ids){need(m.references[id],`Missing reference ${id}`);need(m.references[id].role!=='DIAGNOSTIC',`Diagnostic image cannot be a generation input: ${id}`)}}
export function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
export function compileShot(m,p){
 const scene=m.scenes[p.scene_id];need(scene,'Unknown scene');const blueprint=m.references[scene.blueprint_id];need(blueprint?.role==='BLUEPRINT','Scene needs a BLUEPRINT reference');
 need(new Set(p.assigned_character_ids).size===p.assigned_character_ids.length,'Duplicate characters');need(p.assigned_character_ids.reduce((n,id)=>n+(scene.character_counts?.[id]||1),0)===scene.subject_count,'Subject count differs from scene blueprint');
 need(same([...p.assigned_character_ids].sort(),[...scene.character_ids].sort()),'Shot characters differ from saved blueprint assignment');
 const ids=[...p.assigned_character_ids,...scene.prop_ids,...scene.location_ids];need(new Set(ids).size===ids.length,'Duplicate anchor assignment');
 const anchors=ids.map(id=>{const a=findAsset(m,id);need(a?.status==='LOCKED',`Anchor ${id} must be LOCKED`);assertIdentity(a,{production:true});return a});
 for(const id of p.assigned_character_ids)need(['character','creature'].includes(findAsset(m,id)?.asset_type),'Subject must be a character or creature');
 for(const id of scene.prop_ids)need(['prop','vehicle'].includes(findAsset(m,id)?.asset_type),'Prop assignment is not a prop');
 for(const id of scene.location_ids)need(findAsset(m,id)?.asset_type==='location','Location assignment is not a location');
 const previous=scene.shots[String(p.shot_number-1)];if(p.shot_number>1){need(previous,'Prepare previous shot first');need(previous.action_continuity.end_state===p.action_continuity.start_state,'Continuity start does not match previous ending');}
 const refs=[scene.blueprint_id,...new Set(anchors.flatMap(a=>[a.source_image_id,...(a.visual_identity?generationReferenceIds(a):[])]))];refCheck(m,refs);
 const effective_grade=Object.hasOwn(p,'effective_grade')?p.effective_grade:effectiveGrade(m,{sequence_id:scene.sequence_id,scene_id:p.scene_id,shot_id:p.asset_id});
 const tokens=effective_grade? [...anchors.flatMap(a=>traitTokens(a.immutable_traits)),'Visible subjects: '+scene.subject_count,'Blueprint blocking: '+scene.blocking,'Start: '+p.action_continuity.start_state,'End: '+p.action_continuity.end_state,...Object.entries(p.camera_spec).map(([k,v])=>k+': '+v),scene.lighting_palette,gradePrompt(effective_grade,p.medium),'Grade guardrails: '+GLOBAL_NEGATIVE+' '+effective_grade.definition.negativePrompt,'Full-bleed standalone landscape 16:9; no bars, grids, text or borders --ar 16:9']:['16:9 / storyboard_frame',...anchors.flatMap(a=>traitTokens(a.immutable_traits)),scene.lighting_palette,'Visible subjects: '+scene.subject_count,'Blueprint blocking: '+scene.blocking,...Object.entries(p.camera_spec).map(([k,v])=>k+': '+v),'Start: '+p.action_continuity.start_state,'End: '+p.action_continuity.end_state];
 tokens.push('Cast quantities: '+p.assigned_character_ids.map(id=>(findAsset(m,id)?.name||id)+' × '+(scene.character_counts?.[id]||1)).join(', '));
 return {...p,character_counts:{...(scene.character_counts||{})},...(effective_grade?{effective_grade}:{}),asset_id:p.asset_id||shotId(m,scene,p.shot_number),target_deliverable:'storyboard_frame',anchor_ids:ids,assigned_reference_ids:refs,compiled_prompt_tokens:[worldContextHeader(compileWorld(m,m.project_id||m.active_project_code||''),p.assigned_character_ids),...tokens,assetContextPrompt(assetContext(m,ids))].filter(Boolean),prompt_header:m.campaign_name||'',negative_constraints:['No unassigned subjects or props','No identity, costume, material or geometry drift','No labels, numbers, borders, reference text or plugin metadata inside the frame'],status:'DRAFT'};
}
export function preflight(m,p){
 active(m);need(m.campaign_name,'Set CMPN campaign title before production');
 let tokens,refs,anchor_ids=[];const a=findAsset(m,p.asset_id);
 if(p.target_deliverable==='storyboard_frame'){
  const shots=Object.values(m.scenes).flatMap(s=>Object.values(s.shots));const shot=shots.find(s=>s.asset_id===p.asset_id);need(shot,'Prepare the shot first');
  const refreshed=compileShot(m,shot);tokens=refreshed.compiled_prompt_tokens;refs=refreshed.assigned_reference_ids;anchor_ids=refreshed.anchor_ids;
 }else{need(a,'Unknown draft asset');need(!a.discarded_for_production,'This version was discarded for production; use its selected locked anchor');need(!a.analysis_pending,'Inspect the assigned source images and complete_asset_analysis before generation');need(a.status==='DRAFT','Locked assets require a new draft version for generation');need(a.target_deliverable===p.target_deliverable,'Wrong deliverable for asset');checkWardrobe(a);assertIdentity(a,{production:true});tokens=canonical(a,m);refs=generationReferenceIds(a);anchor_ids=[a.asset_id];}
 refCheck(m,refs);need(same(p.compiled_prompt_tokens,tokens),'Token drift detected: submit exact compiler tokens, without additions, omissions, reordering or paraphrases');need(same(p.assigned_reference_ids,refs),'Reference drift: use exact assigned IDs in returned order');
 return {passed:true,validation_scope:'Exact stored token, reference, state and continuity checks; pixel inspection still required.',prompt_header:m.campaign_name,compiled_prompt_tokens:[worldContextHeader(compileWorld(m,m.project_id||m.active_project_code||''),p.assigned_character_ids),...tokens],image_generation_prompt:tokens.join('\n'),assigned_reference_ids:refs,anchor_ids};
}

export const parseAssetCommand=parseContinuityCommand;
export function storePrompts(m){
 m.manifest_store.creatures ||= {};
 for(const bucket of Object.values(m.manifest_store))for(const a of Object.values(bucket)){
  const tokens=a.asset_type==='keyframe'?a.compiled_prompt_tokens:canonical(a,m);
  if(tokens){a.generation_prompt=tokens.join('\n');a.prompt_reference_ids=[...(a.assigned_reference_ids||a.reference_ids||[])];}
 }
 for(const s of Object.values(m.scenes))for(const shot of Object.values(s.shots||{}))if(shot.compiled_prompt_tokens){shot.generation_prompt=shot.compiled_prompt_tokens.join('\n');shot.prompt_reference_ids=[...shot.assigned_reference_ids];}
 return m;
}
