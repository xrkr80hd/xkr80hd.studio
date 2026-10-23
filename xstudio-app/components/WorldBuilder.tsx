'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {Box,ClipboardList,ChevronDown} from 'lucide-react';
import {WORLD_BUILDER_FIELDS,worldBuilderText} from '../lib/xce/world-builder-fields.mjs';
import {parseStoryImport} from '../lib/xce/story-import.mjs';
import {studioFetch} from '../lib/xce/studio-network.mjs';

export default function WorldBuilder(props:{manifest:any,project:string,onSaved:()=>Promise<any>}){
 return <StoryImport key={props.project} {...props}/>;
}
function StoryImport({manifest,project,onSaved}:{manifest:any,project:string,onSaved:()=>Promise<any>}){
 const [fields,setFields]=useState(()=>worldBuilderText(manifest.world_builder));
 const [input,setInput]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(false),[tab,setTab]=useState(1);
 const revision=useRef(manifest.revision),inFlight=useRef(false),mounted=useRef(true);
 const sectionId=useId(),tabButtons=useRef<(HTMLButtonElement|null)[]>([]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[]);
 useEffect(()=>{if(!inFlight.current){setFields(worldBuilderText(manifest.world_builder));revision.current=manifest.revision}},[manifest]);
 async function ingest(text:string){
  if(inFlight.current)return;
  setInput(text);setError(false);setMessage('');
  let parsed;try{parsed=parseStoryImport(text)}catch(e){setError(true);setMessage((e as Error).message);return}
  const keys=Object.keys(parsed.patch);
  if(!keys.length){setMessage('All six sections are empty. Existing fields preserved. '+parsed.warnings.join(' '));return}
  const previous=fields;inFlight.current=true;setBusy(true);setFields({...fields,...parsed.patch});
  try{
   const response=await studioFetch('/api/world-builder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project,expected_revision:revision.current,tagged_text:text})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Import failed');
   if(!mounted.current)return;
   revision.current=data.revision;setFields(worldBuilderText(data.world_builder));setInput('');
   setMessage('Saved '+keys.map(key=>(WORLD_BUILDER_FIELDS as any)[key].label).join(', ')+'. '+(data.warnings||[]).join(' '));
   try{await onSaved()}catch{if(mounted.current)setMessage('Story saved. Refresh the page to reload other project views.')}
  }catch(e){if(mounted.current){setFields(previous);setError(true);setMessage((e as Error).message)}}
  finally{inFlight.current=false;if(mounted.current)setBusy(false)}
 }
 return <section className="world-builder">
  <p className="world-import-hint">Brainstorm with XCE_FIRESTARTER, run US, then paste its complete output here and press Enter. It saves to this project automatically.</p>
  <label className="story-field">Import story · {manifest.campaign_name||project}
   <textarea aria-label="Paste Firestarter story" rows={4} style={{height:130,resize:'none',overflowY:'auto'}} value={input} disabled={busy} placeholder="Paste the six tagged sections here…" onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void ingest(input)}}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();setInput(e.dataTransfer.getData('text/plain'))}}/>
  </label>
  <button type="button" className="button primary" disabled={busy||!input.trim()} onClick={()=>void ingest(input)}>Enter</button>
  <p className="world-import-status" role={error?'alert':'status'} aria-live="polite">{busy?'Saving story…':message}</p>
  <div className="world-section-tabs" role="tablist" aria-label="Story sections">{[{label:'World Builder',Icon:Box},{label:'Production & Continuity',Icon:ClipboardList}].map(({label,Icon},i)=><button key={label} ref={node=>{tabButtons.current[i]=node}} id={`${sectionId}-tab-${i+1}`} type="button" role="tab" tabIndex={tab===i+1?0:-1} aria-selected={tab===i+1} aria-controls={`${sectionId}-fields`} onClick={()=>setTab(i+1)} onKeyDown={e=>{const next=e.key==='Home'?0:e.key==='End'?1:e.key==='ArrowRight'?(i+1)%2:e.key==='ArrowLeft'?(i+1)%2:null;if(next!==null){e.preventDefault();setTab(next+1);tabButtons.current[next]?.focus()}}}><Icon size={22} aria-hidden="true"/><span>{label}</span></button>)}</div>
  <div className="world-saved-fields" id={`${sectionId}-fields`} role="tabpanel" aria-labelledby={`${sectionId}-tab-${tab}`}>{Object.entries(WORLD_BUILDER_FIELDS).filter(([key])=>tab===1?!['production_brief','notes'].includes(key):['production_brief','notes'].includes(key)).map(([key,field]:any)=><details key={key} className="world-saved-field"><summary><span>{field.label}</span><ChevronDown size={18} aria-hidden="true"/></summary><div className="world-saved-text" role="region" aria-label={field.label} tabIndex={0}>{fields[key]||<span className="world-empty-field">Nothing saved yet.</span>}</div></details>)}</div>
 </section>;
}
