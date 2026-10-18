'use client';
import {useEffect,useRef,useState} from 'react';
import {CAST_GROUPS,characterGroup} from '../lib/xce/cast-groups.mjs';

export default function CastGroupPicker({project,manifest,characterId,name,onSaved}:{project:string,manifest:any,characterId:string,name:string,onSaved:(result:any)=>Promise<void>}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [open,setOpen]=useState(false),[choice,setChoice]=useState('unassigned'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close()},[open]);
 async function save(){setBusy(true);setError('');try{const response=await fetch('/api/cast-groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project,character_id:characterId,group:choice,expected_revision:manifest.revision})});const result=await response.json();if(!response.ok)throw Error(result.error||'Could not save cast group');await onSaved(result);setOpen(false)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <><button type="button" className="button secondary cast-picker-trigger" onClick={()=>{setChoice(characterGroup(manifest,characterId));setError('');setOpen(true)}}>Cast group<span>{CAST_GROUPS[characterGroup(manifest,characterId) as keyof typeof CAST_GROUPS]}</span></button>
 <dialog ref={dialog} className="cast-picker-dialog" aria-label={'Cast group for '+name} onCancel={e=>{e.preventDefault();setOpen(false)}}><div className="modal-header"><h2>Cast group</h2><button type="button" className="icon-button" aria-label="Close cast group" onClick={()=>setOpen(false)}>×</button></div><p>{name}</p><div className="cast-picker-choices" role="radiogroup" aria-label="Choose cast group">{Object.entries(CAST_GROUPS).map(([value,label])=><button type="button" key={value} role="radio" aria-checked={choice===value} disabled={busy} onClick={()=>setChoice(value)}><strong>{label}</strong><span aria-hidden="true">{choice===value?'✓':''}</span></button>)}</div>{error&&<p className="error-text" role="alert">{error}</p>}<div className="button-row"><button type="button" className="button secondary" onClick={()=>setOpen(false)}>Cancel</button><button type="button" className="button primary" disabled={busy} onClick={()=>void save()}>{busy?'Saving…':'Save cast group'}</button></div></dialog></>;
}
