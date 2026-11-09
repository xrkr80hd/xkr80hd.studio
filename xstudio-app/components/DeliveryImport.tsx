'use client';
// Import an XCE Studios v3.0 delivery ZIP as a new shot list: pick the ZIP, check it, import it.
import {useRef,useState} from 'react';
import {unzipSync} from 'fflate';
import {Upload,Check,X,Copy} from 'lucide-react';
import {readDeliveryPackage,verifyChecksums,isDeliveryZip} from '../lib/xce/delivery-package.mjs';
import {MAX_IMAGE_BYTES} from '../lib/xce/world-package-read.mjs';
import {studioFetch} from '../lib/xce/studio-network.mjs';
import PreviewImage from './PreviewImage';

const TEXT_FILE=/\.(json|txt|md)$/i;
async function post(body:any){const r=await studioFetch('/api/delivery-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j:any=await r.json();if(!r.ok)throw Error(j.error||'Import failed');return j;}
function base64(bytes:Uint8Array){let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s);}
// Keeps full resolution: re-encodes to WebP, then JPEG; scales down only as a last resort. Never crops.
async function fitFrame(bytes:Uint8Array,mime:string):Promise<{bytes:Uint8Array,mime:string,transcoded:boolean}>{
 if(bytes.length<=MAX_IMAGE_BYTES)return {bytes,mime,transcoded:false};
 const bitmap=await createImageBitmap(new Blob([bytes as BlobPart],{type:mime}));
 const encode=async(scale:number,type:string,quality:number)=>{const c=document.createElement('canvas');c.width=Math.round(bitmap.width*scale);c.height=Math.round(bitmap.height*scale);c.getContext('2d')!.drawImage(bitmap,0,0,c.width,c.height);const blob:Blob|null=await new Promise(res=>c.toBlob(res,type,quality));return blob&&blob.type===type&&blob.size<=MAX_IMAGE_BYTES?new Uint8Array(await blob.arrayBuffer()):null;};
 for(const [type,quality] of [['image/webp',0.95],['image/webp',0.9],['image/jpeg',0.92]] as const){const out=await encode(1,type,quality);if(out)return {bytes:out,mime:type,transcoded:true};}
 for(let scale=0.85;scale>0.4;scale*=0.85){const out=await encode(scale,'image/jpeg',0.9);if(out)return {bytes:out,mime:'image/jpeg',transcoded:true};}
 throw Error('A frame is too large to import even after re-encoding');
}

export default function DeliveryImport({project,onDone}:{project:string,onDone:()=>void|Promise<void>}){
 const input=useRef<HTMLInputElement>(null);
 const [zip,setZip]=useState<any>(null),[review,setReview]=useState<any>(null),[name,setName]=useState(''),[allowPartial,setAllowPartial]=useState(false);
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[done,setDone]=useState<any>(null);
 const body=(z:any)=>({zip_name:z.name,project_id:project,texts:z.texts,images:Object.fromEntries(z.pkg.images.map((i:any)=>[i.file,{mime_type:i.mime_type,byte_size:i.byte_size}]))});

 async function open(file:File){
  setError('');setDone(null);setReview(null);setBusy('Reading your ZIP…');
  try{
   if(file.size>300*1024*1024)throw Error('Choose a ZIP under 300 MB');
   const files=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:f=>!f.name.endsWith('/')});
   if(!isDeliveryZip(Object.keys(files)))throw Error('This is not an XCE Studios v3 delivery ZIP. World ZIPs go in Upload world ZIP.');
   const pkg=readDeliveryPackage(files,file.name);
   setBusy('Checking every file against its checksum…');
   const problems=await verifyChecksums(files,pkg);
   if(problems.length)throw Error('The ZIP is damaged or was edited: '+problems.slice(0,5).join('; ')+(problems.length>5?' …':''));
   const texts=Object.fromEntries(Object.entries(files).filter(([p,b])=>TEXT_FILE.test(p)&&!p.includes('/grids/')&&!p.startsWith('grids/')&&b.length<200_000).map(([p,b])=>[p,new TextDecoder().decode(b)]));
   const z={files,pkg,texts,name:file.name};
   const plan=await post({action:'plan',...body(z)});
   setZip(z);setReview(plan);setName((pkg.project||'Delivery')+' · v3 delivery');setAllowPartial(false);
  }catch(e){setError((e as Error).message)}finally{setBusy('');if(input.current)input.current.value=''}
 }
 async function importDelivery(){
  setError('');
  try{
   let revision=review.revision,uploaded=0,reused=0,transcoded=0;const references:Record<string,string>={},failed:string[]=[];
   for(const [n,img] of zip.pkg.images.entries()){
    setBusy('Uploading frames '+(n+1)+' of '+zip.pkg.images.length+'…');
    try{const fitted=await fitFrame(zip.files[img.file],img.mime_type);
     const r=await post({action:'image',project_id:project,expected_revision:revision,name:img.shot_id+' '+(img.role==='FF'?'first frame':'last frame'),mime_type:fitted.mime,image_base64:base64(fitted.bytes),source_sha256:img.sha256,transcoded:fitted.transcoded});
     revision=r.revision;references[img.file]=r.reference_id;if(r.reused)reused++;else uploaded++;if(fitted.transcoded)transcoded++;}
    catch(e){failed.push(img.shot_id+' '+img.role+': '+(e as Error).message);if(/changed/.test((e as Error).message))break;}
   }
   if(failed.length&&!allowPartial)throw Error('Some frames did not upload ('+failed.length+'). Finished frames are kept; tick "Import what uploaded" or try again. '+failed.slice(0,3).join('; '));
   setBusy('Saving the shot list…');
   const saved=await post({action:'apply',...body(zip),expected_revision:revision,references,name,allow_partial:allowPartial});
   setDone({...saved,uploaded,reused,transcoded,failed});setReview(null);setZip(null);await onDone();
  }catch(e){setError((e as Error).message)}finally{setBusy('')}
 }
 const s=review?.summary;
 return <section className="panel world-import" aria-labelledby="delivery-import-title">
  <div className="button-row"><h3 id="delivery-import-title">Import v3 delivery ZIP</h3>
   <button type="button" className="button secondary" disabled={!!busy} onClick={()=>input.current?.click()}><Upload size={16}/>Choose ZIP</button>
   <input ref={input} type="file" accept=".zip,application/zip" hidden aria-label="Choose an XCE Studios delivery ZIP" onChange={e=>{const f=e.target.files?.[0];if(f)open(f)}}/></div>
  <p className="world-import-hint">The per-shot first/last-frame ZIP from XCE Studios. Every file is checked before anything is saved; it becomes a new shot list.</p>
  {review&&<div className="world-import-review">
   {review.duplicate&&<p role="alert" className="error-text">This delivery is already imported as “{review.duplicate.name}”.</p>}
   <ul className="world-import-counts"><li>{s.shots} shots · {s.images} frames</li>{s.project&&<li>Production: {s.project}</li>}{s.generator&&<li>Made for {s.generator}</li>}{s.oversize>0&&<li>{s.oversize} frames over 2.5 MB will be re-encoded at full size</li>}</ul>
   {s.missing.length>0&&<p className="error-text">Missing: {s.missing.join(', ')}</p>}
   {s.warnings.length>0&&<details><summary>{s.warnings.length} notes</summary><ul>{s.warnings.map((w:string)=><li key={w}>{w}</li>)}</ul></details>}
   <label htmlFor="delivery-list-name">Shot list name</label><input id="delivery-list-name" value={name} maxLength={200} onChange={e=>setName(e.target.value)}/>
   {s.partial&&<label className="checkbox"><input type="checkbox" checked={allowPartial} onChange={e=>setAllowPartial(e.target.checked)}/>Import what uploaded (partial delivery)</label>}
   <div className="button-row"><button className="button primary" disabled={!!busy||!!review.duplicate||!name.trim()||(s.partial&&!allowPartial)} onClick={importDelivery}><Check size={16}/>Import {s.shots} shots</button><button className="button secondary" disabled={!!busy} onClick={()=>{setReview(null);setZip(null)}}><X size={16}/>Cancel</button></div>
  </div>}
  {busy&&<p className="world-import-status" role="status" aria-live="polite">{busy}</p>}
  {error&&<p className="world-import-status error-text" role="alert">{error}</p>}
  {done&&<p className="world-import-status" role="status">Imported “{done.name}”: {done.shots} shots, {done.uploaded} new frames{done.reused?', '+done.reused+' already saved':''}{done.transcoded?', '+done.transcoded+' re-encoded':''}.{done.failed.length?' Not uploaded: '+done.failed.join('; '):''} Shots start unapproved.</p>}
 </section>;
}

// Read-only first/last-frame view for an imported delivery shot list.
export function DeliveryShots({list,image}:{list:any,image:(id:string)=>string}){
 const [copied,setCopied]=useState('');
 async function copy(id:string,text:string){try{await navigator.clipboard.writeText(text);setCopied(id);setTimeout(()=>setCopied(''),1500)}catch{}}
 const shots=[...list.shots].filter((s:any)=>s.xce_v3).sort((a:any,b:any)=>a.xce_v3.order-b.xce_v3.order);
 if(!shots.length)return null;
 return <section className="panel delivery-shots" aria-label="First and last frames">
  <h4>First / last frames · {list.source?.generator||'image-to-video'}</h4>
  {shots.map((s:any)=><article key={s.id} className="delivery-shot">
   <strong>{s.xce_v3.shot_id}</strong><small> {s.xce_v3.scene_id} · {s.panel.duration}s</small>
   <div className="delivery-pair">{[['First frame',s.xce_v3.first_frame_reference_id],['Last frame',s.xce_v3.last_frame_reference_id]].map(([label,id])=><figure key={label}>{id?<PreviewImage thumbnail src={image(id)} alt={s.xce_v3.shot_id+' '+label}/>:<span className="flow-placeholder">Missing</span>}<figcaption>{label}</figcaption></figure>)}</div>
   {s.xce_v3.animation_prompt&&<button type="button" className="button secondary" onClick={()=>copy(s.id,s.xce_v3.animation_prompt)}><Copy size={14}/>{copied===s.id?'Copied':'Copy animation prompt'}</button>}
  </article>)}
 </section>;
}
