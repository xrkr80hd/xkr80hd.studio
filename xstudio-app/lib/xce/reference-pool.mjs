import {assetCategory} from './equipment.mjs';
import {CAST_GROUPS} from './cast-groups.mjs';
// Browser manifests intentionally omit private storage keys. IDs identify images.
export function referencePoolRows(manifest,project,title){
 const owners=[...Object.entries(manifest.manifest_store||{}),...Object.entries(manifest.world_library||{}),['scenes_and_shots',manifest.scenes||{}]].flatMap(([type,items])=>Object.values(items||{}).filter(a=>!a.deleted_at).map(a=>({...a,type})));
 return Object.entries(manifest.references||{}).filter(([,r])=>r.role!=='DIAGNOSTIC'&&!r.deleted_at).map(([id,r])=>{const owner=owners.find(a=>[...(a.reference_ids||[]),...(a.intake_source_reference_ids||[]),...(a.reference_sequence||[]).map(b=>b.reference_id),a.blueprint_id,a.source_image_id].includes(id));const type=owner?.type||(r.upload_category==='costume'?'wardrobe':null)||({character:'characters',creature:'creatures',prop:'props',vehicle:'vehicles',location:'locations',scene:'scenes_and_shots'})[r.presort?.type||r.asset_type]||({IDENTITY:'characters',COSTUME:'wardrobe',PROP:'props',LOCATION:'locations',BLUEPRINT:'scenes_and_shots',STYLE:'style'})[r.role]||'uploads';return {id,project,title,name:owner?.name||r.asset_name||r.name||id,role:r.role||'Reference',asset_type:r.asset_type||'',category:assetCategory(manifest,{...owner,type}),cast_group:manifest.character_cast_groups?.[owner?.asset_id||owner?.id]||'general'};});
}
export function filterReferencePool(rows,query,source,currentProject,selected){
 const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),used=new Set(selected);
 return rows.filter(r=>(!source||r.project===source)&&!(r.project===currentProject&&used.has(r.id))&&terms.every(term=>[r.name,r.id,r.title,r.role,r.asset_type].join(' ').toLocaleLowerCase().includes(term)));
}

export function referencePoolGroups(rows){
 const types={creatures:'Creatures',beasts:'Beasts',magical_beings:'Magical Beings',props:'Props',weapons:'Weapons',vehicles:'Vehicles',locations:'Locations',rooms:'Rooms',wardrobe:'Wardrobe',scenes_and_shots:'Scene references',style:'Style references',uploads:'Uploads to organize'};
 const sorted=records=>records.slice().sort((a,b)=>a.name.localeCompare(b.name));
 return [...Object.entries(CAST_GROUPS).map(([key,label])=>({id:'cast:'+key,label:key==='main'?'Main Characters':label,records:sorted(rows.filter(r=>r.category==='characters'&&(Object.hasOwn(CAST_GROUPS,r.cast_group)?r.cast_group:'general')===key))})),...Object.entries(types).map(([key,label])=>({id:key,label,records:sorted(rows.filter(r=>r.category===key))}))].filter(g=>g.records.length);
}

// This picker starts at the current project's root. No cross-project fetch or default folder.
export function projectAssetFolders(manifest,project){
 const rows=referencePoolRows(manifest,project,manifest.campaign_name||'This project');
 const folders={characters:'Characters',creatures:'Creatures',beasts:'Beasts',magical_beings:'Magical Beings',wardrobe:'Wardrobe',props:'Props',weapons:'Weapons',vehicles:'Vehicles',locations:'Locations',rooms:'Rooms',scenes_and_shots:'Scenes',style:'Style references',uploads:'Reference uploads'};
 return Object.entries(folders).map(([id,label])=>({id,label,records:rows.filter(r=>r.category===id).sort((a,b)=>a.name.localeCompare(b.name))}));
}
