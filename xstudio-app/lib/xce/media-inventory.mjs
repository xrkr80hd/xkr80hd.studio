export function mediaInventory(rows){
 const files=new Map();
 function add(record,visible,project,kind,deleted=false){if(!record||typeof record.key!=='string'||!record.key.startsWith('xce/'))return;const existing=files.get(record.key);const item={key:record.key,mime_type:record.mime_type,name:record.asset_name||record.name||record.id||kind,visible,projects:[project],kind,deleted};if(existing){existing.visible ||= visible;existing.deleted &&= deleted;if(!existing.projects.includes(project))existing.projects.push(project)}else files.set(record.key,item);}
 for(const row of rows){const m=typeof row.manifest==='string'?JSON.parse(row.manifest):row.manifest;const live=!m.deleted_at;
  for(const ref of Object.values(m.references||{}))add(ref,live,row.project,'reference',!live);
  add(m.cover_image,false,row.project,'cover',!live);
  function retained(value,deleted){if(!value||typeof value!=='object')return;if(value.key)add(value,false,row.project,'retained',deleted);for(const child of Object.values(value))if(typeof child==='object')retained(child,deleted);}
  retained(m.trash,true);retained(m.history,!live);
 }
 return [...files.values()].sort((a,b)=>a.key.localeCompare(b.key));
}
