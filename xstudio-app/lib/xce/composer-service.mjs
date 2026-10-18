import {createHash,randomUUID} from 'node:crypto';
import {resolveComposition,compileComposition,inventory,gradeLibrary} from './composer.mjs';
const clone=v=>structuredClone(v);
export function imageMime(bytes){if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';throw Error('Reference is not PNG, JPEG or WebP');}
export async function prepareComposition(m,p,config,getImage){
 const resolved=resolveComposition(m,p,config),verified={},images=[];let total=0;
 for(const id of resolved.references){const ref=m.references[id],object=await getImage(ref.key);if(!object)throw Error('Reference bytes missing: '+id);if(object.size>6*1024*1024)throw Error('Reference exceeds 6 MB: '+id);const bytes=Buffer.from(await object.arrayBuffer());total+=bytes.length;if(bytes.length>6*1024*1024||total>40*1024*1024)throw Error('Reference bundle exceeds size limits');const mime=imageMime(bytes);if(mime!==ref.mime_type||object.httpMetadata?.contentType!==mime)throw Error('Reference MIME mismatch: '+id);verified[id]={sha256:createHash('sha256').update(bytes).digest('hex'),byte_length:bytes.length,mime_type:mime,verified_at:new Date().toISOString()};images.push({reference_id:id,mime_type:mime,bytes});}
 return {output:compileComposition(m,p,config,verified),images};
}
export function catalogue(m,p,revision){return {project_id:p,revision,assets:inventory(m,p),grades:gradeLibrary(m),compositions:Object.values(m.composer?.compositions||{}).map(c=>({id:c.id,name:c.name,version:c.version,updated_at:c.updated_at})),shot_lists:Object.entries(m.shot_lists||{}).map(([id,list])=>({id,name:list.name,shots:list.shots.map(s=>({id:s.id,title:s.title,approved:s.approved,character_ids:s.character_ids,panel:s.panel,style:s.style||'',grade_id:s.effective_grade?.grade_id||'',grade_version:s.effective_grade?.grade_version||0}))})),intelligence:clone(m.composer?.intelligence||{})};}
export function saveComposition(m,args,output){
 if(args.confirm!==true)throw Error('Explicit save confirmation required');if(typeof args.name!=='string'||!args.name.trim()||args.name.length>150)throw Error('Name the composition');
 const next=clone(m);next.composer||={};next.composer.compositions||={};const id=args.id||'COMP-'+randomUUID();if(!/^[\w-]{1,128}$/.test(id))throw Error('Invalid composition ID');const prior=next.composer.compositions[id];if(args.id&&!prior)throw Error('Composition not found');if(prior&&args.expected_version!==prior.version)throw Error('Composition changed; reopen it before saving');
 if(!prior&&Object.keys(next.composer.compositions).length>=200)throw Error('Composition limit reached');
 const record={id,name:args.name.trim(),version:(prior?.version||0)+1,updated_at:new Date().toISOString(),configuration:clone(output.configuration)};next.composer.compositions[id]=record;
 // Bounded history retains configurations, not duplicate assets or media.
 next.composer.history||={};next.composer.history[id]=[...(next.composer.history[id]||[]),...(prior?[prior]:[])].slice(-10);
 return {manifest:next,record};
}
const PROFILE_FIELDS=['visual_description','dimensions_proportions','clothing_textures_materials_colors','environment','history_background','locked_identity_properties','verified_facts','visual_observations','ai_suggestions','research_sources','supplemental_details'];
export function editIntelligence(m,assetId,profile,approve=false,expectedVersion=0,confirm=false){
 const asset=inventory(m,'').find(a=>a.id===assetId);if(!asset)throw Error('Asset not found');if(!profile||typeof profile!=='object'||Array.isArray(profile)||Object.keys(profile).some(k=>!PROFILE_FIELDS.includes(k)))throw Error('Invalid intelligence profile');
 for(const [k,v] of Object.entries(profile))if(typeof v!=='string'||v.length>10000)throw Error('Invalid profile field: '+k);
 const next=clone(m);next.composer||={};next.composer.intelligence||={};const old=next.composer.intelligence[assetId]||{version:0};if(old.version!==expectedVersion)throw Error('Intelligence changed; reload before saving');if(approve&&confirm!==true)throw Error('Explicit research approval required');
 if(approve&&JSON.stringify(profile)!==JSON.stringify(old.draft))throw Error('Save and review this research draft before approving');
 const value={...old,version:old.version+1,draft:clone(profile),...(approve?{approved:clone(profile),approved_at:new Date().toISOString()}:{}),updated_at:new Date().toISOString()};next.composer.intelligence[assetId]=value;return {manifest:next,profile:value};
}
export function researchBrief(m,p,id){const asset=inventory(m,p).find(a=>a.id===id);if(!asset)throw Error('Asset not found');return {asset_id:id,project_id:p,status:'REVIEW_REQUIRED',online_research_performed:false,approved_reference_ids:asset.reference_ids,prompt:'Research '+asset.name+' ['+id+'] using the approved project reference images and canon. Separate verified facts (with source URLs), visible observations, and AI suggestions. Do not infer a public character from its name. Flag conflicts with locked canon. Propose supplemental details for user approval; never replace identity locks.'};}
