// Resolve only exact canonical IDs/codes in the caller's authorized project set.
// Dependencies reuse the gateway's existing lock, media and revision checks.
export async function retrieveCharacterReference(args,{projectIds,loadProject,matches,readCref,signReferences}){
 const {character_id,project_id,include_turnaround=true}=args;
 if(typeof character_id!=='string'||!/^\w[\w-]{0,127}$/.test(character_id))throw Error('A valid exact character_id is required');
 if(typeof include_turnaround!=='boolean')throw Error('include_turnaround must be a boolean');
 if(project_id!==undefined&&!projectIds.has(project_id))throw Error('Character not found or unavailable');
 const ids=project_id===undefined?[...projectIds]:[project_id];
 if(ids.length>50)throw Error('Specify project_id to narrow character lookup');
 const hits=[];
 // Four concurrent reads bound load without relying on an active-project default.
 for(let start=0;start<ids.length;start+=4){
  const batch=await Promise.all(ids.slice(start,start+4).map(async project=>{
   const saved=await loadProject(project);
   if(!saved)return [];
   return matches(saved.m,character_id).map(entry=>({project,saved,entry}));
  }));
  hits.push(...batch.flat());
 }
 if(!hits.length)throw Error('Character not found or unavailable');
 if(hits.length!==1)throw Error('Character ID/code is ambiguous; specify project_id or the canonical character ID');
 const hit=hits[0];
 if(hit.entry.type!=='character')throw Error('Choose a saved LOCKED character');
 const result=await readCref(hit.project,character_id);
 if(result.cref?.revision!==hit.saved.revision)throw Error('Project changed while resolving character. Retry retrieval.');
 if(result.cref?.lock_status!=='LOCKED'||result.cref?.images_retrieved!==true||!result.images?.length)throw Error('Locked character image was not retrieved');
 const refs=await signReferences(hit.saved.m,hit.project,result.cref.reference_ids,true);
 const urls=result.cref.reference_ids.map(id=>{
  const ref=refs.find(r=>r.reference_id===id);
  if(!ref?.media?.url||ref.generation_input_allowed===false)throw Error('Locked reference URL unavailable');
  return {reference_id:id,...ref.media};
 });
 const current=await loadProject(hit.project);
 if(!current||current.revision!==hit.saved.revision)throw Error('Project changed while loading character reference. Retry retrieval.');
 return {...result,character_id:result.cref.asset_id,canonical_asset_id:result.cref.asset_id,
  asset_code:result.cref.asset_code,project_id:hit.project,reference_urls:urls,
  cref_parameters:{flag:'--cref',value:urls.map(r=>r.url).join(' '),expires_in:60},
  ...(include_turnaround?{turnaround_sheet:{reference_ids:result.cref.reference_ids,urls:urls.map(r=>r.url),layout_verified:false,note:'Exact locked source sheet. No six-column or 16:9 layout is inferred.'}}:{}),
  instruction:'Display the returned locked image in chat. Use these exact original pixels as the character reference for downstream scene generation through the client\'s supported image-input mechanism. URLs expire after 60 seconds; retrieve this character again to renew them. Do not substitute a description or similar image. Tool image delivery alone does not prove a separate generator received the reference.'};
}
