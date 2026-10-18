import {updateWorldBuilder} from './world-builder-fields.mjs';
import {worldRecords} from './world-library.mjs';
export function projectSummary(m){
 const rows=worldRecords(m).filter(a=>!a.deleted_at),counts={};
 for(const a of rows){const type=Object.hasOwn(m.manifest_store?.creatures||{},a.id)?'creatures':a.type;counts[type]=(counts[type]||0)+1;}
 return {description:m.folder_lock?'':m.project_description||'',assets:rows.length,references:Object.keys(m.references||{}).length,scene_count:Object.values(m.scenes||{}).filter(s=>!s.deleted_at).length,asset_counts:m.folder_lock?null:counts};
}
export function editProjectDetails(m,data){
 if(!data||typeof data!=='object'||Array.isArray(data)||!Object.keys(data).length||Object.keys(data).some(k=>!['name','description','world_builder'].includes(k)))throw Error('Edit the project name or short description');
 if('name'in data&&(typeof data.name!=='string'||!data.name.trim()||data.name.length>200))throw Error('Project name required (max 200 characters)');
 if('description'in data&&(typeof data.description!=='string'||data.description.length>400))throw Error('Short description must be at most 400 characters');
 if('world_builder'in data)updateWorldBuilder(m,data.world_builder);
 if('name'in data)m.campaign_name=data.name.trim();
 if('description'in data)m.project_description=data.description.trim();
}
