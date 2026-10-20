'use client';
import {useState} from 'react';
import CharacterForm from './CharacterForm';
import AssetForm from './AssetForm';
import OverlaySelect from './OverlaySelect';
import {studioFetch} from '../lib/xce/studio-network.mjs';
export default function CharacterCreation({project,manifest,initial,projects,prepare,onSaved,onCancel,entity='character'}:{project:string;manifest:any;initial:any;projects:any[];entity?:string;prepare:(data:any,destination:string)=>Promise<any>;onSaved:(m:any,project:string)=>Promise<any>;onCancel:()=>void}){
 const needsDestination=project==='xce-lost-assets'||(initial.reference_ids||[]).some((id:string)=>id.startsWith('lost:'));
 const [destination,setDestination]=useState(project==='xce-lost-assets'?'':project),[ready,setReady]=useState<any>(needsDestination?null:{project,manifest,initial}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function open(){setBusy(true);setError('');try{const refs=await prepare(initial,destination);const r=await studioFetch('/api/manifest?project='+encodeURIComponent(destination));const m=await r.json();if(!r.ok)throw Error(m.error||'Could not load destination');setReady({project:destination,manifest:m,initial:{...initial,reference_ids:refs.ids}})}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 if(ready&&entity!=='character')return <AssetForm key={ready.project} project={ready.project} manifest={ready.manifest} primaryCategory={entity} initial={ready.initial} onClose={onCancel} onSaved={m=>onSaved(m,ready.project)}/>;
 if(ready)return <CharacterForm key={ready.project} project={ready.project} manifest={ready.manifest} initial={ready.initial} onCancel={onCancel} onSaved={m=>onSaved(m,ready.project)}/>;
 return <section><label>Save asset to project<OverlaySelect value={destination} disabled={busy} onChange={e=>setDestination(e.target.value)}><option value="">Choose project</option>{projects.filter(p=>!p.system_pool).map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</OverlaySelect></label>{error&&<p role="alert">{error}</p>}<button type="button" className="button primary" disabled={busy||!destination} onClick={()=>void open()}>{busy?'Opening…':'Open asset form'}</button><button type="button" className="button secondary" disabled={busy} onClick={onCancel}>Cancel</button></section>;
}
