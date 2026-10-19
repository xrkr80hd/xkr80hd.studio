'use client';
import {useCharacterRequest,useCharacterSection} from './CharacterFormContext';
import OverlaySelect from './OverlaySelect';
import {useEffect,useRef,useState} from 'react';
import PreviewImage from './PreviewImage';
import ReferencePoolPicker,{type PoolImage} from './ReferencePoolPicker';
import type {CharacterState} from '../lib/xce/entity-composition';
import './entity-composition.css';

type Props={project:string;manifest:any;characterId:string;onSaved:(result:any)=>Promise<void>};
// Retain edits when the parent asset viewer unmounts. Scope by project and character.
const drafts=new Map<string,CharacterState>();
export default function CharacterStates({project,manifest,characterId,onSaved}:Props){
 const formRequest=useCharacterRequest();
 const scope=project+':'+characterId;
 const [draft,setDraftValue]=useState<CharacterState|null>(()=>drafts.get(scope)||null);
 const [states,setStates]=useState<CharacterState[]>(()=>Object.values(manifest.state_variants?.[characterId]||{}));
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[poolOpen,setPoolOpen]=useState(false);
 const revision=useRef(manifest.revision),inFlight=useRef(false),activeScope=useRef(scope);
 activeScope.current=scope;
 useEffect(()=>{activeScope.current=scope;return()=>{activeScope.current='';};},[scope]);
 function setDraft(value:CharacterState|null){if(value)drafts.set(scope,value);else drafts.delete(scope);setDraftValue(value);}
 useEffect(()=>{revision.current=manifest.revision;setStates(Object.values(manifest.state_variants?.[characterId]||{}));},[manifest.revision,manifest.state_variants,characterId]);
 useEffect(()=>{setDraftValue(drafts.get(scope)||null);setPoolOpen(false);setError('');},[scope]);
 const previous=states.find(s=>s.id===draft?.id),locked=draft?.status==='LOCKED';
 const dirty=!!draft&&JSON.stringify(draft)!==JSON.stringify(previous);
 useCharacterSection('state',()=>dirty&&draft&&!locked?{action:'character_state',state:draft,operation:'save',expected_version:previous?draft.version:0}:null);
 async function request(body:any){
  if(activeScope.current!==scope)throw Error('The active character changed. Reopen the original character to continue.');
  const response=await formRequest('/api/composer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,project_id:project,character_id:characterId,expected_revision:revision.current,confirm:true})});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Could not save costume');return result;
 }
 async function accept(result:any,next:CharacterState|null){
  if(activeScope.current!==scope)return;
  revision.current=result.revision;setStates(Object.values(result.state_variants?.[characterId]||{}));setDraft(next);
  // The attachment is already saved. A parent refresh failure must not undo it.
  try{await onSaved(result)}catch{setError('Saved. The project view could not refresh; reopen it to refresh.');}
 }
 async function save(operation:string){
  if(!draft||inFlight.current)return;inFlight.current=true;setBusy(true);setError('');
  try{const result=await request({action:'character_state',state:draft,operation,expected_version:previous?draft.version:0});await accept(result,operation==='delete'?null:result.state_variants[characterId][draft.id]);}
  catch(e){if(activeScope.current===scope)setError((e as Error).message)}finally{inFlight.current=false;setBusy(false)}
 }
 function addAlternate(){if(draft&&dirty){setError('');setPoolOpen(true);return;}setDraft({id:'STATE-'+crypto.randomUUID(),character_id:characterId,name:'',status:'DRAFT',version:1,reference_ids:[],visual_description:''});setError('');setPoolOpen(true);}
 async function attach(referenceId:string,name:string){
  if(!draft)return;
  // Save unsaved text first when adding another image to an edited form.
  let version=previous?draft.version:0;
  if(previous&&dirty&&draft.name.trim()){
   const saved=await request({action:'character_state',state:draft,operation:'save',expected_version:version});
   await accept(saved,saved.state_variants[characterId][draft.id]);version=saved.state_variants[characterId][draft.id].version;
  }
  const result=await request({action:'attach_character_costume',reference_id:referenceId,state_id:draft.id,name:draft.name.trim()||name,visual_description:draft.visual_description,expected_version:version});
  if(activeScope.current===scope)setPoolOpen(false);
  await accept(result,result.state);
 }
 async function chooseAssetImage(image:PoolImage){
  if(!draft||locked||inFlight.current)return;
  if(image.project!==project){setError('Choose an asset from this project.');return;}
  inFlight.current=true;setBusy(true);setError('');
  try{await attach(image.id,image.name)}catch(e){if(activeScope.current===scope)setError((e as Error).message)}finally{inFlight.current=false;setBusy(false)}
 }
 async function upload(file:File){
  if(!draft||locked||inFlight.current)return;inFlight.current=true;setBusy(true);setError('');
  try{
   if(file.size>6*1024*1024)throw Error('Choose an image up to 6 MB');
   const form=new FormData();form.set('file',file);form.set('project_id',project);form.set('role','COSTUME');
   const response=await formRequest('/api/upload',{method:'POST',body:form}),result=await response.json();if(!response.ok)throw Error(result.error||'Upload failed');
   const read=await formRequest('/api/manifest?project='+encodeURIComponent(project),{cache:'no-store'}),data=await read.json();if(!read.ok)throw Error('Image uploaded. Reopen the project to attach it from assets.');
   if(activeScope.current!==scope)return;
   const current=data.manifest||data;revision.current=current.revision;
   await attach(result.reference_id,file.name);
  }catch(e){if(activeScope.current===scope)setError((e as Error).message)}finally{inFlight.current=false;setBusy(false)}
 }
 return <details className="form-accordion entity-editor"><summary>Alternate costumes / Forms / Transformations</summary>
  <button type="button" className="button secondary" disabled={busy} onClick={addAlternate}>Add Alternate Character / Costume</button>
  {states.length>0&&<label>Alternate form<OverlaySelect value={draft?.id||''} disabled={busy} onChange={e=>setDraft(states.find(s=>s.id===e.target.value)||null)}><option value="">Choose a form</option>{states.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</OverlaySelect></label>}
  {draft&&<section className="entity-card" aria-label="Alternate form editor"><fieldset disabled={busy||locked}>
   <label>Name<input maxLength={100} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
   <label>Appearance<textarea rows={3} maxLength={2000} value={draft.visual_description} onChange={e=>setDraft({...draft,visual_description:e.target.value})}/></label>
   <label>Upload image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={draft.reference_ids.length>=6} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value=''}}/></label>
   <button type="button" className="button secondary" disabled={draft.reference_ids.length>=6} onClick={()=>setPoolOpen(true)}>Add from assets</button>
   <div className="entity-reference-strip">{draft.reference_ids.map(id=><div key={id}><PreviewImage src={'/api/manifest?'+new URLSearchParams({project,file:id})} alt={draft.name}/><button type="button" className="button secondary" onClick={()=>setDraft({...draft,reference_ids:draft.reference_ids.filter(r=>r!==id)})}>Remove image</button></div>)}</div>
  </fieldset><div className="button-row"><button type="button" className="button primary" disabled={busy||(!locked&&(dirty||!previous||!draft.reference_ids.length))} onClick={()=>void save(locked?'unlock':'lock')}>{locked?'Unlock':'Lock form'}</button>{!locked&&<><button type="button" className="button secondary" disabled={busy||!draft.name.trim()||!dirty} onClick={()=>void save('save')}>Save form</button><button type="button" className="button secondary" disabled={busy} onClick={()=>previous?void save('delete'):setDraft(null)}>{previous?'Delete form':'Discard'}</button></>}</div></section>}
  <ReferencePoolPicker project={project} manifest={manifest} selected={draft?.reference_ids||[]} disabled={busy||!!locked} open={poolOpen} error={error} onChoose={chooseAssetImage} onClose={()=>setPoolOpen(false)}/>
  {error&&<p className="error-text" role="alert">{error}</p>}
 </details>;
}
