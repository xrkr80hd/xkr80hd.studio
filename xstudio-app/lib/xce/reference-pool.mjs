// Browser manifests intentionally omit private storage keys. IDs identify images.
export function referencePoolRows(manifest,project,title){
 return Object.entries(manifest.references||{}).filter(([,r])=>r.role!=='DIAGNOSTIC'&&!r.deleted_at).map(([id,r])=>({id,project,title,name:r.asset_name||r.name||id,role:r.role||'Reference',asset_type:r.asset_type||''}));
}
export function filterReferencePool(rows,query,source,currentProject,selected){
 const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),used=new Set(selected);
 return rows.filter(r=>(!source||r.project===source)&&!(r.project===currentProject&&used.has(r.id))&&terms.every(term=>[r.name,r.id,r.title,r.role,r.asset_type].join(' ').toLocaleLowerCase().includes(term)));
}
