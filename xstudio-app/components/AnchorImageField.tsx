'use client';
import {useRef,useState} from 'react';
import PreviewImage from './PreviewImage';
import ReferenceThumbnail from './ReferenceThumbnail';
import AnchorCropper from './AnchorCropper';
import {studioFetch} from '../lib/xce/studio-network.mjs';
export default function AnchorImageField({label,project,value,references,disabled,onSelect,onFile}:{label:string,project:string,value:string,references:any[],disabled:boolean,onSelect:(id:string)=>void,onFile:(file:File)=>Promise<void>}){
 const input=useRef<HTMLInputElement>(null),[choosing,setChoosing]=useState(false),[crop,setCrop]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const image=(id:string)=>'/api/manifest?project='+encodeURIComponent(project)+'&file='+encodeURIComponent(id);
 async function cropSelected(){if(!value)return;setBusy(true);setError('');try{const r=await studioFetch(image(value));if(!r.ok)throw Error('Cannot open this reference. Unlock the project or sign in and retry.');const blob=await r.blob();if(!['image/png','image/jpeg','image/webp'].includes(blob.type))throw Error('This reference is not a supported image');setCrop(new File([blob],references.find(r=>r.id===value)?.name||'anchor.png',{type:blob.type}));}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="anchor-image-field" aria-label={label}><figure className="anchor-image-summary">{value?<div className="anchor-image-preview"><ReferenceThumbnail src={image(value)} label={label}/></div>:<span className="anchor-image-empty">No image selected</span>}<figcaption>{label}</figcaption></figure><details className="anchor-image-controls"><summary>{value?'Change / crop image':'Choose image'}</summary>
 <div className="anchor-image-actions"><button type="button" className="button secondary" disabled={disabled||busy} onClick={()=>setChoosing(v=>!v)}>Choose image</button><button type="button" className="button secondary" disabled={disabled||busy||!value} onClick={()=>void cropSelected()}>{busy?'Opening…':'Crop image'}</button>{value&&<button type="button" className="text-button" disabled={disabled||busy} onClick={()=>onSelect('')}>Remove anchor</button>}</div>
 {choosing&&<div className="anchor-image-choices"><button type="button" className="button secondary" disabled={disabled||busy} onClick={()=>input.current?.click()}>Upload from device</button><input ref={input} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setBusy(true);setError('');try{await onFile(file);setChoosing(false)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}/><p className="step-hint">Or choose a saved project image, then crop it.</p><div className="reference-picker-grid">{references.filter(r=>r.role!=='DIAGNOSTIC').map(r=><button type="button" key={r.id} className="reference-picker-tile" disabled={disabled||busy} aria-pressed={value===r.id} onClick={()=>{onSelect(r.id);setChoosing(false)}}><PreviewImage thumbnail src={image(r.id)} alt={r.name||'Saved image'}/><span className="reference-picker-name" title={r.name}>{r.name||'Saved image'}</span></button>)}</div></div>}
 <p className="step-hint">Changes apply when you save the character. Cropping keeps the original image.</p>
 </details>
 {error&&<p role="alert" className="error-text">{error}</p>}
 {crop&&<AnchorCropper file={crop} title={'Crop '+label.toLowerCase()} onCancel={()=>setCrop(null)} onCrop={async file=>{await onFile(file);setCrop(null)}}/>}
 </section>;
}
