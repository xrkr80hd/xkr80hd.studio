import {owner,load,save,requireFolder} from './server';
import {gradeLibrary,gradeVersion,manageColorGrade} from './color-grades.mjs';
import {cgeToNative,validateCgeProfile} from './cge-profile.mjs';
import {isTrustedOrigin} from '../xstudio-validation.mjs';
import {readBounded} from '../xstudio-providers.mjs';
const json=(body:any,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
function project(req:Request){const id=new URL(req.url).searchParams.get('project_id');if(!id||!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw Error('Choose a project_id');return id}
function failure(e:unknown){const message=(e as Error).message;return json({error:message},message==='Folder locked'?423:message.includes('changed')||message.includes('Concurrent')?409:message.includes('not found')?404:400)}
export async function listGrades(req:Request){
 let u;try{u=await owner(req)}catch{return json({error:'Sign in required'},401)}
 try{const p=project(req);await requireFolder(req,u,p);const {m,revision}=await load(u,p);if(!revision||m.deleted_at)return json({error:'Project not found'},404);return json({project_id:p,revision,grades:gradeLibrary(m)});}catch(e){return failure(e)}
}
export async function writeGrade(req:Request,gradeId?:string){
 if(!isTrustedOrigin(req))return json({error:'Invalid origin'},403);
 let u;try{u=await owner(req)}catch{return json({error:'Sign in required'},401)}
 try{const p=project(req),body=JSON.parse((await readBounded(req,120000)).toString('utf8'));if(body.confirm!==true)return json({error:'Explicit save confirmation required'},400);
 await requireFolder(req,u,p);const {m,revision}=await load(u,p);if(!revision||m.deleted_at)return json({error:'Project not found'},404);if(body.expected_revision!==revision)return json({error:'Project changed; reload before saving'},409);
 const profile=validateCgeProfile(body.profile);if(gradeId&&profile.grade_id!==gradeId)return json({error:'Grade ID mismatch'},400);
 const existing=m.color_grades?.custom?.[profile.grade_id];if(gradeId&&!existing)return json({error:'Custom grade not found'},404);if(!gradeId&&existing)return json({error:'Grade already exists; use PATCH with the current version'},409);
 if(gradeId&&body.expected_version!==existing.version)return json({error:'Grade changed; reload current version'},409);
 const native=cgeToNative(profile,existing);const result=manageColorGrade(m,{action:'save',data:native,expected_version:body.expected_version});await save(u,p,m,revision);
 const stored=await load(u,p);const actual=gradeVersion(stored.m,profile.grade_id);if(actual.version!==result.grade.version||JSON.stringify(actual.cge_profile)!==JSON.stringify(profile))throw Error('Save could not be verified; read the grade before retrying');
 return json({saved:true,status:'PUSHED',project_id:p,revision:stored.revision,grade:actual},gradeId?200:201);
 }catch(e){return failure(e)}
}
