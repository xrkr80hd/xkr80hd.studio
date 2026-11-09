// Import an XCE Studios v3.0 delivery ZIP (per-shot first/last frames, prompts, continuity) as a shot list.
// The browser opens the ZIP and checks every checksum, then sends: plan → image (one per call) → apply (one save).
// Additive only: never edits or deletes existing shot lists, never approves shots, never locks anything.
import {owner,load,save,requireFolder,backend} from '../../../lib/xce/server';
import {isTrustedOrigin} from '../../../lib/xstudio-validation.mjs';
import {readBounded} from '../../../lib/xstudio-providers.mjs';
import {attachImage,referenceIdFor,imageMime,MAX_IMAGE_BYTES} from '../../../lib/xce/world-package.mjs';
import {readDeliveryPackage,verifyChecksums,deliveryFingerprint,buildDeliveryShotList,sha256Hex} from '../../../lib/xce/delivery-package.mjs';
import {manageShotList} from '../../../lib/xce/shot-lists.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store'};
const need=(ok:any,message:string)=>{if(!ok)throw Error(message);};
const validId=(v:any)=>typeof v==='string'&&/^[-\w]{1,80}$/.test(v);

// Text files carry content; images are described by type and size and uploaded separately.
async function packageFrom(a:any){
 need(a.texts&&typeof a.texts==='object'&&!Array.isArray(a.texts),'Missing package files');
 need(a.images&&typeof a.images==='object'&&!Array.isArray(a.images),'Missing image list');
 const files:Record<string,string>={};
 for(const [path,value] of Object.entries(a.texts)){need(typeof value==='string'&&path.length<=500,'Invalid package file');files[path]=value as string;}
 for(const path of Object.keys(a.images)){need(path.length<=500,'Invalid image path');files[path]='';}
 const pkg=readDeliveryPackage(files,typeof a.zip_name==='string'?a.zip_name:'delivery.zip',{imageInfo:a.images});
 const problems=await verifyChecksums(files,pkg,{skipImages:true});
 need(!problems.length,'The ZIP failed its checksum check: '+problems.slice(0,5).join('; '));
 return {pkg,fingerprint:await deliveryFingerprint(pkg)};
}
async function creativeProject(req:Request,u:string,p:any){
 need(validId(p),'Choose a world');await requireFolder(req,u,p);
 const loaded=await load(u,p);need(loaded.revision>0&&!loaded.m.deleted_at&&!loaded.m.system_pool,'Choose a creative world');
 need(!loaded.m.folder_lock,'That world is locked. Unlock it first.');
 return loaded;
}
const already=(m:any,fingerprint:string)=>Object.values(m.shot_lists||{}).find((l:any)=>l.source?.fingerprint===fingerprint) as any;

export async function POST(req:Request){
 if(!isTrustedOrigin(req))return Response.json({error:'Invalid origin'},{status:403});
 try{
  const u=await owner(req),a=JSON.parse((await readBounded(req,3_900_000)).toString('utf8'));
  if(a.action==='plan'){
   const {pkg,fingerprint}=await packageFrom(a),{m,revision}=await creativeProject(req,u,a.project_id);
   const dup=already(m,fingerprint);
   return Response.json({revision,duplicate:dup?{id:dup.id,name:dup.name}:null,summary:{project:pkg.project,generator:pkg.generator,created:pkg.created,shots:pkg.shots.length,images:pkg.images.length,partial:pkg.partial,missing:pkg.missing,warnings:pkg.warnings,oversize:pkg.images.filter((i:any)=>i.byte_size>MAX_IMAGE_BYTES).length}},{headers});
  }
  if(a.action==='image'){
   const {m,revision}=await creativeProject(req,u,a.project_id);
   need(a.expected_revision===revision,'This world changed during the upload. Import the ZIP again; finished images are kept.');
   need(typeof a.image_base64==='string'&&/^[A-Za-z0-9+/]+={0,2}$/.test(a.image_base64),'Invalid image data');
   need(typeof a.source_sha256==='string'&&/^[0-9a-f]{64}$/.test(a.source_sha256),'Missing original checksum');
   const name=typeof a.name==='string'&&a.name.trim()?a.name.trim().slice(0,200):'Delivery frame';
   const bytes=Buffer.from(a.image_base64,'base64'),mime=imageMime(bytes);
   need(mime&&mime===a.mime_type,'Only PNG, JPEG or WebP frames can be imported');need(bytes.length<=MAX_IMAGE_BYTES,'Frame is larger than 2.5 MB');
   const sha256=await sha256Hex(new Uint8Array(bytes)),transcoded=a.transcoded===true;
   // Untouched frames must match the delivery checksum exactly; re-encoded ones keep the original checksum for provenance.
   if(!transcoded)need(sha256===a.source_sha256,'Frame does not match its delivery checksum');
   const duplicate:any=Object.values(m.references||{}).find((r:any)=>r.content_sha256===sha256||(r.xce_source_sha256&&r.xce_source_sha256===a.source_sha256));
   if(duplicate)return Response.json({saved:false,reused:true,reference_id:duplicate.id,revision},{headers});
   const reference_id=referenceIdFor(m,'scenes_and_shots',name),key=`xce/${encodeURIComponent(u)}/${a.project_id}/${reference_id}-${crypto.randomUUID()}`;
   await backend().BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});
   const stored=await backend().BUCKET.get(key);need(stored,'Frame upload could not be read back');
   need(await sha256Hex(new Uint8Array(await stored.arrayBuffer()))===sha256,'Frame upload integrity check failed');
   const next=attachImage(m,{reference_id,key,name,mime_type:mime,size:bytes.length,sha256,category:'scenes_and_shots',asset_id:null});
   next.references[reference_id].xce_source_sha256=a.source_sha256;
   if(transcoded)next.references[reference_id].xce_transcoded=true;
   await save(u,a.project_id,next,revision);
   return Response.json({saved:true,reference_id,revision:revision+1},{headers});
  }
  if(a.action==='apply'){
   const {pkg,fingerprint}=await packageFrom(a),{m,revision}=await creativeProject(req,u,a.project_id);
   need(a.expected_revision===revision,'This world changed while importing. Import the ZIP again; finished images are kept.');
   const dup=already(m,fingerprint);need(!dup,'This delivery is already imported as “'+(dup?.name||'')+'”.');
   need(a.references&&typeof a.references==='object'&&!Array.isArray(a.references),'Missing frame references');
   const refs:Record<string,string>={};
   for(const img of pkg.images){const id=a.references[img.file];if(id===undefined)continue;need(typeof id==='string'&&m.references?.[id],'Frame '+img.file+' was not saved');refs[img.file]=id;}
   const missingFrames=pkg.images.filter((i:any)=>!refs[i.file]).map((i:any)=>i.shot_id+' '+i.role);
   need(!missingFrames.length||a.allow_partial===true,'Frames not uploaded: '+missingFrames.join(', '));
   const data=buildDeliveryShotList(pkg,refs,{name:typeof a.name==='string'?a.name.trim():'',fingerprint});
   const next=structuredClone(m),id=crypto.randomUUID();
   const result:any=manageShotList(next,{action:'save',id,data:{...data,sequence_id:id},project_id:a.project_id});
   await save(u,a.project_id,next,revision);
   return Response.json({saved:true,shot_list_id:id,name:result.record.name,shots:result.record.shots.length,missing_frames:missingFrames,revision:revision+1},{headers});
  }
  throw Error('Unknown import step');
 }catch(e){return Response.json({error:(e as Error).message},{status:400,headers})}
}
