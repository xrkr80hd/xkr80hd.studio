import {stampProjectIdentity} from './project-identity.mjs';
export function projectEdit(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['project_id','new_project_id','name','expected_revision'].includes(k)))throw Error('Invalid project edit');
 for(const id of [input.project_id,input.new_project_id])if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw Error('Use letters, numbers, hyphens or underscores for the project ID (up to 80 characters).');
 if([input.project_id,input.new_project_id].includes('xce-lost-assets'))throw Error('Lost Assets cannot be renamed.');
 if(typeof input.name!=='string'||!input.name.trim()||input.name.length>200)throw Error('Enter a project title (up to 200 characters).');
 if(!Number.isInteger(input.expected_revision)||input.expected_revision<1)throw Error('Wait for this project to finish syncing, then try again.');
 return {...input,name:input.name.trim()};
}
export function editedProjectManifest(manifest,input){
 const a=projectEdit(input);if(manifest.system_pool||manifest.deleted_at)throw Error('Choose an active project.');
 const next=structuredClone(manifest);
 // Keep all asset IDs, storage keys and codes. Update exact project selectors only.
 function visit(value){if(!value||typeof value!=='object')return;for(const [key,child] of Object.entries(value)){if(key==='project_id'&&child===a.project_id)value[key]=a.new_project_id;else if(key!=='history')visit(child)}}
 visit(next);next.campaign_name=a.name;stampProjectIdentity(next,a.new_project_id);
 next.history||=[];next.history.push({kind:'project_edited',previous_project_id:a.project_id,project_id:a.new_project_id,date:new Date().toISOString()});
 return next;
}
