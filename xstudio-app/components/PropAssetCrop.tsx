'use client';
import {useState} from 'react';
import ReferencePoolPicker,{type PoolImage} from './ReferencePoolPicker';
import AnchorCropper from './AnchorCropper';
import {studioFetch} from '../lib/xce/studio-network.mjs';
export default function PropAssetCrop({project,manifest,disabled,onCrop}:{project:string;manifest:any;disabled:boolean;onCrop:(file:File)=>Promise<void>}){
 const [open,setOpen]=useState(false),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function choose(image:PoolImage){setBusy(true);setError('');try{const r=await studioFetch('/api/manifest?'+new URLSearchParams({project,file:image.id}));if(!r.ok)throw Error('Could not open this image');const blob=await r.blob();if(!['image/png','image/jpeg','image/webp'].includes(blob.type))throw Error('Choose a supported image');setFile(new File([blob],image.name||'prop.png',{type:blob.type}));setOpen(false);}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <><button type="button" className="button secondary" disabled={disabled||busy} onClick={()=>{setError('');setOpen(true)}}>Use asset &amp; crop</button><ReferencePoolPicker project={project} manifest={manifest} open={open} selected={[]} disabled={disabled||busy} error={error} onChoose={choose} onClose={()=>setOpen(false)}/>{file&&<AnchorCropper file={file} title="Crop prop / weapon" onCancel={()=>setFile(null)} onCrop={async crop=>{await onCrop(crop);setFile(null)}}/>}{error&&!open&&<p className="error-text" role="alert">{error}</p>}</>;
}
