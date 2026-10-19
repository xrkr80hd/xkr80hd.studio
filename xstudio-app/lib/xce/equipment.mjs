// Display categories retain the original record, ID, images and storage type.
export function assetCategory(m,a){
 const id=a.id||a.asset_id,base=m.manifest_store?.creatures?.[id]?'creatures':a.category||a.type;
 const category=m.asset_details?.[id]?.library_category||a.library_category;
 if(base==='props'&&category==='weapons')return 'weapons';
 if(base==='creatures'&&['beasts','magical_beings'].includes(category))return category;
 return base;
}
export function equipmentIds(m,ids,records){
 if(!Array.isArray(ids)||ids.length>100||ids.some(id=>typeof id!=='string'))throw Error('Choose up to 100 props or weapons');
 const unique=[...new Set(ids)];
 if(unique.some(id=>!records.some(a=>(a.id||a.asset_id)===id&&!a.deleted_at&&(a.type||a.category)==='props')))throw Error('Choose existing props or weapons from this project');
 return unique;
}
