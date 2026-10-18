'use client';
import {useEffect,useState} from 'react';
import {studioFetch as fetch} from '../lib/xce/studio-network.mjs';
import {referencePoolRows,filterReferencePool} from '../lib/xce/reference-pool.mjs';
import PreviewImage from './PreviewImage';

type PoolImage={id:string;project:string;title:string;name:string;role:string;asset_type:string};
type Props={project:string;manifest:any;selected:string[];disabled:boolean;onChoose:(image:PoolImage)=>Promise<void>;onClose:()=>void};
export default function ReferencePoolPicker({project,manifest,selected,disabled,onChoose,onClose}:Props){
 const [rows,setRows]=useState<PoolImage[]>(()=>referencePoolRows(manifest,project,manifest.campaign_name||'This project'));
 const [projects,setProjects]=useState<{id:string;title:string}[]>([{id:project,title:manifest.campaign_name||'This project'}]);
 const [query,setQuery]=useState(''),[source,setSource]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  const abort=new AbortController();
  async function load(){
   try{
    const response=await fetch('/api/projects',{signal:abort.signal});const data=await response.json();
    if(!response.ok)throw Error(data.error||'Could not load asset pools');
    const available=(data.projects||[]).filter((p:any)=>p.id!==project&&!p.folder_locked);
    setProjects([{id:project,title:manifest.campaign_name||'This project'},...available]);
    let failed=0;
    for(let i=0;i<available.length;i+=4){
     const results=await Promise.allSettled(available.slice(i,i+4).map(async(p:any)=>{
      const response=await fetch('/api/manifest?project='+encodeURIComponent(p.id),{signal:abort.signal});const data=await response.json();
      if(!response.ok)throw Error(data.error||'Pool unavailable');
      return referencePoolRows(data.manifest||data,p.id,p.title);
     }));
     if(abort.signal.aborted)return;
     const images=results.flatMap(result=>{if(result.status==='fulfilled')return result.value;failed++;return []});
     setRows(old=>[...old,...images]);
    }
    if(failed)setError('Some asset pools could not load. Close and reopen to retry.');
   }catch(e){if(!abort.signal.aborted)setError((e as Error).message)}finally{if(!abort.signal.aborted)setLoading(false)}
  }
  void load();return()=>abort.abort();
 },[project,manifest.campaign_name]);
 const visible=filterReferencePool(rows,query,source,project,selected);
 return <section className="asset-pool-picker" aria-label="Reference library" aria-busy={loading}>
  <div className="entity-card-heading"><strong>Reference library</strong><button type="button" className="button secondary" disabled={disabled} onClick={onClose}>Close library</button></div>
  <label>Search asset pool<input autoFocus type="search" placeholder="Search images, assets or projects…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  <label>Asset pool<select value={source} onChange={e=>setSource(e.target.value)}><option value="">All available projects &amp; Lost Assets</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
  <p role="status">{visible.length} images{loading?' · Loading asset pools…':''}</p>
  <div className="reference-picker-grid">{visible.map((r:PoolImage)=><button type="button" className="reference-picker-tile" key={r.project+':'+r.id} disabled={disabled} onClick={()=>void onChoose(r)} aria-label={'Use '+r.name+' from '+r.title}>
   <PreviewImage thumbnail src={'/api/manifest?'+new URLSearchParams({project:r.project,file:r.id})} alt={r.name}/><span className="reference-picker-name">{r.name}</span><small>{r.title}</small>
  </button>)}</div>
  {!loading&&!visible.length&&<p>No matching images. Try another search or asset pool.</p>}
  <small>Includes uploaded images and images already assigned to assets. Locked folders stay protected.</small>
  {error&&<p className="error-text" role="alert">{error}</p>}
 </section>;
}
