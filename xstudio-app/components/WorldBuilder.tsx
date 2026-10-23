'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {Box,ClipboardList,ChevronDown,Edit3,Check,X,Copy,Save} from 'lucide-react';
import {WORLD_BUILDER_FIELDS,worldBuilderText} from '../lib/xce/world-builder-fields.mjs';
import {parseStoryImport} from '../lib/xce/story-import.mjs';
import {studioFetch} from '../lib/xce/studio-network.mjs';

export default function WorldBuilder(props:{manifest:any,project:string,onSaved:()=>Promise<any>}){
 return <StoryImport key={props.project} {...props}/>;
}

function StoryImport({manifest,project,onSaved}:{manifest:any,project:string,onSaved:()=>Promise<any>}){
 const [fields,setFields]=useState<Record<string,string>>(()=>worldBuilderText(manifest.world_builder));
 const [input,setInput]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(false),[tab,setTab]=useState(1);
 const [editingKey,setEditingKey]=useState<string|null>(null);
 const [draftValues,setDraftValues]=useState<Record<string,string>>({});
 const [copyStatus,setCopyStatus]=useState<Record<string,boolean>>({});
 const revision=useRef(manifest.revision),inFlight=useRef(false),mounted=useRef(true);
 const sectionId=useId(),tabButtons=useRef<(HTMLButtonElement|null)[]>([]);

 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[]);
 useEffect(()=>{
  if(!inFlight.current){
   const nextFields=worldBuilderText(manifest.world_builder);
   setFields(nextFields);
   revision.current=manifest.revision;
  }
 },[manifest]);

 async function ingest(text:string){
  if(inFlight.current)return;
  setInput(text);setError(false);setMessage('');
  let parsed;try{parsed=parseStoryImport(text)}catch(e){setError(true);setMessage((e as Error).message);return}
  const keys=Object.keys(parsed.patch);
  if(!keys.length){setMessage('All six sections are empty. Existing fields preserved. '+parsed.warnings.join(' '));return}
  const previous=fields;inFlight.current=true;setBusy(true);setFields({...fields,...parsed.patch});
  try{
   const response=await studioFetch('/api/world-builder',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({project_id:project,expected_revision:revision.current,tagged_text:text})
   });
   const data=await response.json();if(!response.ok)throw Error(data.error||'Import failed');
   if(!mounted.current)return;
   revision.current=data.revision;
   setFields(worldBuilderText(data.world_builder));
   setInput('');
   setMessage('Saved '+keys.map(key=>(WORLD_BUILDER_FIELDS as any)[key]?.label||key).join(', ')+'. '+(data.warnings||[]).join(' '));
   try{await onSaved()}catch{if(mounted.current)setMessage('Story saved. Refresh the page to reload other project views.')}
  }catch(e){
   if(mounted.current){setFields(previous);setError(true);setMessage((e as Error).message)}
  }finally{
   inFlight.current=false;if(mounted.current)setBusy(false);
  }
 }

 async function saveSingleField(key:string,value:string){
  if(inFlight.current)return;
  inFlight.current=true;setBusy(true);setError(false);setMessage('');
  const previousVal=fields[key]||'';
  setFields(prev=>({...prev,[key]:value}));
  try{
   const response=await studioFetch('/api/world-builder',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({project_id:project,expected_revision:revision.current,world_builder:{[key]:value.trim()}})
   });
   const data=await response.json();if(!response.ok)throw Error(data.error||'Save failed');
   if(!mounted.current)return;
   revision.current=data.revision;
   const next=worldBuilderText(data.world_builder);
   setFields(next);
   setEditingKey(null);
   const label=(WORLD_BUILDER_FIELDS as any)[key]?.label||key;
   setMessage(`Saved ${label}.`);
   try{await onSaved()}catch{if(mounted.current)setMessage(`Saved ${label}. Refresh to update views.`)}
  }catch(e){
   if(mounted.current){
    setFields(prev=>({...prev,[key]:previousVal}));
    setError(true);
    setMessage((e as Error).message);
   }
  }finally{
   inFlight.current=false;if(mounted.current)setBusy(false);
  }
 }

 function startEditing(key:string){
  setDraftValues(prev=>({...prev,[key]:fields[key]||''}));
  setEditingKey(key);
  setMessage('');
  setError(false);
 }

 function cancelEditing(key:string){
  setEditingKey(null);
  setDraftValues(prev=>{const cp={...prev};delete cp[key];return cp;});
 }

 async function copyText(key:string,text:string){
  try{
   await navigator.clipboard.writeText(text);
   setCopyStatus(prev=>({...prev,[key]:true}));
   setTimeout(()=>{
    if(mounted.current)setCopyStatus(prev=>({...prev,[key]:false}));
   },2000);
  }catch{
   setMessage('Select the text to copy manually.');
  }
 }

 return <section className="world-builder">
  <p className="world-import-hint">Brainstorm with XCE_FIRESTARTER, run US, then paste its complete output here and press Enter. It parses automatically into editable sections below.</p>
  <label className="story-field">Import story · {manifest.campaign_name||project}
   <textarea
    aria-label="Paste Firestarter story"
    rows={4}
    style={{height:130,resize:'none',overflowY:'auto'}}
    value={input}
    disabled={busy}
    placeholder="Paste the six tagged sections here…"
    onChange={e=>setInput(e.target.value)}
    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void ingest(input)}}}
    onDragOver={e=>e.preventDefault()}
    onDrop={e=>{e.preventDefault();setInput(e.dataTransfer.getData('text/plain'))}}
   />
  </label>
  <div style={{display:'flex',gap:'10px',alignItems:'center',marginTop:'10px'}}>
   <button type="button" className="button primary" disabled={busy||!input.trim()} onClick={()=>void ingest(input)}>
    {busy?'Saving…':'Parse & Import Story'}
   </button>
  </div>
  <p className="world-import-status" role={error?'alert':'status'} aria-live="polite" style={{marginTop:'12px',color:error?'#f87171':'#818cf8'}}>
   {busy?'Saving story…':message}
  </p>

  <div className="world-section-tabs" role="tablist" aria-label="Story sections" style={{marginTop:'24px'}}>
   {[{label:'World Builder',Icon:Box},{label:'Production & Continuity',Icon:ClipboardList}].map(({label,Icon},i)=>(
    <button
     key={label}
     ref={node=>{tabButtons.current[i]=node}}
     id={`${sectionId}-tab-${i+1}`}
     type="button"
     role="tab"
     tabIndex={tab===i+1?0:-1}
     aria-selected={tab===i+1}
     aria-controls={`${sectionId}-fields`}
     onClick={()=>setTab(i+1)}
     onKeyDown={e=>{
      const next=e.key==='Home'?0:e.key==='End'?1:e.key==='ArrowRight'?(i+1)%2:e.key==='ArrowLeft'?(i+1)%2:null;
      if(next!==null){e.preventDefault();setTab(next+1);tabButtons.current[next]?.focus()}
     }}
    >
     <Icon size={22} aria-hidden="true"/>
     <span>{label}</span>
    </button>
   ))}
  </div>

  <div className="world-saved-fields" id={`${sectionId}-fields`} role="tabpanel" aria-labelledby={`${sectionId}-tab-${tab}`}>
   {Object.entries(WORLD_BUILDER_FIELDS)
    .filter(([key])=>tab===1?!['production_brief','notes'].includes(key):['production_brief','notes'].includes(key))
    .map(([key,field]:any)=>{
     const isEditing=editingKey===key;
     const currentDraft=draftValues[key]!==undefined?draftValues[key]:(fields[key]||'');
     const charCount=currentDraft.length;
     const limit=field.limit||10000;
     const hasContent=Boolean((fields[key]||'').trim());

     return (
      <details key={key} className="world-saved-field" open={isEditing||hasContent}>
       <summary style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',userSelect:'none',padding:'12px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
         <span style={{fontWeight:600,color:'#f1f5f9'}}>{field.label}</span>
         {hasContent&&!isEditing&&(
          <span style={{fontSize:'10px',background:'rgba(99,102,241,0.18)',color:'#818cf8',padding:'2px 6px',borderRadius:'4px',border:'1px solid rgba(99,102,241,0.3)'}}>
           {fields[key].length} chars
          </span>
         )}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
         {!isEditing&&(
          <button
           type="button"
           className="button secondary"
           style={{height:'28px',minHeight:'28px',padding:'0 10px',fontSize:'11px',gap:'4px'}}
           onClick={e=>{e.preventDefault();startEditing(key)}}
          >
           <Edit3 size={12}/> Edit
          </button>
         )}
         {hasContent&&!isEditing&&(
          <button
           type="button"
           className="button secondary"
           style={{height:'28px',minHeight:'28px',padding:'0 8px',fontSize:'11px',gap:'4px'}}
           title="Copy to clipboard"
           onClick={e=>{e.preventDefault();void copyText(key,fields[key])}}
          >
           {copyStatus[key]?<Check size={12} color="#4ade80"/>:<Copy size={12}/>}
           {copyStatus[key]?'Copied':'Copy'}
          </button>
         )}
         <ChevronDown size={18} aria-hidden="true" style={{color:'#94a3b8'}}/>
        </div>
       </summary>

       <div style={{padding:'14px',background:'rgba(19,21,31,0.85)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        {isEditing?(
         <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'11px',color:'#94a3b8'}}>
           <span>Editing {field.label} · Press <strong>Ctrl+Enter</strong> / <strong>Cmd+Enter</strong> to save</span>
           <span style={{color:charCount>limit?'#ef4444':'#94a3b8'}}>
            {charCount} / {limit} chars
           </span>
          </div>
          <textarea
           aria-label={`Edit ${field.label}`}
           rows={Math.max(field.rows||4,6)}
           disabled={busy}
           style={{
            width:'100%',
            boxSizing:'border-box',
            padding:'12px',
            background:'#090a0f',
            color:'#f1f5f9',
            border:charCount>limit?'1px solid #ef4444':'1px solid #6366f1',
            borderRadius:'8px',
            fontSize:'13px',
            lineHeight:'1.6',
            resize:'vertical',
            outline:'none',
            fontFamily:'monospace'
           }}
           value={currentDraft}
           onChange={e=>setDraftValues(prev=>({...prev,[key]:e.target.value}))}
           onKeyDown={e=>{
            if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
             e.preventDefault();
             if(!busy&&charCount<=limit){
              void saveSingleField(key,currentDraft);
             }
            }else if(e.key==='Escape'){
             e.preventDefault();
             cancelEditing(key);
            }
           }}
          />
          <div style={{display:'flex',gap:'8px',alignItems:'center',justifyContent:'flex-end'}}>
           <button
            type="button"
            className="button secondary"
            disabled={busy}
            style={{height:'32px',minHeight:'32px',padding:'0 12px',fontSize:'12px',gap:'4px'}}
            onClick={()=>cancelEditing(key)}
           >
            <X size={14}/> Cancel
           </button>
           <button
            type="button"
            className="button primary"
            disabled={busy||charCount>limit}
            style={{height:'32px',minHeight:'32px',padding:'0 14px',fontSize:'12px',gap:'6px'}}
            onClick={()=>void saveSingleField(key,currentDraft)}
           >
            <Save size={14}/> {busy?'Saving…':'Save '+field.label}
           </button>
          </div>
         </div>
        ):(
         <div
          className="world-saved-text"
          role="region"
          aria-label={field.label}
          tabIndex={0}
          style={{
           whiteSpace:'pre-wrap',
           wordBreak:'break-word',
           lineHeight:'1.65',
           fontSize:'13px',
           color:fields[key]?'#e2e8f0':'#64748b',
           cursor:'pointer'
          }}
          onClick={()=>startEditing(key)}
          title="Click to edit this section"
         >
          {fields[key]||<span className="world-empty-field" style={{fontStyle:'italic',color:'#64748b'}}>Empty section. Click Edit to author this section.</span>}
         </div>
        )}
       </div>
      </details>
     );
    })}
  </div>
 </section>;
}
