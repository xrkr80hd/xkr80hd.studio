const ID=/^[a-zA-Z0-9_-]{1,80}$/;
const FILE_BUCKET='xstudio-engine-files';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const check=(ok,message)=>{if(!ok)throw Error(message)};
export async function engine(request,admin,token){
 const body=await request.text();check(body.length<=9_000_000,'Engine request too large');
 const a=JSON.parse(body);const owner=token.owner_id;
 const projects=()=>admin.from('xstudio_engine_projects');
 const context=()=>admin.from('xstudio_engine_context');
 const codes=()=>admin.from('xstudio_engine_codes');
 const files=()=>admin.from('xstudio_engine_files');
 const readOnly=['projects','load','context','code','file_get','file_head'].includes(a.op);
 check(token.scopes.includes(readOnly?'asset:read':'asset:write'),'Scope required');
 if(a.project!==undefined)check(ID.test(a.project),'Invalid project');
 let result;
 if(a.op==='projects')result=await projects().select('project,revision,manifest').eq('owner_id',owner).order('project').limit(1000);
 else if(a.op==='load')result=await projects().select('manifest,revision').eq('owner_id',owner).eq('project',a.project).maybeSingle();
 else if(a.op==='save'){
  check(typeof a.manifest==='string'&&a.manifest.length<1_900_000&&Number.isInteger(a.revision)&&a.revision>=0,'Invalid manifest');JSON.parse(a.manifest);
  result=a.revision===0?await projects().insert({owner_id:owner,project:a.project,revision:1,manifest:a.manifest}).select('project'):
   await projects().update({manifest:a.manifest,revision:a.revision+1}).eq('owner_id',owner).eq('project',a.project).eq('revision',a.revision).select('project');
  if(result.error?.code==='23505')return reply({changes:0});
  if(!result.error)return reply({changes:result.data.length});
 }
 else if(a.op==='context')result=await context().select('project,project_order,legacy_imported').eq('owner_id',owner).maybeSingle();
 else if(a.op==='context_save'){
  const row={owner_id:owner};if(a.project!==undefined)row.project=a.project;
  if(a.project_order!==undefined){check(Array.isArray(a.project_order)&&a.project_order.length<=1000&&a.project_order.every(x=>ID.test(x)),'Invalid order');row.project_order=a.project_order;}
  if(a.legacy_imported===true)row.legacy_imported=true;
  const existing=await context().select('owner_id').eq('owner_id',owner).maybeSingle();check(!existing.error,'Context lookup failed');
  result=existing.data?await context().update(row).eq('owner_id',owner).select('owner_id'):await context().insert(row).select('owner_id');
  if(result.error?.code==='23505')result=await context().update(row).eq('owner_id',owner).select('owner_id');
 }
 else if(a.op==='code')result=await codes().select('code').eq('owner_id',owner).eq('project',a.project).maybeSingle();
 else if(a.op==='reserve_code'){
  check(/^[A-Z0-9]{2,4}$/.test(a.code),'Invalid project code');result=await codes().insert({owner_id:owner,project:a.project,code:a.code});
  if(result.error?.code==='23505')return reply({reserved:false});
 }
 else if(a.op==='file_put'){
  check(typeof a.key==='string'&&a.key.startsWith('xce/')&&a.key.length<=1000,'Invalid file key');
  check(['image/png','image/jpeg','image/webp','image/svg+xml'].includes(a.mime_type),'Invalid file MIME');
  check(typeof a.base64==='string'&&/^[A-Za-z0-9+/]+={0,2}$/.test(a.base64),'Invalid file bytes');
  const bytes=Uint8Array.from(atob(a.base64),c=>c.charCodeAt(0));check(bytes.length>0&&bytes.length<=6*1024*1024,'Engine file exceeds 6 MB');
  const path=owner+'/'+crypto.randomUUID();
  const bucket=a.mime_type==='image/svg+xml'?FILE_BUCKET:'xstudio-assets';
  const upload=await admin.storage.from(bucket).upload(path,bytes,{contentType:a.mime_type,upsert:false});check(!upload.error,'Engine storage failed');
  result=await files().insert({owner_id:owner,object_key:a.key,storage_bucket:bucket,storage_path:path,mime_type:a.mime_type,byte_size:bytes.length});
  if(result.error){await admin.storage.from(bucket).remove([path]);check(false,'Engine file metadata failed');}
  if(bucket==='xstudio-assets'&&a.library_visible!==false){const name=typeof a.name==='string'&&a.name.trim()?a.name.trim().slice(0,512):a.key.split('/').pop();const mirror=await admin.from('xstudio_assets').insert({owner_id:owner,kind:'image',name,mime_type:a.mime_type,byte_size:bytes.length,storage_path:path,source_provider:token.provider,status:'ready'});check(!mirror.error,'Engine file saved but library listing failed');}
  return reply({saved:true});
 }
 else if(a.op==='file_delete'){
  check(typeof a.key==='string'&&a.key.startsWith('xce/')&&a.key.length<=1000,'Invalid file key');
  const prior=await files().select('storage_bucket,storage_path').eq('owner_id',owner).eq('object_key',a.key).maybeSingle();check(!prior.error,'File lookup failed');
  if(prior.data){const file=prior.data;const removal=await admin.storage.from(file.storage_bucket).remove([file.storage_path]);check(!removal.error,'File removal failed');const mirror=await admin.from('xstudio_assets').delete().eq('owner_id',owner).eq('storage_path',file.storage_path);check(!mirror.error,'Library removal failed');result=await files().delete().eq('owner_id',owner).eq('object_key',a.key);check(!result.error,'File record removal failed');}
  return reply({deleted:true});
 }
 else if(a.op==='file_get'||a.op==='file_head'){
  check(typeof a.key==='string'&&a.key.length<=1000,'Invalid file key');
  result=await files().select('storage_bucket,storage_path,mime_type,byte_size').eq('owner_id',owner).eq('object_key',a.key).maybeSingle();
  check(!result.error,'Engine file lookup failed');if(!result.data)return reply({file:null});
  const file=result.data;
  const signed=await admin.storage.from(file.storage_bucket).createSignedUrl(file.storage_path,60);check(!signed.error,'Engine file download failed');
  return reply({file:{mime_type:file.mime_type,size:file.byte_size,...(a.op==='file_get'?{url:signed.data.signedUrl}:{})}});
 }
 else throw Error('Unknown engine operation');
 check(!result?.error,'Engine database operation failed');return reply({data:result?.data??null});
}
