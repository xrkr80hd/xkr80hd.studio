'use client';
import {useEffect,useRef,useState} from 'react';
import {Copy} from 'lucide-react';
import {studioFetch} from '../lib/xce/studio-network.mjs';
import {localGet,finishProjectEdit} from '../lib/xce/local-store.mjs';
import {projectEdit} from '../lib/xce/project-edit.mjs';
export default function ProjectIdentity({project,title,revision,onSaved,onCopy}:{project:string,title:string,revision:number,onSaved:(id:string,title:string,revision:number)=>void,onCopy:(value:string)=>void}){
 const [editing,setEditing]=useState(false),[name,setName]=useState(title),[id,setId]=useState(project),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const active=useRef(true);useEffect(()=>{active.current=true;return()=>{active.current=false}},[]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(busy)return;setError('');setBusy(true);
  try{
   const input=projectEdit({project_id:project,new_project_id:id.trim(),name,expected_revision:revision});
   const cached=await localGet('project:'+project);if(cached&&cached.sync_status!=='synced')throw Error('Wait for this project to finish syncing, then try again.');
   const r=await studioFetch('/api/project-details',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),saved=await r.json();
   if(!r.ok)throw Error(saved.error||'Could not save the project.');
   if(saved.project_id!==input.new_project_id||!Number.isInteger(saved.revision))throw Error('Save could not be confirmed. Refresh before trying again.');
   await finishProjectEdit(project,saved.project_id,input.name,saved.revision);
   if(active.current){setEditing(false);onSaved(saved.project_id,input.name,saved.revision)}
  }catch(e){if(active.current)setError((e as Error).message)}finally{if(active.current)setBusy(false)}
 }
 return <div className="project-identity">{editing?<form onSubmit={save}>
  <label>Project title<input value={name} onChange={e=>setName(e.target.value)} maxLength={200} required disabled={busy}/></label>
  <label>Project ID<input value={id} onChange={e=>setId(e.target.value)} maxLength={80} required disabled={busy} autoCapitalize="none" autoCorrect="off" spellCheck={false}/></label>
  {error&&<p role="alert" className="error-text">{error}</p>}
  <div className="project-identity-actions"><button className="button primary" disabled={busy} type="submit">{busy?'Saving…':'Save'}</button><button className="button secondary" disabled={busy} type="button" onClick={()=>{setEditing(false);setError('')}}>Cancel</button></div>
 </form>:<><p>Project ID: <span>{project}</span><button type="button" className="project-id-copy" aria-label="Copy project ID" onClick={()=>onCopy(project)}><Copy size={15}/></button></p><button className="button secondary" type="button" onClick={()=>{setName(title);setId(project);setError('');setEditing(true)}}>Edit</button></>}</div>;
}
