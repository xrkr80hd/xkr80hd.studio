// Upload a world ZIP (xce_world_builder `fin`, an XSTUDIO world export, or plain folders).
// The browser opens the ZIP and sends: plan → apply (records, one save) → image (one per call).
// Merge only: never deletes, never locks, keeps saved text unless the owner picks the ZIP version.
import {owner,load,save,requireFolder,backend,call} from '../../../lib/xce/server';
import {isTrustedOrigin} from '../../../lib/xstudio-validation.mjs';
import {readBounded} from '../../../lib/xstudio-providers.mjs';
import {readPackage,resolveWorld,planImport,applyRecords,attachImage,referenceIdFor,imageMime,MAX_IMAGE_BYTES,PACKAGE_CATEGORIES} from '../../../lib/xce/world-package.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store'};
const need=(ok:any,message:string)=>{if(!ok)throw Error(message);};
const validId=(v:any)=>typeof v==='string'&&/^[-\w]{1,80}$/.test(v);

async function projectList(u:string){
 const rows=await backend().DB.prepare('SELECT project, revision, manifest FROM xce_projects WHERE owner=? ORDER BY project').bind(u).all();
 return rows.results.flatMap((r:any)=>{const m=JSON.parse(r.manifest);return m.deleted_at?[]:[{id:r.project,title:m.campaign_name||r.project,revision:r.revision,system_pool:Boolean(m.system_pool),folder_locked:Boolean(m.folder_lock)}]});
}
// Text files only; images are described by type and size and uploaded separately.
function packageFrom(a:any){
 need(a.texts&&typeof a.texts==='object'&&!Array.isArray(a.texts),'Missing package files');
 need(a.images&&typeof a.images==='object'&&!Array.isArray(a.images),'Missing image list');
 const files:Record<string,Uint8Array>={};
 for(const [path,value] of Object.entries(a.texts)){need(typeof value==='string'&&path.length<=500,'Invalid package file');files[path]=new TextEncoder().encode(value as string);}
 for(const path of Object.keys(a.images)){need(path.length<=500,'Invalid image path');files[path]=new Uint8Array(0);}
 return readPackage(files,typeof a.zip_name==='string'?a.zip_name.slice(0,200):'world.zip',{imageInfo:a.images});
}
async function target(u:string,req:Request,pkg:any,chosen:string|null,a:any={}){
 // A fin ZIP made with `nw` asks for a new world unless the owner unticks it.
 const createNew=a.create_new===true||(a.create_new===undefined&&pkg.world_mode==='new'),name=typeof a.new_name==='string'?a.new_name.slice(0,200):'';
 const projects=await projectList(u),world=resolveWorld(projects,pkg,createNew?null:chosen,{createNew,name});
 if(world.project_id){const p=projects.find(x=>x.id===world.project_id)!;need(!p.folder_locked,'That world is locked. Unlock it first.');await requireFolder(req,u,world.project_id);}
 return world;
}

export async function POST(req:Request){
 if(!isTrustedOrigin(req))return Response.json({error:'Invalid origin'},{status:403});
 try{
  const u=await owner(req),a=JSON.parse((await readBounded(req,3_900_000)).toString('utf8'));
  if(a.action==='plan'){
   const pkg=packageFrom(a),world=await target(u,req,pkg,validId(a.project_id)?a.project_id:null,a);
   const saved=world.project_id?await load(u,world.project_id):null;
   if(saved)need(!saved.m.system_pool,'Choose a creative world');
   const worlds=(await projectList(u)).filter(p=>!p.system_pool&&!p.folder_locked).map(p=>({id:p.id,title:p.title}));
   return Response.json({world,worlds,revision:saved?.revision??0,plan:planImport(saved?.m||null,pkg),warnings:pkg.warnings,source:pkg.source},{headers});
  }
  if(a.action==='apply'){
   const pkg=packageFrom(a);let world=await target(u,req,pkg,validId(a.project_id)?a.project_id:null,a);
   need(world.mode!=='ambiguous','More than one world has this name. Choose which one.');
   if(world.mode==='create'){const created=JSON.parse((await call('create_project',{name:world.name},u,req)).content[0].text);world={...world,mode:'existing',project_id:created.project_id,name:created.name};}
   const p=world.project_id!,{m,revision}=await load(u,p);need(revision>0&&!m.deleted_at&&!m.system_pool,'Choose a creative world');
   if(a.expected_revision!==undefined&&a.expected_revision!==0)need(a.expected_revision===revision,'This world changed while you were reviewing. Upload the ZIP again.');
   const choices=a.choices&&typeof a.choices==='object'?Object.fromEntries(Object.entries(a.choices).filter(([,v])=>v==='zip'||v==='keep')):{};
   const result=applyRecords(m,pkg,{project_id:p,revision,choices});
   await save(u,p,result.manifest,revision);
   return Response.json({saved:true,project_id:p,name:world.name,revision:revision+1,id_map:result.id_map,report:result.report},{headers});
  }
  if(a.action==='image'){
   need(validId(a.project_id),'Choose a world');await requireFolder(req,u,a.project_id);
   need(a.category===null||PACKAGE_CATEGORIES.includes(a.category),'Unknown image category');
   need(a.asset_id===null||(typeof a.asset_id==='string'&&/^[\w-]{1,128}$/.test(a.asset_id)),'Invalid asset');
   const name=typeof a.name==='string'&&a.name.trim()?a.name.trim().slice(0,200):'Imported image';
   need(typeof a.image_base64==='string'&&/^[A-Za-z0-9+/]+={0,2}$/.test(a.image_base64),'Invalid image data');
   const bytes=Buffer.from(a.image_base64,'base64'),mime=imageMime(bytes);
   need(mime&&mime===a.mime_type,'Only PNG, JPEG or WebP images can be imported');need(bytes.length<=MAX_IMAGE_BYTES,'Image is larger than 2.5 MB');
   const {m,revision}=await load(u,a.project_id);need(revision>0&&!m.deleted_at&&!m.system_pool,'Choose a creative world');
   need(a.expected_revision===revision,'This world changed during the upload. Upload the ZIP again; finished images are kept.');
   const sha256=Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
   const duplicate:any=Object.values(m.references||{}).find((r:any)=>r.content_sha256===sha256&&r.imported_from_package);
   if(duplicate)return Response.json({saved:false,reused:true,reference_id:duplicate.id,revision},{headers});
   const reference_id=referenceIdFor(m,a.category,name),key=`xce/${encodeURIComponent(u)}/${a.project_id}/${reference_id}-${crypto.randomUUID()}`;
   await backend().BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});
   const stored=await backend().BUCKET.get(key);need(stored,'Image upload could not be read back');
   need(Buffer.from(await crypto.subtle.digest('SHA-256',await stored.arrayBuffer())).toString('hex')===sha256,'Image upload integrity check failed');
   const next=attachImage(m,{reference_id,key,name,mime_type:mime,size:bytes.length,sha256,category:a.category,asset_id:a.asset_id});
   await save(u,a.project_id,next,revision);
   return Response.json({saved:true,reference_id,revision:revision+1},{headers});
  }
  throw Error('Unknown import step');
 }catch(e){const error=(e as Error).message;return Response.json({error},{status:/owner|Sign in/.test(error)?401:/locked/i.test(error)?423:/changed/.test(error)?409:400,headers});}
}
