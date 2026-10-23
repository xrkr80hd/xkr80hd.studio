import {assetCategory} from './equipment.mjs';
import {CAST_GROUPS} from './cast-groups.mjs';
export {CHARACTER_GENDERS} from './character-labels.mjs';
const assetCategories={creatures:'Creatures',beasts:'Beasts',magical_beings:'Magical Beings',props:'Props',weapons:'Weapons',vehicles:'Vehicles',locations:'Locations',rooms:'Rooms',wardrobe:'Wardrobe',scenes_and_shots:'Scene references'};
export function sceneInventoryGroups(assets,{query='',gender='',sort='name'}={}){
 const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const rows=assets.filter(a=>a.status==='LOCKED'&&terms.every(t=>[a.name,a.asset_code].join(' ').toLocaleLowerCase().includes(t))&&(!gender||a.category!=='characters'||(a.gender||'unspecified')===gender));
 const order=(a,b)=>sort==='name_desc'?String(b.name).localeCompare(String(a.name)):String(a.name).localeCompare(String(b.name));
 return [
  ...Object.entries(CAST_GROUPS).map(([id,label])=>({id:'cast:'+id,label:id==='main'?'Main Characters':id==='supporting'?'Supporting Characters':label,records:rows.filter(a=>a.category==='characters'&&(Object.hasOwn(CAST_GROUPS,a.cast_group)?a.cast_group:'general')===id).sort(order)})),
  ...Object.entries(assetCategories).map(([id,label])=>({id,label,records:rows.filter(a=>assetCategory({},a)===id).sort(order)}))
 ].filter(group=>group.records.length);
}

export function toggleSceneSelection(selected,id){return selected.includes(id)?selected.filter(value=>value!==id):[...selected,id];}
export function addSceneSelections(config,selected,assets){
 const existing=new Set(config.placements.map(a=>a.asset_id)),ids=[...new Set(selected)].filter(id=>!existing.has(id));
 if(config.placements.length+ids.length>60)throw Error('Choose up to 60 assets for one scene.');
 if(ids.some(id=>!assets.some(a=>a.id===id&&a.status==='LOCKED')))throw Error('An asset changed. Reopen the picker and try again.');
 return {...config,placements:[...config.placements,...ids.map((asset_id,index)=>({asset_id,x:25+((config.placements.length+index)%2)*50,y:30+(Math.floor((config.placements.length+index)/2)%2)*45,plane:'midground',action:'as described'}))]};
}
