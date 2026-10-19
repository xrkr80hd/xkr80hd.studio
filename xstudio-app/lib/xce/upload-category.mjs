import {CAST_GROUPS} from './cast-groups.mjs';
import {allocate,annotate} from './namespace.mjs';
import {categories} from './core.mjs';
export const UPLOAD_CATEGORIES={...Object.fromEntries(Object.entries(CAST_GROUPS).map(([id,label])=>['cast:'+id,label])),creature:'Creatures / Beasts',prop:'Props',vehicle:'Vehicles',location:'Locations',costume:'Costumes & Styling',scene:'Scenes / Establishing Shots',style:'Visual Style',diagnostic:'Failed Output'};
export function uploadDestination(category){
 if(!Object.hasOwn(UPLOAD_CATEGORIES,category))throw Error('Choose an upload category.');
 if(category.startsWith('cast:'))return {role:'IDENTITY',asset_type:'character',cast_group:category.slice(5)};
 return {creature:{role:'IDENTITY',asset_type:'creature'},prop:{role:'PROP',asset_type:'prop'},vehicle:{role:'PROP',asset_type:'vehicle'},location:{role:'LOCATION',asset_type:'location'},costume:{role:'COSTUME',asset_type:'character'},scene:{role:'BLUEPRINT',asset_type:'scene'},style:{role:'STYLE'},diagnostic:{role:'DIAGNOSTIC'}}[category];
}
// The upload and its classified asset are committed in the same manifest save.
export function classifyUpload(m,reference,category){
 const target=uploadDestination(category);reference.upload_category=category;
 if(category==='costume')reference.presort={type:'wardrobe',display_name:reference.asset_name||reference.name};
 if(!target.asset_type||['costume','scene'].includes(category))return null;
 const type=target.asset_type,name=(reference.asset_name||reference.name).trim().slice(0,200),id=allocate(m,type,name);
 const asset=annotate({asset_id:id,asset_type:type,name,target_deliverable:type==='character'?'character_turnaround':type==='creature'?'creature_sheet':type==='location'?'location_map':'prop_sheet',mode:'simple',medium:'RL',reference_ids:[reference.id],intake_source_reference_ids:[reference.id],reference_preservation:true,analysis_pending:true,immutable_traits:{silhouette:'',material_spec:''},status:'DRAFT',generation_review:null},m,type);
 m.manifest_store[categories[type]]||={};m.manifest_store[categories[type]][id]=asset;
 if(target.cast_group){m.character_cast_groups||={};m.character_cast_groups[id]=target.cast_group}
 m.active_asset_id=id;return asset;
}
