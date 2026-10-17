import {newSceneId} from './namespace.mjs';
import {intakeReferences} from './intake-references.mjs';
import {manage} from './manage.mjs';
import {need} from './core.mjs';
export function intakeScene(m,{name,reference_ids}){
 need(name?.trim()&&name.length<=200,'Name required (max 200 characters)');
 need(reference_ids?.length,'Select a storyboard or scene image');
 for(const id of reference_ids)need(m.references[id]&&m.references[id].role!=='DIAGNOSTIC','Choose a valid scene image');
 const ids=intakeReferences(m,reference_ids,'scene',name),id=newSceneId(m);
 manage(m,{entity:'scene',action:'create',id,data:{name:name.trim(),blueprint_id:ids[0],subject_count:0,character_ids:[],prop_ids:[],location_ids:[],blocking:'Uploaded scene / storyboard reference. Panel breakdown has not been reviewed.',lighting_palette:'Preserve the uploaded image.'}});
 const scene=m.scenes[id];scene.reference_ids=ids;scene.analysis_pending=true;scene.source_kind='uploaded_storyboard';m.active_scene=id;
 return {saved:true,scene,reference_ids:ids};
}
