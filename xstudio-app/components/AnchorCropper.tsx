'use client';
// Adapted from NEXTDOCS components/ui/image-cropper-modal.tsx.
// Export original pixels only: no blurred extension, retouching or resynthesis.
import {useEffect,useRef,useState} from 'react';
import {initialCrop,adjustCrop,cropPixels} from '../lib/xce/anchor-crop.mjs';
type Crop={x:number,y:number,w:number,h:number};
export default function AnchorCropper({file,title,onCancel,onCrop}:{file:File,title:string,onCancel:()=>void,onCrop:(file:File)=>Promise<void>}){
 const dialog=useRef<HTMLDialogElement>(null),image=useRef<HTMLImageElement>(null),stage=useRef<HTMLDivElement>(null),drag=useRef<any>(null);
 const [url,setUrl]=useState(''),[size,setSize]=useState({w:0,h:0}),[crop,setCrop]=useState<Crop>({x:0,y:0,w:1,h:1}),[square,setSquare]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const src=URL.createObjectURL(file);setUrl(src);dialog.current?.showModal();return()=>URL.revokeObjectURL(src)},[file]);
 async function done(){if(!image.current||!size.w)return;setBusy(true);setError('');try{const rect=cropPixels(crop,size.w,size.h),canvas=document.createElement('canvas');canvas.width=rect.width;canvas.height=rect.height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image export unavailable');ctx.drawImage(image.current,rect.x,rect.y,rect.width,rect.height,0,0,rect.width,rect.height);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not create crop')),'image/png'));await onCrop(new File([blob],file.name.replace(/\.[^.]+$/,'')+'-crop.png',{type:'image/png'}));}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <dialog ref={dialog} className="anchor-crop-dialog" aria-label={title} onCancel={e=>{e.preventDefault();e.stopPropagation();if(!busy)onCancel()}}>
 <header className="anchor-crop-heading"><h3>{title}</h3><button type="button" className="icon-button" aria-label="Close cropper" disabled={busy} onClick={onCancel}>×</button></header>
 <p className="step-hint">Move the box. Drag any edge or corner to resize. Arrow keys move; Shift + arrows resize.</p>
 <div className="anchor-crop-stage" ref={stage} style={size.w?{aspectRatio:String(size.w/size.h),maxWidth:'min(100%, '+(size.w/size.h*45)+'dvh)'}:{}}>
 {url&&<img ref={image} src={url} alt="Original anchor sheet" draggable={false} onLoad={e=>{const i=e.currentTarget;setSize({w:i.naturalWidth,h:i.naturalHeight});setCrop(initialCrop(i.naturalWidth,i.naturalHeight))}} onError={()=>setError('The original image could not be opened.')}/>}
 {!!size.w&&<div className="anchor-crop-box" tabIndex={0} role="group" aria-label="Crop selection" style={{left:crop.x*100+'%',top:crop.y*100+'%',width:crop.w*100+'%',height:crop.h*100+'%'}}
 onPointerDown={e=>{if(busy)return;e.preventDefault();const handle=(e.target as HTMLElement).dataset.handle||'move';e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,crop,handle}}}
 onPointerMove={e=>{const d=drag.current,r=stage.current?.getBoundingClientRect();if(!d||d.id!==e.pointerId||!r)return;setCrop(adjustCrop(d.crop,d.handle,(e.clientX-d.x)/r.width,(e.clientY-d.y)/r.height,size.w,size.h,square))}}
 onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}
 onKeyDown={e=>{if(busy)return;const delta:Record<string,number[]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!delta[e.key])return;e.preventDefault();const [dx,dy]=delta[e.key];setCrop(c=>adjustCrop(c,e.shiftKey?(dx?'e':'s'):'move',dx/size.w*4,dy/size.h*4,size.w,size.h,square))}}>
 {['n','ne','e','se','s','sw','w','nw'].map(h=><span key={h} data-handle={h} className={'anchor-crop-handle handle-'+h}/>)}
 </div>}
 </div>
 <div className="anchor-crop-tools"><label className="anchor-square-toggle"><input type="checkbox" checked={square} disabled={busy} onChange={e=>{setSquare(e.target.checked);if(e.target.checked)setCrop(initialCrop(size.w,size.h))}}/>Keep square</label><button type="button" className="text-button" disabled={busy||!size.w} onClick={()=>setCrop(initialCrop(size.w,size.h))}>Reset crop</button></div>
 {error&&<p className="error-text" role="alert">{error}</p>}
 <footer className="button-row"><button type="button" className="button secondary" disabled={busy} onClick={onCancel}>Cancel</button><button type="button" className="button primary" disabled={busy||!size.w} onClick={()=>void done()}>{busy?'Saving crop…':'Use crop'}</button></footer>
 </dialog>;
}
