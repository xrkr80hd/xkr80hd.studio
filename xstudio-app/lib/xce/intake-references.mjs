import {allocate,annotate} from './namespace.mjs';
import {need} from './core.mjs';
// Preserve source classification; give the saved asset its own correctly typed reference.
export function intakeReferences(m,ids,type,name){
 const role=type==='scene'?'BLUEPRINT':['character','creature'].includes(type)?'IDENTITY':type==='location'?'LOCATION':'PROP';
 return [...new Set(ids)].map(id=>{const r=m.references[id];need(r&&r.role!=='DIAGNOSTIC','Choose a valid source image');if(r.role===role&&r.asset_type===type)return id;const next=allocate(m,type,name);m.references[next]=annotate({...structuredClone(r),id:next,name:r.name||name,asset_name:name,asset_type:type,role},m,type);return next;});
}
