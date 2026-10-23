'use client';
import {useRef} from 'react';
import PreviewImage from './PreviewImage';

export default function ReferenceThumbnail({src,label}:{src:string,label:string}){
 const dialog=useRef<HTMLDialogElement>(null);
 return <><button type="button" className="reference-thumbnail" aria-label={'Expand '+label} onClick={()=>dialog.current?.showModal()}><PreviewImage thumbnail src={src} alt={label}/></button><dialog ref={dialog} className="reference-image-dialog" aria-label={label} onCancel={e=>{e.preventDefault();e.stopPropagation();dialog.current?.close()}}><header><h3>{label}</h3><button type="button" className="icon-button" aria-label="Close image" onClick={()=>dialog.current?.close()}>×</button></header><PreviewImage src={src} alt={label}/></dialog></>;
}
