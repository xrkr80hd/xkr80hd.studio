export const recordKey=a=>(a.category==='references'||a.sourceReference?'reference':a.asset_type||a.type||a.category||'asset')+':'+(a.asset_id||a.scene_id||a.id);
export function nextPendingIndex(records,index,completed){for(let offset=1;offset<=records.length;offset++){const i=(index+offset)%records.length;if(!completed.has(recordKey(records[i])))return i;}return -1;}
export function swipeStep(dx,dy){return Math.abs(dx)>=48&&Math.abs(dx)>Math.abs(dy)*1.8?(dx<0?1:-1):0;}
// Use the refreshed manifest so cascading deletions also leave the carousel.
export function queueAfterDelete(queue,removedKeys,manifest){
 const removed=new Set(removedKeys);
 const exists=a=>{
  if(removed.has(recordKey(a)))return false;
  if(!manifest)return true;
  const id=a.asset_id||a.scene_id||a.id;
  if(a.category==='references'||a.sourceReference||a.asset_type==='reference')return Boolean(manifest.references?.[id]);
  if(a.category==='scenes'||a.scene_id&&!a.asset_id)return Boolean(manifest.scenes?.[id]);
  const kind=a.asset_type||a.type||a.category,category=({character:'characters',creature:'creatures',prop:'props',vehicle:'vehicles',location:'locations',keyframe:'shots',room:'rooms'}[kind]||kind);
  return Boolean(manifest.manifest_store?.[category]?.[id]||manifest.world_library?.[category]?.[id]);
 };
 const records=queue.records.filter(exists),keys=new Set(records.map(recordKey)),completed=new Set([...queue.completed].filter(key=>keys.has(key)));
 let next;
 for(let step=1;step<=queue.records.length;step++){
  const candidate=queue.records[(queue.index+step)%queue.records.length];
  if(keys.has(recordKey(candidate))&&(!queue.pending||!completed.has(recordKey(candidate)))){next=candidate;break;}
 }
 return {...queue,records,index:next?records.indexOf(next):-1,completed};
}

// Finishing a queue retains its last asset for review; only the owner closes it.
export function advanceAssetQueue(records,index,completed=new Set()){
 const done=new Set(completed);
 if(!records.length)return {index:-1,completed:done,finished:true};
 const current=Math.max(0,Math.min(index,records.length-1));
 done.add(recordKey(records[current]));
 const next=nextPendingIndex(records,current,done);
 return {index:next<0?current:next,completed:done,finished:next<0};
}
