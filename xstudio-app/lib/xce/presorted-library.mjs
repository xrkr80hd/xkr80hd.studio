const types={character:'characters',creature:'creatures',prop:'props',vehicle:'vehicles',location:'locations',scene:'scenes_and_shots'};
export function presortedLibraryRows(manifest,assets){
 const attached=new Set(assets.flatMap(a=>a.reference_ids||[]));
 const attachedKeys=new Set([...attached].map(id=>manifest.references?.[id]?.key).filter(Boolean));
 return Object.values(manifest.references||{}).filter(r=>types[r.presort?.type]&&!attached.has(r.id)&&!attachedKeys.has(r.key)).map(r=>({...r,id:r.id,name:r.presort.display_name||r.asset_name||r.name,type:types[r.presort.type],sourceReference:true,legacy:true,reference_ids:[r.id],status:'DRAFT'}));
}
