export const emptyStory=()=>({notes:'',story:'',script:'',documents:[],scenes:[]});
export function validateStory(input,manifest){
 if(!input||typeof input!=='object')throw Error('Story document required');
 const out=emptyStory();
 for(const key of ['notes','story','script']){if(typeof input[key]!=='string'||input[key].length>150000)throw Error('Invalid '+key);out[key]=input[key]}
 if(input.documents!==undefined&&!Array.isArray(input.documents))throw Error('Invalid documents');
 if((input.documents||[]).length>200)throw Error('Too many drafts');
 const documentIds=new Set();out.documents=(input.documents||[]).map(d=>{if(!d||typeof d.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(d.id)||documentIds.has(d.id)||!['notes','story','script'].includes(d.kind)||typeof d.title!=='string'||d.title.length>200||typeof d.body!=='string'||d.body.length>150000)throw Error('Invalid draft');documentIds.add(d.id);return {id:d.id,kind:d.kind,title:d.title,body:d.body}});
 if(!Array.isArray(input.scenes)||input.scenes.length>200)throw Error('Too many scene plans');
 const ids=new Set();const assetIds=new Set(Object.values(manifest.manifest_store||{}).flatMap(records=>Object.keys(records)));
 out.scenes=input.scenes.map(s=>{
  if(!s||typeof s.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(s.id)||ids.has(s.id))throw Error('Invalid scene plan ID');ids.add(s.id);
  const next={id:s.id};for(const key of ['title','script','blocking','shots','firstFrame','finalFrame']){if(typeof s[key]!=='string'||s[key].length>50000)throw Error('Invalid scene '+key);next[key]=s[key]}
  if(!['SS','AS'].includes(s.progression))throw Error('Choose SS or AS');next.progression=s.progression;
  for(const key of ['asset_ids','reference_ids']){if(!Array.isArray(s[key])||s[key].length>200||s[key].some(id=>typeof id!=='string'||!(key==='asset_ids'?assetIds.has(id):manifest.references?.[id])))throw Error('Unknown linked asset');next[key]=[...new Set(s[key])]}
  return next;
 });
 if(JSON.stringify(out).length>1000000)throw Error('Story workspace is too large');return out;
}
