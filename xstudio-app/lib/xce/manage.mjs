import {editProjectDetails} from './project-summary.mjs';
import {intakeReferences} from './intake-references.mjs';
import {annotate} from './namespace.mjs';
import {need,categories,findAsset} from './core.mjs';
import {tools,validate} from './tools.mjs';
const uses=(r,id)=>['reference_ids','assigned_reference_ids','character_ids','prop_ids','location_ids','assigned_character_ids','anchor_ids'].some(k=>r[k]?.includes(id))||['source_image_id','output_reference_id','preview_reference_id','blueprint_id'].some(k=>r[k]===id)||(r.equipment_callouts||[]).some(c=>c.source_reference_id===id)||Object.values(r.shots||{}).some(s=>uses(s,id));
const clean=r=>{const v=structuredClone(r);const walk=o=>{if(!o||typeof o!=='object')return;delete o.key;for(const x of Object.values(o))walk(x)};walk(v);return v};
export function manage(m,a){
 const {entity,action,id,data={}}=a;
 m.trash||={};
 const collection=entity==='reference'?m.references:entity==='scene'?m.scenes:m.manifest_store[categories[entity]];
 if(entity==='project'){
  if(action==='read')return {record:clean(m)};
  if(action==='update'){if(data.world_builder?.firestarter_state&&data.world_builder.firestarter_state.project_id!==a.project_id)throw Error('Narrative state belongs to a different project');editProjectDetails(m,data)}
  else if(action==='delete'){need(a.confirm===true,'Delete confirmation required');m.deleted_at=new Date().toISOString()}
  else if(action==='restore')delete m.deleted_at;
  else throw Error('Use create_project or list_projects');
 }else{
  need(collection,'Unknown entity');
  if(action==='list')return {records:Object.values(collection).map(clean)};
  need(id,'Record ID required');
  if(action==='restore'){
   const t=m.trash[entity+':'+id];need(t,'Deleted record not found');need(!collection[id],'ID already exists');for(const ref of [...(t.record.reference_ids||[]),...(t.record.source_image_id?[t.record.source_image_id]:[]),...(entity==='scene'?[t.record.blueprint_id]:[])])need(m.references[ref],'Restore reference first: '+ref);if(entity==='scene')for(const anchor of [...t.record.character_ids,...t.record.prop_ids,...t.record.location_ids])need(findAsset(m,anchor),'Restore anchor first: '+anchor);if(entity==='keyframe')need(m.scenes[t.record.scene_id],'Restore this shot’s scene first');collection[id]=t.record;if(entity==='keyframe')m.scenes[t.record.scene_id].shots[String(t.record.shot_number)]=t.record;delete m.trash[entity+':'+id];if(entity==='scene')for(const shot of Object.values(t.record.shots||{})){const saved=m.trash['keyframe:'+shot.asset_id];if(saved){need(!m.manifest_store.shots[shot.asset_id],'Shot ID already exists');m.manifest_store.shots[shot.asset_id]=saved.record;delete m.trash['keyframe:'+shot.asset_id]}}
  }else if(action==='create'){
   need(!collection[id]&&!findAsset(m,id),'ID already exists');
   if(entity==='reference')throw Error('Upload image bytes using register_reference or Add reference');
   if(entity==='scene'){
    const spec=tools.find(t=>t.name==='save_scene_blueprint');validate(spec.inputSchema,{...data,scene_id:id});
    need(m.references[data.blueprint_id]?.role==='BLUEPRINT','Select a BLUEPRINT reference');need(data.subject_count===data.character_ids.length,'Subject count mismatch');
    for(const [field,type] of [['character_ids','character'],['prop_ids','prop'],['location_ids','location']])for(const x of data[field])need((type==='prop'?['prop','vehicle'].includes(findAsset(m,x)?.asset_type):type==='character'?['character','creature'].includes(findAsset(m,x)?.asset_type):findAsset(m,x)?.asset_type===type),'Invalid '+field+' assignment: '+x);
    collection[id]=annotate({...data,scene_id:id,name:data.name||id,shots:{}},m,entity);
   }else{
    const spec=tools.find(t=>t.name==='save_draft_asset');validate(spec.inputSchema,{...data,asset_id:id,asset_type:entity});
    need(data.target_deliverable===({character:'character_turnaround',creature:'creature_sheet',prop:'prop_sheet',location:'location_map',vehicle:'prop_sheet'})[entity],'Asset type and deliverable mismatch');need(entity!=='keyframe','Prepare shots through prepare_storyboard_shot');
    for(const x of data.reference_ids)need(m.references[x]&&m.references[x].role!=='DIAGNOSTIC','Invalid reference: '+x);
    need(!['character','creature'].includes(entity)||(data.mode&&data.medium),'Character mode and medium required');need(!['character','creature'].includes(entity)||data.mode!=='simple'||!data.equipment_callouts?.length,'Simple sheets have no equipment panels');need(!['character','creature'].includes(entity)||data.reference_ids.some(x=>m.references[x].role==='IDENTITY'),'Character needs an IDENTITY reference');
    collection[id]=annotate({...data,asset_id:id,asset_type:entity,status:'DRAFT',generation_review:null},m,entity);
   }
  }else{
   const sceneShots=entity==='keyframe'?Object.values(m.scenes).flatMap(s=>Object.values(s.shots||{})).filter(s=>s.asset_id===id):[];
   const record=collection[id]||sceneShots[0];need(record,'Record not found');
   if(action==='read')return {record:clean(record)};
   if(action==='delete'){
    need(a.confirm===true,'Delete confirmation required');
    const dependencies=[];
    if(entity==='reference')for(const [character,states] of Object.entries(m.state_variants||{}))for(const state of Object.values(states))if(state.reference_ids.includes(id))dependencies.push('alternate-form:'+character+'/'+state.name);
    for(const [listId,list] of Object.entries(m.shot_lists||{}))if(list.shots.some(s=>s.character_ids.includes(id)||s.reference_ids.includes(id)||s.image_reference_id===id))dependencies.push('shot-list:'+listId);
    for(const [sid,s] of Object.entries(m.scenes))if(sid!==id&&uses(s,id))dependencies.push('scene:'+sid);
    for(const [category,records] of Object.entries(m.manifest_store))for(const [aid,r] of Object.entries(records))if(aid!==id&&!(entity==='scene'&&r.scene_id===id)&&uses(r,id))dependencies.push(category+':'+aid);
    for(const rows of Object.values(m.world_library||{}))for(const r of Object.values(rows))if(r.id!==id&&(uses(r,id)||Object.values(r.metadata||{}).includes(id)))dependencies.push('library:'+r.name);
    need(!dependencies.length,'Used by '+dependencies.join(', ')+'. Edit or delete those assignments first.');
    m.trash[entity+':'+id]={entity,id,record:structuredClone(record),deleted_at:new Date().toISOString()};delete collection[id];
    if(entity==='scene'){for(const shot of Object.values(record.shots||{})){if(m.manifest_store.shots[shot.asset_id]){m.trash['keyframe:'+shot.asset_id]={record:m.manifest_store.shots[shot.asset_id]};delete m.manifest_store.shots[shot.asset_id]}}if(m.active_scene===id)m.active_scene=null}
    if(entity==='keyframe')for(const s of Object.values(m.scenes))for(const [number,shot] of Object.entries(s.shots||{}))if(shot.asset_id===id)delete s.shots[number];
    if(m.pending_action?.asset_id===id)m.pending_action=null;
   }else if(action==='update'){
    const keys=Object.keys(data);need(keys.length,'No changes supplied');
    need(!keys.some(k=>['asset_id','asset_type','id','scene_id','status','key','generation_review','approval_instruction','locked_at','shots'].includes(k)),'IDs and approval fields cannot be edited');
    if(keys.length===1&&keys[0]==='name'){need(typeof data.name==='string'&&data.name.trim()&&data.name.length<=200,'Name required (max 200 characters)');record.name=data.name.trim();for(const shot of sceneShots)shot.name=record.name;if(entity==='reference'){if(record.asset_name)record.asset_name=record.name;if(record.presort)record.presort={...record.presort,display_name:record.name};}}
    else{
     need(entity!=='reference','Reference image and role are immutable; upload a replacement reference');
     const allowed=entity==='scene'?['name','blueprint_id','subject_count','character_ids','prop_ids','location_ids','blocking','lighting_palette']:['name','immutable_traits','reference_ids','lighting_palette','action','mode','medium','equipment_callouts'];
     need(keys.every(k=>allowed.includes(k)),'Unsupported record fields');
     const next={...record,...data};if(data.reference_ids&&entity!=='scene')next.reference_ids=intakeReferences(m,data.reference_ids,entity,next.name);
     if(entity==='scene'){
      const spec=tools.find(t=>t.name==='save_scene_blueprint');const input=Object.fromEntries(Object.keys(spec.inputSchema.properties).filter(k=>k in next).map(k=>[k,next[k]]));validate(spec.inputSchema,input);
      need(m.references[next.blueprint_id]?.role==='BLUEPRINT','Blueprint required');need(next.subject_count===next.character_ids.length,'Subject count mismatch');
      for(const [field,type] of [['character_ids','character'],['prop_ids','prop'],['location_ids','location']])for(const x of next[field])need((type==='prop'?['prop','vehicle'].includes(findAsset(m,x)?.asset_type):type==='character'?['character','creature'].includes(findAsset(m,x)?.asset_type):findAsset(m,x)?.asset_type===type),'Invalid anchor assignment');
      if(Object.keys(record.shots||{}).length){need(a.new_version_id&&!m.scenes[a.new_version_id],'New scene version ID must be unused');next.scene_id=a.new_version_id;}
      next.shots={};
     }else{
      const spec=tools.find(t=>t.name==='save_draft_asset');const input=Object.fromEntries(Object.keys(spec.inputSchema.properties).filter(k=>k in next).map(k=>[k,next[k]]));validate(spec.inputSchema,input);
      for(const x of next.reference_ids)need(m.references[x]&&m.references[x].role!=='DIAGNOSTIC','Invalid reference');
      need(!['character','creature'].includes(entity)||next.reference_ids.some(x=>m.references[x].role==='IDENTITY'),'Character needs IDENTITY reference');need(!record.wardrobe_edit,'Use prepare_wardrobe_edit to change wardrobe draft details');if(record.status==='LOCKED'){need(a.new_version_id&&/^[a-zA-Z0-9_-]{1,80}$/.test(a.new_version_id),'Provide a new_version_id to edit a locked anchor');need(!findAsset(m,a.new_version_id),'Version ID already exists');next.asset_id=a.new_version_id;next.supersedes=id;delete next.locked_at;delete next.approval_instruction}
      if(record.reference_preservation&&keys.some(k=>['reference_ids','immutable_traits'].includes(k)))next.analysis_pending=true;next.status='DRAFT';next.generation_review=null;delete next.source_image_id;
     }
     collection[next.asset_id||next.scene_id||id]=annotate(next,m,entity);
    }
   }else throw Error('Unknown action');
  }
 }
 m.permits={};m.history.push({kind:'manage_record',entity,action,id,date:new Date().toISOString()});
 const saved=collection?.[a.new_version_id]||collection?.[id]||(entity==='keyframe'?Object.values(m.scenes).flatMap(s=>Object.values(s.shots||{})).find(s=>s.asset_id===id):undefined);
 return {saved:true,entity,action,id,record:saved?clean(saved):undefined};
}
