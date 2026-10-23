import {allocate,annotate,resolve} from './namespace.mjs';
import {categories,need,storePrompts} from './core.mjs';
import {manage} from './manage.mjs';
const assetTypes=['character','creature','prop','location','vehicle'];
const roleFor=t=>['character','creature'].includes(t)?'IDENTITY':t==='location'?'LOCATION':'PROP';
export function reclassify(m,args){
 const {entity}=args,requested=args.target_category,target_category=({beast:'creature',magical_being:'creature',weapon:'prop'})[requested]||requested,display=({beast:'beasts',magical_being:'magical_beings',weapon:'weapons'})[requested];
 need([...assetTypes,'reference'].includes(entity),'Only assets and source images can change category');
 need(assetTypes.includes(target_category),'Choose Character, Creature / Beast, Prop, Location, or Vehicle');
 const original=resolve(m,entity,args.id||args.target_name,{locked:false});
 if(entity!=='reference')need(original.asset_type===entity,'Source category does not match this asset');
 const oldId=entity==='reference'?original.id:original.asset_id;
 const sourceType=original.asset_type||({IDENTITY:'character',COSTUME:'character',PROP:'prop',LOCATION:'location'})[original.role];
 const name=(args.name||original.name||original.asset_name||oldId).trim();need(name&&name.length<=200,'Name required (max 200 characters)');
 if(entity!=='reference'&&sourceType===target_category){m.asset_details||={};m.asset_details[oldId]={...(m.asset_details[oldId]||{}),library_category:display||categories[target_category]};original.name=name;m.permits={};m.history.push({kind:'reclassify',id:oldId,to:requested,date:new Date().toISOString()});return {saved:true,id:oldId,record:structuredClone(original),old_id:oldId,target_category:requested,preserved_approved_original:false};}
 const preserve=entity!=='reference'&&original.status==='LOCKED';
 // Validate removal on a copy before allocating IDs or touching shared source references.
 if(!preserve)manage(structuredClone(m),{entity,action:'delete',id:oldId,confirm:true});
 const refs=entity==='reference'?[oldId]:[...new Set([...(original.reference_ids||[]),original.source_image_id,original.preview_reference_id].filter(Boolean))];
 need(refs.length,'Upload a source image before changing category');
 for(const id of refs)need(m.references[id]&&m.references[id].role!=='DIAGNOSTIC','Missing or diagnostic source image');
 const mapping=new Map();
 for(const id of refs){const ref=m.references[id];const next=allocate(m,target_category,name);mapping.set(id,next);const role=entity!=='reference'&&['STYLE','BLUEPRINT'].includes(ref.role)?ref.role:roleFor(target_category);m.references[next]=annotate({...structuredClone(ref),id:next,name:entity==='reference'?name:ref.name,asset_name:name,asset_type:target_category,role,reclassified_from:{id,asset_type:sourceType}},m,target_category);}
 if(entity!=='reference'&&![...mapping.values()].some(id=>m.references[id].role===roleFor(target_category)))m.references[mapping.get(refs[0])].role=roleFor(target_category);
 let record,id;
 if(entity==='reference'){id=mapping.get(oldId);record=m.references[id];}
 else{
  id=allocate(m,target_category,name);record=annotate({...structuredClone(original),asset_id:id,asset_type:target_category,name,target_deliverable:target_category==='creature'?'creature_sheet':target_category==='character'?'character_turnaround':target_category==='location'?'location_map':'prop_sheet',mode:original.mode||'simple',medium:original.medium||'RL',status:'DRAFT',generation_review:null,reference_preservation:true,analysis_pending:true,reference_ids:refs.map(ref=>mapping.get(ref)),preview_reference_id:mapping.get(original.source_image_id||original.preview_reference_id||original.reference_ids?.[0]),action:target_category==='character'?'Neutral standing rotations.':'Reference views preserving source design.',reclassified_from:{id:oldId,asset_type:sourceType}},m,target_category);
  // Prior approval and character-specific editing contracts cannot approve a new category.
  for(const k of ['source_image_id','output_reference_id','locked_at','approval_instruction','wardrobe_edit','base_asset_id','equipment_callouts','supersedes','analysis_reference_ids','generation_prompt','prompt_reference_ids','finished_sheet_id'])delete record[k];
  m.manifest_store[categories[target_category]][id]=record;
 }
 if(!preserve)manage(m,{entity,action:'delete',id:oldId,confirm:true});
 if(display){m.asset_details||={};m.asset_details[id]={...(m.asset_details[id]||{}),library_category:display};}
 m.permits={};if(m.pending_action?.asset_id===oldId)m.pending_action=null;
 if(entity==='reference')m.active_reference_id=id;else m.active_asset_id=id;
 m.history.push({kind:'reclassify',from:entity,to:target_category,old_id:oldId,new_id:id,preserved_approved_original:preserve,date:new Date().toISOString()});storePrompts(m);
 const safe=structuredClone(record);delete safe.key;
 return {saved:true,id,record:safe,old_id:oldId,target_category,preserved_approved_original:preserve};
}
