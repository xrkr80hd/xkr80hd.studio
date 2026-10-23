'use client';
import {characterGroup} from '../lib/xce/cast-groups.mjs';
import {useState} from 'react';
import {worldRecords} from '../lib/xce/world-library.mjs';
import ProjectCharacterPicker from './ProjectCharacterPicker';
import PreviewImage from './PreviewImage';
export function SceneCastPicker({project,manifest,value,onChange,counts={},onCountsChange,disabled=false}:{project:string;manifest:any;value:string[];onChange:(ids:string[])=>void;disabled?:boolean;counts?:Record<string,number>;onCountsChange?:(counts:Record<string,number>)=>void}){
 const characters=worldRecords(manifest).filter((a:any)=>a.type==='characters'&&!a.deleted_at);
 return <section className="scene-cast-picker"><ProjectCharacterPicker manifest={manifest} label="Add character" includeCreatures exclude={value} disabled={disabled||value.length>=50} onChange={id=>onChange([...value,id])}/>
 <div className="scene-cast-list">{value.map(id=>{const a=characters.find((a:any)=>a.id===id);return <div key={id}>{a?.reference_ids?.[0]&&<PreviewImage thumbnail src={'/api/manifest?'+new URLSearchParams({project,file:a.reference_ids[0]})} alt=""/>}<span>{a?.name||id}</span>{onCountsChange&&['background','extras','military'].includes(characterGroup(manifest,id))&&<label className="cast-quantity">Qty<input type="number" min={1} max={100} value={counts[id]??1} disabled={disabled} onChange={e=>onCountsChange({...counts,[id]:Number(e.target.value)})}/></label>}<button type="button" className="button secondary" disabled={disabled} aria-label={'Remove '+(a?.name||id)+' from reference'} onClick={()=>onChange(value.filter(v=>v!==id))}>Remove</button></div>})}</div></section>;

}
export default function SceneCharacters({project,manifest,sceneId,onSaved}:{project:string;manifest:any;sceneId:string;onSaved:(result:any)=>Promise<void>}){
 const saved=manifest.scenes?.[sceneId]?.character_ids||[],[value,setValue]=useState<string[]>(saved),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const dirty=JSON.stringify(value)!==JSON.stringify(saved);
 async function save(){setBusy(true);setError('');try{const response=await fetch('/api/composer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'scene_cast',project_id:project,scene_id:sceneId,character_ids:value,expected_revision:manifest.revision,confirm:true})});const result=await response.json();if(!response.ok)throw Error(result.error||'Could not save scene characters');await onSaved(result)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <details className="form-accordion"><summary>Characters in this reference ({saved.length})</summary><SceneCastPicker project={project} manifest={manifest} value={value} disabled={busy} onChange={setValue}/><button type="button" className="button primary" disabled={busy||!dirty} onClick={()=>void save()}>{busy?'Saving…':'Save character assignments'}</button>{error&&<p className="error-text" role="alert">{error}</p>}</details>;
}
