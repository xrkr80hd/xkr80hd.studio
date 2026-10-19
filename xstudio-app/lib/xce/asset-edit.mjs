import {saveAssetDetails} from './asset-details.mjs';
import {storePrompts} from './core.mjs';
import {reclassify} from './reclassify.mjs';
import {worldRecords,WORLD_TYPES,validateWorld} from './world-library.mjs';
import {CAST_GROUPS,assignCastGroup} from './cast-groups.mjs';
import {CHARACTER_GENDERS} from './character-labels.mjs';
const legacyTypes={characters:'character',creatures:'creature',props:'prop',vehicles:'vehicle',locations:'location'};
export function editAsset(m,id,details){
 let next=structuredClone(m),asset=worldRecords(next).find(a=>a.id===id&&!a.deleted_at);
 if(!asset)throw Error('Open a saved asset before editing');
 const originalType=m.manifest_store?.creatures?.[id]?'creatures':asset.type;
 const type=details.category||originalType,name=details.name===undefined?asset.name:details.name;
 if(typeof name!=='string'||!name.trim()||name.length>200)throw Error('Enter a name up to 200 characters');
 if(typeof (details.classification||'')!=='string'||(details.classification||'').length>100)throw Error('Keep classification under 100 characters');
 if(asset.legacy){
  if(!legacyTypes[type])throw Error('Choose a category for this asset');
  if(type!==originalType){const result=reclassify(next,{entity:legacyTypes[originalType],id,target_category:legacyTypes[type],name});id=result.id;}
  else next.manifest_store[originalType][id].name=name.trim();
 }else{
  if(!Object.hasOwn(WORLD_TYPES,type))throw Error('Choose an asset category');
  const world=structuredClone(next.world_library),record={...world[originalType][id],name:name.trim(),type};
  if(type!==originalType){delete world[originalType][id];record.status='DRAFT';delete record.owner_image_approval;delete record.locked_at;}
  world[type]||={};world[type][id]=record;
  const baseline=structuredClone(next);if(type!==originalType)delete baseline.world_library[originalType][id];
  next.world_library=validateWorld(world,baseline);
 }
 next=saveAssetDetails(next,id,{description:details.description,clauses:type==='props'?details.clauses:[]});
 next.asset_details[id].classification=(details.classification||'').trim();
 if(type==='characters'){
  if(details.cast_group!==undefined)next=assignCastGroup(next,id,details.cast_group,worldRecords(next));
  if(details.gender!==undefined){if(!Object.hasOwn(CHARACTER_GENDERS,details.gender))throw Error('Choose a gender label');next.character_network||={};next.character_network.details||={};next.character_network.details[id]={...next.character_network.details[id],gender:details.gender};}
 }
 next.permits={};next.history||=[];next.history.push({kind:'edit_asset',id,date:new Date().toISOString()});storePrompts({...next,manifest_store:next.manifest_store||{},scenes:next.scenes||{}});
 const saved=worldRecords(next).find(a=>a.id===id);
 return {manifest:next,asset:{...saved,category:type},asset_id:id};
}
export {CAST_GROUPS};
