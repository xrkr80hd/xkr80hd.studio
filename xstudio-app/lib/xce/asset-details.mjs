const rows=m=>[
 ...Object.entries(m.manifest_store||{}).flatMap(([type,items])=>Object.values(items).map(a=>({...a,id:a.asset_id||a.id,type}))),
 ...Object.entries(m.world_library||{}).flatMap(([type,items])=>Object.values(items).map(a=>({...a,type})))
];
export function saveAssetDetails(m,id,details){
 const assets=rows(m),asset=assets.find(a=>a.id===id&&!a.deleted_at);
 if(!asset)throw Error('Choose an asset in this project');
 if(!details||typeof details.description!=='string'||details.description.length>4000||!Array.isArray(details.clauses)||details.clauses.length>50)throw Error('Use a description up to 4,000 characters and at most 50 clauses');
 if(asset.type!=='props'&&details.clauses.length)throw Error('Character clauses are only available for props');
 const clauses=details.clauses.map(c=>{
  if(!c||!assets.some(a=>a.id===c.character_id&&a.type==='characters'&&!a.deleted_at))throw Error('Choose a character from this project');
  if(typeof c.text!=='string'||!c.text.trim()||c.text.length>2000||typeof c.enabled!=='boolean')throw Error('Write your clause (up to 2,000 characters) and choose whether it is enabled');
  return {character_id:c.character_id,text:c.text.trim(),enabled:c.enabled};
 });
 const next=structuredClone(m);next.asset_details||={};next.asset_details[id]={description:details.description.trim(),clauses,source:'USER_SAVED',updated_at:new Date().toISOString()};return next;
}
export function assetContext(m,selectedIds,records=rows(m)){
 const selected=new Set(selectedIds),assets=records.filter(a=>selected.has(a.id||a.asset_id)&&!a.deleted_at),characters=records.filter(a=>(a.type||a.category)==='characters'&&selected.has(a.id||a.asset_id)&&!a.deleted_at&&!m.manifest_store?.creatures?.[a.id||a.asset_id]);
 return {assets:assets.map(a=>({asset_id:a.id||a.asset_id,name:a.name,classification:m.asset_details?.[a.id||a.asset_id]?.classification||'',description:m.asset_details?.[a.id||a.asset_id]?.description||''})),clauses:assets.filter(a=>(a.type||a.category)==='props').flatMap(a=>(m.asset_details?.[a.id||a.asset_id]?.clauses||[]).filter(c=>c.enabled&&characters.some(ch=>(ch.id||ch.asset_id)===c.character_id)).map(c=>({prop_id:a.id||a.asset_id,prop_name:a.name,character_id:c.character_id,character_name:characters.find(ch=>(ch.id||ch.asset_id)===c.character_id).name,text:c.text})))};
}
export function assetContextPrompt(context){
 if(!context.assets.length)return '';
 return ['ASSET DESCRIPTIONS — use these user-saved details only for selected assets. Locked reference images remain the visual authority. Never add a prop or character to activate a clause.',...context.assets.filter(p=>p.description).map(p=>'USER-SAVED ASSET DESCRIPTION '+JSON.stringify(p)),...context.clauses.map(c=>'USER-SAVED PROP / CHARACTER CLAUSE '+JSON.stringify(c)+'. Apply only while both named assets are present; preserve the exact user-authored meaning.')].join('\n');
}
