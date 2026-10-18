import {need,categories} from './core.mjs';
import {resolve} from './namespace.mjs';
import {manage} from './manage.mjs';
import {usesReference} from './attachments.mjs';
export function deleteRecords(m,args){
 need(args.confirm===true,'Confirm deletion first');need(args.items?.length,'Select at least one item');if(args.cascade===true)return cascadeDelete(m,args);
 const work=structuredClone(m);const order={scene:0,keyframe:1,character:2,creature:2,prop:2,vehicle:2,location:2,reference:3};
 const items=args.items.map(a=>{need(a.entity in order,'Unsupported item type');const record=resolve(work,a.entity,a.id||a.target_name);need(a.entity==='reference'||a.entity==='scene'||record.asset_type===a.entity,'Category does not match item');return {entity:a.entity,id:record.asset_id||record.scene_id||record.id}});
 need(new Set(items.map(a=>a.entity+':'+a.id)).size===items.length,'Duplicate selected items');items.sort((a,b)=>order[a.entity]-order[b.entity]);
 for(const a of items){const collection=a.entity==='scene'?work.scenes:a.entity==='reference'?work.references:work.manifest_store[categories[a.entity]];if(collection[a.id])manage(work,{...a,action:'delete',confirm:true});}
 return {manifest:work,result:{saved:true,deleted:items.length}};
}
export function purgeTrash(m,args){
 need(args.confirm===true,'Confirm permanent deletion first');const trash=m.trash||{};
 const keys=args.empty_all?Object.keys(trash).filter(k=>!k.startsWith('scene-version:')):args.keys;
 need(keys?.length,'Select deleted items first');need(new Set(keys).size===keys.length,'Duplicate selected items');for(const key of keys)need(trash[key]&&!key.startsWith('scene-version:'),'Deleted item not found');
 const removing=new Set(keys);const remaining=[...Object.values(m.world_library||{}).flatMap(Object.values),...Object.values(m.manifest_store).flatMap(Object.values),...Object.values(m.scenes),...Object.values(m.state_variants||{}).flatMap(Object.values),...Object.entries(trash).filter(([k])=>!removing.has(k)).map(([,t])=>t.record)];
 for(const key of keys){const t=trash[key];const id=t.record.asset_id||t.record.scene_id||t.record.id||key.slice(key.indexOf(':')+1);const dependents=remaining.filter(r=>usesReference(r,id));need(!dependents.length,'Needed by '+(dependents[0]?.name||'another saved or deleted item')+'. Restore it or include the dependent deleted item in your selection.');}
 for(const key of keys)delete trash[key];m.permits={};m.history.push({kind:'purge_trash',count:keys.length,date:new Date().toISOString()});return {saved:true,permanently_deleted:keys.length};
}

export function deletionPlan(m,items,{cascade=false}={}){
 const nodes=[...Object.values(m.references||{}).map(record=>({entity:'reference',id:record.id,record})),...Object.values(m.scenes||{}).map(record=>({entity:'scene',id:record.scene_id,record})),...Object.entries(m.manifest_store||{}).flatMap(([category,records])=>Object.values(records).map(record=>({entity:record.asset_type||({characters:'character',creatures:'creature',props:'prop',vehicles:'vehicle',locations:'location',shots:'keyframe'})[category],id:record.asset_id,record}))),...Object.values(m.shot_lists||{}).map(record=>({entity:'shot_list',id:record.id,record}))];
 const selected=new Set(items.map(item=>{const hit=nodes.find(n=>n.entity===item.entity&&n.id===item.id);need(hit,'Selected item no longer exists');return hit.entity+':'+hit.id}));
 need(selected.size===items.length,'Duplicate selected items');
 if(cascade){let changed=true;while(changed){changed=false;const ids=new Set(nodes.filter(n=>selected.has(n.entity+':'+n.id)).map(n=>n.id));for(const n of nodes)if(!selected.has(n.entity+':'+n.id)&&[...ids].some(id=>usesReference(n.record,id))){selected.add(n.entity+':'+n.id);changed=true;}}}
 return nodes.filter(n=>selected.has(n.entity+':'+n.id));
}
function cascadeDelete(m,args){
 const work=structuredClone(m),plan=deletionPlan(work,args.items,{cascade:true});
 for(const n of plan)if(n.entity==='reference')for(const states of Object.values(work.state_variants||{}))for(const state of Object.values(states))need(!state.reference_ids.includes(n.id),'Reference is assigned to alternate form '+state.name+'. Remove that assignment first.');
 const batch=crypto.randomUUID(),now=new Date().toISOString();work.trash||={};
 for(const n of plan){work.trash[n.entity+':'+n.id]={entity:n.entity,id:n.id,record:structuredClone(n.record),deleted_at:now,delete_batch_id:batch};if(n.entity==='reference')delete work.references[n.id];else if(n.entity==='scene')delete work.scenes[n.id];else if(n.entity==='shot_list')delete work.shot_lists[n.id];else delete work.manifest_store[categories[n.entity]][n.id];}
 const ids=new Set(plan.map(n=>n.id));for(const scene of Object.values(work.scenes))for(const [number,shot]of Object.entries(scene.shots||{}))if(ids.has(shot.asset_id))delete scene.shots[number];if(ids.has(work.active_asset_id))work.active_asset_id=null;if(ids.has(work.active_scene))work.active_scene=null;if(ids.has(work.active_reference_id))work.active_reference_id=null;if(work.pending_action&&ids.has(work.pending_action.asset_id))work.pending_action=null;work.permits={};work.history.push({kind:'cascade_delete',batch_id:batch,items:plan.map(n=>({entity:n.entity,id:n.id})),date:now});
 return {manifest:work,result:{saved:true,deleted:plan.length,linked_deleted:plan.length-args.items.length,delete_batch_id:batch,scope:'current_project',recoverable:true}};
}
