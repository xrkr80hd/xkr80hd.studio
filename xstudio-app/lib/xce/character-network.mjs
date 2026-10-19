import {CHARACTER_GENDERS} from './character-labels.mjs';
export const CHARACTER_RELATIONS={equal_height:'Same height as',shorter_than:'Shorter than',taller_than:'Taller than',opposes:'Opposes',custom:'Your rule'};
const clone=v=>structuredClone(v);
const inverse={equal_height:'equal_height',shorter_than:'taller_than',taller_than:'shorter_than',opposes:'opposes',custom:'custom'};
export function characterLinks(m,id){return (m.character_network?.relationships||[]).flatMap(r=>r.subject_id===id?[{kind:r.kind,target_id:r.object_id,...(r.text?{text:r.text}:{}),...(r.kind==='custom'?{enabled:r.enabled!==false,clause_type:r.clause_type||'relationship'}:{})}]:r.object_id===id?[{kind:inverse[r.kind],target_id:r.subject_id,...(r.text?{text:r.text}:{}),...(r.kind==='custom'?{enabled:r.enabled!==false,clause_type:r.clause_type||'relationship'}:{})}]:[]);}
function graph(records,relationships){
 const ids=new Set(records.filter(a=>a.type==='characters'&&!a.deleted_at).map(a=>a.id)),parent=new Map([...ids].map(id=>[id,id]));
 const find=id=>{let p=parent.get(id);if(p!==id){p=find(p);parent.set(id,p)}return p};
 const valid=relationships.filter(r=>ids.has(r.subject_id)&&ids.has(r.object_id));
 for(const r of valid)if(r.kind==='equal_height')parent.set(find(r.subject_id),find(r.object_id));
 const edges=new Map([...ids].map(id=>[find(id),new Set()]));
 for(const r of valid)if(r.kind==='shorter_than'||r.kind==='taller_than'){const a=find(r.kind==='shorter_than'?r.subject_id:r.object_id),b=find(r.kind==='shorter_than'?r.object_id:r.subject_id);if(a===b)throw Error('Conflicting height rules: these characters are already the same height');edges.get(a).add(b);}
 const visiting=new Set(),visited=new Set();function visit(id){if(visiting.has(id))throw Error('Conflicting height rules form a cycle');if(visited.has(id))return;visiting.add(id);for(const next of edges.get(id)||[])visit(next);visiting.delete(id);visited.add(id)}for(const id of edges.keys())visit(id);
 const reaches=(a,b,seen=new Set())=>{if(a===b)return true;if(seen.has(a))return false;seen.add(a);return [...(edges.get(a)||[])].some(n=>reaches(n,b,seen))};
 return {find,reaches,valid};
}
export function saveCharacterDetails(m,id,details,records){
 const chars=records.filter(a=>a.type==='characters'&&!a.deleted_at);
 if(!chars.some(a=>a.id===id))throw Error('Choose a character in this project');
 if(!details||typeof details!=='object'||Array.isArray(details))throw Error('Provide a character details object');
 const unsupported=Object.keys(details).filter(k=>!['quick_details','links','gender'].includes(k));if(unsupported.length)throw Error('Unsupported Quick Details fields: '+unsupported.join(', '));
 const updateLinks=Object.hasOwn(details,'links');
 details={quick_details:m.character_network?.details?.[id]?.text||'',links:characterLinks(m,id),...details};
 if(typeof details.quick_details!=='string'||details.quick_details.length>4000||!Array.isArray(details.links)||details.links.length>50)throw Error('quick_details must be text up to 4,000 characters; links must be an array of at most 50 relationships');
 if(details.gender!==undefined&&!Object.hasOwn(CHARACTER_GENDERS,details.gender))throw Error('Choose a saved gender label');
 const next=clone(m);next.character_network||={};next.character_network.details||={};next.character_network.details[id]={...next.character_network.details[id],text:details.quick_details.trim(),gender:details.gender||m.character_network?.details?.[id]?.gender||'unspecified',source:'USER_SAVED',updated_at:new Date().toISOString()};
 if(!updateLinks)return next;
 const links=(m.character_network?.relationships||[]).filter(r=>r.subject_id!==id&&r.object_id!==id),seen=new Set();
 for(const r of details.links){if(!Object.hasOwn(CHARACTER_RELATIONS,r.kind)||r.target_id===id||!chars.some(a=>a.id===r.target_id))throw Error('Choose a different character from this project');if(r.kind==='custom'&&((r.enabled!==undefined&&typeof r.enabled!=='boolean')||(r.clause_type!==undefined&&!['relationship','synergy'].includes(r.clause_type))))throw Error('Invalid relationship / synergy clause');if(r.kind==='custom'&&(typeof r.text!=='string'||!r.text.trim()||r.text.length>2000))throw Error('Write your linked rule (up to 2,000 characters)');const key=r.kind+'|'+r.target_id+'|'+(r.text||'');if(seen.has(key))continue;seen.add(key);links.push({subject_id:id,kind:r.kind,object_id:r.target_id,...(r.kind==='custom'?{text:r.text.trim(),enabled:r.enabled!==false,clause_type:r.clause_type||'relationship'}:{})});}
 if(links.length>1000)throw Error('Character relationship limit reached');graph(chars,links);next.character_network.relationships=links;return next;
}
export function characterContext(m,selectedIds,records){
 const selected=new Set(selectedIds),chars=records.filter(a=>a.type==='characters'&&!a.deleted_at),active=chars.filter(a=>selected.has(a.id));
 const g=graph(chars,m.character_network?.relationships||[]),relationships=[];
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=active[i].id,b=active[j].id,pa=g.find(a),pb=g.find(b);let kind=pa===pb?'equal_height':g.reaches(pa,pb)?'shorter_than':g.reaches(pb,pa)?'taller_than':null;if(kind)relationships.push({subject_id:a,kind,object_id:b});if(g.valid.some(r=>r.kind==='opposes'&&((r.subject_id===a&&r.object_id===b)||(r.subject_id===b&&r.object_id===a))))relationships.push({subject_id:a,kind:'opposes',object_id:b});}
 const custom=g.valid.filter(r=>r.kind==='custom'&&r.enabled!==false&&selected.has(r.subject_id)&&selected.has(r.object_id));relationships.push(...custom);
 return {details:active.map(a=>({asset_id:a.id,name:a.name,cast_group:m.character_cast_groups?.[a.id]||'unassigned',quick_details:m.character_network?.details?.[a.id]?.text||''})),relationships};
}
export function characterContextPrompt(context){
 const name=id=>{const a=context.details.find(a=>a.asset_id===id);return (a?.name||id)+' ['+id+']'};
 return ['CHARACTER CONTINUITY — apply these saved rules whenever the selected characters appear together. Height means anatomical stature; respect perspective, pose and camera distance. Do not resize them to equal screen height.',...context.details.map(a=>'CHARACTER DETAILS '+JSON.stringify(a)),...context.relationships.map(r=>r.kind==='custom'?'USER-SAVED '+(r.clause_type||'relationship').toUpperCase()+' CLAUSE for '+name(r.subject_id)+' and '+name(r.object_id)+': '+JSON.stringify(r.text)+'. Apply this exact rule to both characters when together; interpret its meaning without inventing new rules.':r.kind==='opposes'?name(r.subject_id)+' and '+name(r.object_id)+' are in contention. Preserve this opposition when the scene calls for interaction or combat; do not invent a fight.':name(r.subject_id)+(r.kind==='equal_height'?' is the same height as ':r.kind==='shorter_than'?' is shorter than ':' is taller than ')+name(r.object_id)+'.')].join('\n');
}
