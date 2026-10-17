import {localGet,localPut,localProjects,saveLocalProject,saveSyncProgress,scaffoldProject,readLocalImage} from './local-store.mjs';
let syncing=false;const pending=new Set();
const announce=message=>{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('xce-sync',{detail:message}));};
export async function timedFetch(url,options={}){const signal=options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(35000)]):AbortSignal.timeout(35000);return globalThis.fetch(url,{...options,signal});}
/** @returns {Promise<Response>} */
export async function studioFetch(input,options={}){
 const url=new URL(input,location.origin),method=(options.method||'GET').toUpperCase();
 if(url.pathname==='/api/projects'&&method==='POST'){
  const {name}=JSON.parse(options.body),p=await scaffoldProject(name);announce('Saved on this device · waiting to sync');void syncLocalProjects();return Response.json(p,{status:201});
 }
 if(method!=='GET'){
  if(!navigator.onLine)throw Error('You are offline. Your local draft is preserved; reconnect before this operation.');
  try{return await timedFetch(input,options)}catch(e){if(options.signal?.aborted)throw e;throw Error('Connection interrupted. Changes were not confirmed by the server; your draft is preserved.');}
 }
 const p=url.searchParams.get('project'),id=url.searchParams.get('file');
 if(p&&id?.startsWith('local-')){const image=await readLocalImage(p,id);if(image)return globalThis.fetch(image.data);}
 const draft=p?await localGet('project:'+p):null;
 if(url.pathname==='/api/manifest'&&!id&&draft&&draft.sync_status!=='synced')return Response.json(draft.manifest,{headers:{'X-Xstudio-Local':'pending'}});
 const cacheKey='response:'+url.pathname+url.search;
 let response;
 try{
  if(!navigator.onLine)throw Error('Offline');
  for(let attempt=0;attempt<2;attempt++){
   try{response=await timedFetch(input,options);if(response.status<500&&response.status!==429)break;}catch(error){if(options.signal?.aborted)throw error;if(attempt===1)throw error;}
   if(attempt===0)await new Promise(r=>setTimeout(r,400));
  }
  if(!response)throw Error('Connection unavailable');
  if([401,403,423].includes(response.status)){await localPut(cacheKey,null);announce(response.status===423?'Folder locked':'Sign in to reconnect');if(url.pathname==='/api/projects'){const local=await localProjects();if(local.length)return Response.json({projects:local,deleted_projects:[]},{headers:{'X-Xstudio-Local':'pending'}});}return response;}
  if(!response.ok) {if(response.status<500&&response.status!==429)return response;throw Error('Server unavailable');}
  if(response.headers.get('content-type')?.includes('application/json')){
   const data=await response.clone().json();
   if(url.pathname==='/api/projects'){
    const drafts=await localProjects();data.projects=[...(data.projects||[]).filter(x=>!drafts.some(d=>d.id===x.id&&d.sync_status!=='synced')),...drafts.filter(d=>d.sync_status!=='synced').map(({manifest,...d})=>d)];
   }
   if(response.headers.get('X-Xstudio-Offline')!=='disabled')await localPut(cacheKey,{data,saved_at:Date.now()});
   return Response.json(data,{headers:response.headers});
  }
  return response;
 }catch(error){
  if(options.signal?.aborted)throw error;
  const cached=await localGet(cacheKey);if(cached){pending.add(cacheKey);announce('Offline / connection unavailable · showing saved device data');return Response.json(cached.data,{headers:{'X-Xstudio-Local':'cached'}});}
  if(url.pathname==='/api/projects'){const drafts=await localProjects();announce('Local workspace · remote connection unavailable');return Response.json({projects:drafts,deleted_projects:[]},{headers:{'X-Xstudio-Local':'cached'}});}
  throw Error('Connection unavailable. This item has not been cached on this device yet.');
 }
}
export async function syncLocalProjects(){
 if(syncing||!navigator.onLine)return;syncing=true;
 try{for(const project of await localProjects()){
  if(project.sync_status!=='pending')continue;
  try{
   let current=await timedFetch('/api/manifest?project='+encodeURIComponent(project.id));
   if(!current.ok)throw Error('Sign in to sync this device');
   let remote=await current.json();
   if(!remote.revision){const r=await timedFetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project.id,name:project.title})});if(!r.ok&&r.status!==409)throw Error('Project sync is waiting for the server');current=await timedFetch('/api/manifest?project='+encodeURIComponent(project.id));if(!current.ok)throw Error('Project sync unavailable');remote=await current.json();project.base_revision=remote.revision;await saveSyncProgress(project,{base_revision:project.base_revision});}
   if(remote.world_sync_id===project.mutation_id){await saveSyncProgress(project,{manifest:remote,revision:remote.revision,base_revision:remote.revision,sync_status:'synced'});continue;}
   if(remote.revision!==project.base_revision){await saveSyncProgress(project,{sync_status:'conflict'});announce('Sync conflict: local draft preserved. Export it before merging with server changes.');continue;}
   for(const [id,ref] of Object.entries(project.manifest.references||{})){
    if(!ref.local||remote.references[id])continue;
    const image=await readLocalImage(project.id,id);if(!image)throw Error('Local anchor bytes missing; draft preserved');
    const blob=await (await globalThis.fetch(image.data)).blob(),form=new FormData();form.set('file',blob,image.name);form.set('project_id',project.id);form.set('reference_id',id);form.set('asset_name',image.name);form.set('role',ref.role||'IDENTITY');
    const upload=await timedFetch('/api/upload',{method:'POST',body:form});if(!upload.ok)throw Error('Anchor upload interrupted; draft preserved');const result=await upload.json();project.base_revision=result.revision;await saveSyncProgress(project,{base_revision:project.base_revision});
   }
   const result=await timedFetch('/api/world',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project.id,world_library:project.manifest.world_library,expected_revision:project.base_revision,mutation_id:project.mutation_id})});
   if(result.status===409){await saveSyncProgress(project,{sync_status:'conflict'});announce('Sync conflict: your local version is preserved.');continue;}
   if(!result.ok)throw Error((await result.json()).error||'Sync pending');
   const saved=await result.json();const latest=await localGet('project:'+project.id);
   if(latest.mutation_id!==project.mutation_id){await saveSyncProgress(project,{base_revision:saved.revision});continue;}
   const state=await timedFetch('/api/manifest?project='+encodeURIComponent(project.id));if(!state.ok)throw Error('Save succeeded; refreshing the local copy');remote=await state.json();await saveSyncProgress(project,{manifest:remote,revision:remote.revision,base_revision:remote.revision,sync_status:'synced'});announce('Synced to Xstudio');window.dispatchEvent(new Event('xce-synced'));
  }catch(error){announce(error.message||'Saved on device · sync pending');}
 }}finally{syncing=false;}
}
