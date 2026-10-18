export const recordKey=a=>(a.category==='references'?'reference':a.asset_type||a.type||a.category||'asset')+':'+(a.asset_id||a.scene_id||a.id);
export function nextPendingIndex(records,index,completed){for(let offset=1;offset<=records.length;offset++){const i=(index+offset)%records.length;if(!completed.has(recordKey(records[i])))return i;}return -1;}
export function swipeStep(dx,dy){return Math.abs(dx)>=48&&Math.abs(dx)>Math.abs(dy)*1.8?(dx<0?1:-1):0;}
