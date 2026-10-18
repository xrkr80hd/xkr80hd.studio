'use client';
import {useEffect,useState} from 'react';
import {worldRecords} from '../lib/xce/world-library.mjs';
import {CAST_GROUPS,characterGroup,resolveCastCharacter} from '../lib/xce/cast-groups.mjs';

export default function CastGroupPicker({project,manifest,characterId,name,onSaved,embedded=false}:{project:string,manifest:any,characterId:string,name:string,onSaved:(result:any)=>Promise<void>,embedded?:boolean}){
 let savedId=characterId;try{savedId=resolveCastCharacter(manifest,characterId,worldRecords(manifest))}catch{}
 const [choice,setChoice]=useState(characterGroup(manifest,savedId)),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setChoice(characterGroup(manifest,savedId));setError('')},[manifest.character_cast_groups,savedId]);
 async function save(){setBusy(true);setError('');try{const response=await fetch('/api/cast-groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project,character_id:savedId,group:choice,expected_revision:manifest.revision})});const result=await response.json();if(!response.ok)throw Error(result.error||'Could not save cast group');await onSaved(result);}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const controls=<><div className="cast-picker-choices" role="radiogroup" aria-label={'Cast group for '+name}>{Object.entries(CAST_GROUPS).map(([value,label])=><button type="button" key={value} role="radio" aria-checked={choice===value} disabled={busy} onClick={()=>setChoice(value)}><strong>{label}</strong><span aria-hidden="true">{choice===value?'✓':''}</span></button>)}</div>{error&&<p className="error-text" role="alert">{error}</p>}<button type="button" className="button primary" disabled={busy||choice===characterGroup(manifest,savedId)} onClick={()=>void save()}>{busy?'Saving…':'Save cast group'}</button></>;
 return embedded?<section className="cast-group-options"><h3>Assign cast group</h3>{controls}</section>:<details className="form-accordion cast-group-editor"><summary>Cast group · {CAST_GROUPS[characterGroup(manifest,savedId) as keyof typeof CAST_GROUPS]}</summary>{controls}</details>;
}
