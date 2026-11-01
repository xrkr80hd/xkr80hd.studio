'use client';
// Upload a world ZIP (from xce_world_builder `fin`, an XSTUDIO export, or plain folders).
// One job: pick a ZIP, see where it goes, import it. Saved text is kept unless you tick "Use the ZIP version".
import {useRef,useState} from 'react';
import {unzipSync} from 'fflate';
import {Upload,Check,X} from 'lucide-react';
import {readPackage,MAX_IMAGE_BYTES} from '../lib/xce/world-package-read.mjs';
import {studioFetch} from '../lib/xce/studio-network.mjs';

const TEXT_FILE=/\.(json|md|txt)$/i;

async function post(body:any){const r=await studioFetch('/api/world-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j:any=await r.json();if(!r.ok)throw Error(j.error||'Import failed');return j;}
function base64(bytes:Uint8Array){let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s);}
// Shrinks an oversized image to JPEG under the 2.5 MB limit. Never crops.
async function fitImage(bytes:Uint8Array,mime:string):Promise<{bytes:Uint8Array,mime:string}>{
 if(bytes.length<=MAX_IMAGE_BYTES)return {bytes,mime};
 const bitmap=await createImageBitmap(new Blob([bytes as BlobPart],{type:mime}));
 for(let scale=1;scale>0.3;scale*=0.85){const c=document.createElement('canvas');c.width=Math.round(bitmap.width*scale);c.height=Math.round(bitmap.height*scale);c.getContext('2d')!.drawImage(bitmap,0,0,c.width,c.height);
  const blob:Blob=await new Promise(res=>c.toBlob(b=>res(b!),'image/jpeg',0.9));if(blob.size<=MAX_IMAGE_BYTES)return {bytes:new Uint8Array(await blob.arrayBuffer()),mime:'image/jpeg'};}
 throw Error('An image is too large to import even after shrinking');
}

// createNew: always make a new world from the ZIP (used by the New world window).
export default function WorldImport({project,createNew=false,onDone}:{project?:string,createNew?:boolean,onDone:(projectId:string)=>void|Promise<void>}){
 const input=useRef<HTMLInputElement>(null);
 const [zip,setZip]=useState<any>(null),[review,setReview]=useState<any>(null),[choices,setChoices]=useState<Record<string,'zip'|'keep'>>({}),[chosen,setChosen]=useState(''),[newWorld,setNewWorld]=useState(createNew),[newName,setNewName]=useState('');
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[done,setDone]=useState<any>(null);
 const request=(files:Record<string,Uint8Array>,pkg:any,name:string)=>({zip_name:name,texts:Object.fromEntries(Object.entries(files).filter(([p,b])=>TEXT_FILE.test(p)&&b.length<2_000_000).map(([p,b])=>[p,new TextDecoder().decode(b)])),images:Object.fromEntries(pkg.images.map((i:any)=>[i.file,{mime_type:i.mime_type,byte_size:i.byte_size}]))});

 async function open(file:File){
  setError('');setDone(null);setReview(null);setChoices({});setBusy('Reading your ZIP…');
  try{
   if(file.size>300*1024*1024)throw Error('Choose a ZIP under 300 MB');
   const files=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:f=>!f.name.endsWith('/')});
   const pkg=readPackage(files,file.name),body=request(files,pkg,file.name),wantNew=newWorld||pkg.world_mode==='new';setNewWorld(wantNew);
   const plan=await post({action:'plan',...body,project_id:project||null,create_new:wantNew,new_name:wantNew?newName:''});
   setZip({files,pkg,body,name:file.name});setReview(plan);setChosen(plan.world.project_id||'');if(wantNew&&!newName)setNewName(plan.world.name);
  }catch(e){setError((e as Error).message)}finally{setBusy('')}
 }
 async function replan(next:{id?:string,create?:boolean,name?:string}){const id=next.id??chosen,create=next.create??newWorld,name=next.name??newName;setChosen(id);setNewWorld(create);setBusy('Checking that world…');setError('');
  try{const plan=await post({action:'plan',...zip.body,project_id:id||null,create_new:create,new_name:create?name:''});setReview(plan);setChoices({});if(create)setNewName(plan.world.name)}catch(e){setError((e as Error).message)}finally{setBusy('')}}
 const changeWorld=(id:string)=>replan({id});
 async function importWorld(){
  setError('');setBusy('Saving records…');
  try{
   const saved=await post({action:'apply',...zip.body,project_id:newWorld?null:chosen||null,create_new:newWorld,new_name:newWorld?newName:'',expected_revision:review.revision,choices});
   let revision=saved.revision,uploaded=0,reused=0;const failed:string[]=[];const images=zip.pkg.images;
   for(const [n,img] of images.entries()){
    setBusy('Uploading images '+(n+1)+' of '+images.length+'…');
    try{const fitted=await fitImage(zip.files[img.file],img.mime_type);const asset=zip.pkg.assets.find((a:any)=>a.key===img.asset_key);
     const r=await post({action:'image',project_id:saved.project_id,expected_revision:revision,asset_id:img.asset_key?saved.id_map[img.asset_key]||null:null,category:img.category,name:asset?.name||img.file.split('/').pop().replace(/\.[^.]+$/,''),mime_type:fitted.mime,image_base64:base64(fitted.bytes)});
     revision=r.revision;if(r.reused)reused++;else uploaded++;}
    catch(e){failed.push(img.file.split('/').pop()+': '+(e as Error).message);if(/changed/.test((e as Error).message))break;}
   }
   setDone({...saved,uploaded,reused,failed,total:images.length});setReview(null);await onDone(saved.project_id);
  }catch(e){setError((e as Error).message)}finally{setBusy('')}
 }
 const conflicts=review?[...review.plan.world.filter((w:any)=>w.action==='conflict').map((w:any)=>({key:'world:'+w.field,label:w.label,saved:w.saved,incoming:w.incoming})),...review.plan.assets.flatMap((a:any)=>a.details.filter((d:any)=>d.action==='conflict').map((d:any)=>({key:'asset:'+a.key+':'+d.field,label:a.name+' — '+d.field.replaceAll('_',' '),saved:d.saved,incoming:d.incoming})))]:[];
 const counts=review?{create:review.plan.assets.filter((a:any)=>a.action==='create').length,update:review.plan.assets.filter((a:any)=>a.action==='update').length}:null;
 const worldName=review?.world.name||'';

 return <section className="panel world-import" aria-labelledby="world-import-title">
  <div className="accordion-content">
   <h3 id="world-import-title">{createNew?'Create a world from a ZIP':'Upload world ZIP'}</h3>
   <p className="step-description">{createNew?'Choose the ZIP from fin. XSTUDIO makes a new world and sorts everything into it.':<>Drop in the ZIP from <code>fin</code>. XSTUDIO puts everything in the right world.</>}</p>
   <input ref={input} type="file" accept=".zip,application/zip" hidden aria-label="Choose world ZIP" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void open(f)}}/>
    {!review&&<button type="button" className="button secondary" disabled={!!busy} onClick={()=>input.current?.click()}><Upload size={16}/>{busy||'Choose ZIP'}</button>}
   {error&&<p role="alert" className="error-text">{error}</p>}
   {review&&<div className="world-import-review">
    <p><strong>Goes to: {worldName}</strong> <span className="count">{review.world.mode==='create'?'New world':'Existing world'}</span></p>
    <small>{review.world.reason}{review.world.mismatch?'. This ZIP was made for a different world. Check before importing.':''}</small>
    <label className="checkbox-choice"><input type="checkbox" checked={newWorld} disabled={!!busy} onChange={e=>void replan({create:e.target.checked,name:e.target.checked?(newName||zip.pkg.world_name||''):''})}/><span>Make a new world from this ZIP<small>Leave this off to add to the matching world.</small></span></label>
    {newWorld&&<label>New world name<input value={newName} maxLength={200} disabled={!!busy} onChange={e=>setNewName(e.target.value)} onBlur={()=>void replan({name:newName})}/></label>}
    {!newWorld&&(review.world.mode==='ambiguous'||review.world.mismatch)&&<label>Choose the world<select value={chosen} onChange={e=>void changeWorld(e.target.value)}><option value="">Create a new world</option>{review.worlds.map((p:any)=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>}
    <ul className="world-import-counts">
     <li>{counts!.create} new · {counts!.update} updated assets</li>
     <li>{review.plan.images} images{review.plan.unsorted_images?' ('+review.plan.unsorted_images+' go to Unassigned uploads)':''}</li>
     {review.plan.world.filter((w:any)=>w.action==='fill').length>0&&<li>World Builder: {review.plan.world.filter((w:any)=>w.action==='fill').map((w:any)=>w.label).join(', ')}</li>}
     {review.plan.too_large.length>0&&<li>{review.plan.too_large.length} large images will be shrunk to fit (not cropped)</li>}
    </ul>
    {conflicts.length>0&&<details className="form-accordion" open><summary>{conflicts.length} already saved with different text. Saved text is kept.</summary>
     {conflicts.map(c=><label key={c.key} className="checkbox-choice"><input type="checkbox" checked={choices[c.key]==='zip'} onChange={e=>setChoices(v=>({...v,[c.key]:e.target.checked?'zip':'keep'}))}/><span>Use the ZIP version: {c.label}<small>Saved: {c.saved.slice(0,140)}{c.saved.length>140?'…':''}<br/>ZIP: {c.incoming.slice(0,140)}{c.incoming.length>140?'…':''}</small></span></label>)}
    </details>}
    {review.warnings.length>0&&<details className="form-accordion"><summary>{review.warnings.length} notes</summary><ul>{review.warnings.map((w:string,i:number)=><li key={i}><small>{w}</small></li>)}</ul></details>}
    <div className="button-row"><button type="button" className="button primary" disabled={!!busy||review.world.mode==='ambiguous'&&!chosen} onClick={()=>void importWorld()}><Check size={16}/>{busy||'Import into '+(review.world.mode==='create'&&!chosen?'new world':worldName)}</button><button type="button" className="button secondary" disabled={!!busy} onClick={()=>{setReview(null);setZip(null)}}><X size={16}/>Cancel</button></div>
   </div>}
   {done&&<div className="notice" role="status"><Check size={16}/><span>Imported into <strong>{done.name}</strong>: {done.report.created.length} new, {done.report.updated.length} updated, {done.uploaded} images{done.reused?' ('+done.reused+' already there)':''}.{done.report.kept.length?' Kept saved text for '+done.report.kept.length+'.':''}{done.failed.length?' '+done.failed.length+' images did not upload: '+done.failed.join('; '):''}</span></div>}
  </div>
 </section>;
}
