'use client';
import {useEffect,useRef,useState} from 'react';
import {projectAssetFolders} from '../lib/xce/reference-pool.mjs';
import PreviewImage from './PreviewImage';

export type PoolImage={id:string;project:string;title:string;name:string;role:string;asset_type:string};
type Props={project:string;manifest:any;selected:string[];disabled:boolean;open:boolean;error?:string;onChoose:(image:PoolImage)=>Promise<void>;onClose:()=>void};
export default function ReferencePoolPicker({project,manifest,selected,disabled,open,error,onChoose,onClose}:Props){
 const dialog=useRef<HTMLDialogElement>(null);
 const [folder,setFolder]=useState<string|null>(null),[query,setQuery]=useState('');
 const folders=projectAssetFolders(manifest,project);
 const current=folders.find((f:any)=>f.id===folder);
 useEffect(()=>{
  if(open){setFolder(null);setQuery('');if(!dialog.current?.open)dialog.current?.showModal();}
  else dialog.current?.close();
 },[open,project]);
 const visible=(current?.records||[]).filter((r:PoolImage)=>r.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 return <dialog ref={dialog} className="asset-folder-dialog" aria-label="Choose an asset" onCancel={e=>{e.preventDefault();if(!disabled)onClose()}}>
  <div className="asset-folder-header"><strong>{manifest.campaign_name||'Project assets'}</strong><button type="button" className="icon-button" aria-label="Close asset picker" disabled={disabled} onClick={onClose}>×</button></div>
  {error&&<p className="error-text" role="alert">{error}</p>}
  {current?<><div className="asset-folder-header"><button type="button" className="button secondary" disabled={disabled} onClick={()=>{setFolder(null);setQuery('')}}>← Folders</button><span>{current.label}</span></div><label>Search<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find an asset…"/></label><div className="reference-picker-grid">{visible.map((r:PoolImage)=><button type="button" className="reference-picker-tile" key={r.id} disabled={disabled||selected.includes(r.id)} aria-label={'Choose '+r.name} onClick={()=>void onChoose(r)}><PreviewImage thumbnail src={'/api/manifest?'+new URLSearchParams({project,file:r.id})} alt={r.name}/><span>{r.name}</span>{selected.includes(r.id)&&<small>Attached</small>}</button>)}</div>{!visible.length&&<p>No images in this folder.</p>}</>:<div className="project-folder-grid">{folders.map((f:any)=><button type="button" className="button secondary" key={f.id} disabled={disabled} onClick={()=>setFolder(f.id)}><span>{f.label}</span><small>{f.records.length}</small></button>)}</div>}
 </dialog>;
}
