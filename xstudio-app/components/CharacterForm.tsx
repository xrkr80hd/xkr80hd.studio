'use client';
import {useMemo,useRef,useState} from 'react';
import AssetContinuity,{ContinuityFields} from './AssetContinuity';
import {CharacterFormContext} from './CharacterFormContext';
import AssetDetails from './AssetDetails';
import CharacterAccordion from './AssetAccordion';
import AssetAccordionLayout from './AssetAccordionLayout';
import CharacterQuickDetails from './CharacterQuickDetails';
import CharacterStory from './CharacterStory';
import CharacterStates from './CharacterStates';
import AnchorImageField from './AnchorImageField';
import ReferenceThumbnail from './ReferenceThumbnail';
import ReferencePoolPicker from './ReferencePoolPicker';
import {worldRecords} from '../lib/xce/world-library.mjs';
import {characterDraft,applyCharacterAction} from '../lib/xce/character-form.mjs';
import {studioFetch} from '../lib/xce/studio-network.mjs';
export default function CharacterForm({project,manifest,assetId,initial,onSaved,onCancel}:{project:string;manifest:any;assetId?:string;initial?:any;onSaved:(m:any)=>Promise<any>;onCancel?:()=>void}){
 const [id]=useState(()=>assetId||crypto.randomUUID()),[created,setCreated]=useState(!!assetId);
 const [draft,setDraft]=useState<any>(()=>{const m=assetId?structuredClone(manifest):characterDraft(manifest,id);if(!assetId){m.world_library.characters[id].name=initial?.name||'';m.world_library.characters[id].reference_ids=initial?.reference_ids||[];}return m});
 const current=useRef(draft),operations=useRef<any[]>([]),baseRevision=useRef(manifest.revision),sections=useRef(new Map<string,()=>any>());
 const [continuity,setContinuity]=useState<any>({});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[pool,setPool]=useState(false);
 const publish=(m:any)=>{current.current=m;setDraft(m)};
 function stage(a:any){const result=applyCharacterAction(current.current,project,id,a);operations.current.push(a);publish(result.manifest);return result.result}
 const context=useMemo(()=>({sections:sections.current,request:async(url:string,options?:RequestInit)=>{try{if(url.startsWith('/api/manifest'))return Response.json(current.current);if(url==='/api/composer'){const a=JSON.parse(String(options?.body||'{}'));return Response.json(stage(a))}return studioFetch(url,options)}catch(e){return Response.json({error:(e as Error).message},{status:400})}}}),[project,id]);
 const record=worldRecords(draft).find((a:any)=>a.id===id),locked=record?.status==='LOCKED',refs=Object.values(draft.references||{}) as any[];
 const anchors=record?.metadata||{},image=(ref:string)=>'/api/manifest?'+new URLSearchParams({project,file:ref});
 const sheet=[...new Set([record?.source_image_id,...(record?.reference_ids||[])])].find(ref=>ref&&![anchors.face_anchor_url,anchors.body_anchor_url].includes(ref));
 function setImages(ids:string[],nextAnchors=anchors){stage({action:'character_images',reference_ids:[...new Set(ids)],anchors:{face_anchor_url:nextAnchors.face_anchor_url||'',body_anchor_url:nextAnchors.body_anchor_url||''}})}
 async function upload(file:File,key?:string){setBusy(true);setError('');try{const data=new FormData();data.set('project_id',project);data.set('file',file);data.set('role','IDENTITY');data.set('asset_name',file.name);const r=await studioFetch('/api/upload',{method:'POST',body:data});const result=await r.json();if(!r.ok)throw Error(result.error||'Upload failed');const reload=await studioFetch('/api/manifest?project='+encodeURIComponent(project));if(!reload.ok)throw Error('Image uploaded. Reopen the character to refresh references.');const fresh=await reload.json();baseRevision.current=fresh.revision;publish({...current.current,references:fresh.references});const row=worldRecords(current.current).find((a:any)=>a.id===id);setImages([...(row?.reference_ids||[]),result.reference_id],key?{...row?.metadata,[key]:result.reference_id}:row?.metadata)}catch(e){setError((e as Error).message);throw e}finally{setBusy(false)}}
 async function save(notify=true){setBusy(true);setError('');setMessage('');try{
  // Flush the current field values, including sections that have never been individually saved.
  let next=structuredClone(current.current);const pending=[];
  for(const key of ['identity','quick','metadata','prompt','classification','state']){const a=sections.current.get(key)?.();if(a){next=applyCharacterAction(next,project,id,a).manifest;pending.push(a)}}
  const request={action:'character_form',asset_id:id,project_id:project,create:!created,expected_revision:baseRevision.current,confirm:true,...(continuity.edit_instruction?{continuity}:{}),operations:[...operations.current,...pending]};
  if(!created&&initial?.reference_ids?.length)request.operations.unshift({action:'character_images',reference_ids:initial.reference_ids,anchors:{}});
  const r=await studioFetch('/api/composer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)}),result=await r.json();if(!r.ok)throw Error(result.error||'Character not saved');
  operations.current=[];baseRevision.current=result.manifest.revision;setCreated(true);setContinuity({});publish(result.manifest);if(notify)await onSaved(result.manifest);setMessage('Character saved.');return result.manifest;
 }catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function toggleLock(){const saved=await save(false);if(!saved)return;setBusy(true);try{const r=await studioFetch('/api/anchor-lock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project,asset_id:id,source_image_id:sheet,expected_revision:saved.revision,action:locked?'unlock':'lock',confirm:true})});const result=await r.json();if(!r.ok)throw Error(result.error||'Lock change failed');const reload=await studioFetch('/api/manifest?project='+encodeURIComponent(project));if(!reload.ok)throw Error('Saved. Reopen to refresh.');const next=await reload.json();baseRevision.current=next.revision;publish(next);await onSaved(next)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <CharacterFormContext.Provider value={context}>
  <AssetAccordionLayout label={created?'Edit character':'Create character'} footer={<>
    <p className="step-hint">Save character applies all fields and reference selections together.</p>
    {error&&<p role="alert" className="error-text">{error}</p>}{message&&<p role="status">{message}</p>}
    <div className="character-creator-actions"><button type="button" className="button primary" disabled={busy} onClick={()=>void save()}>{busy?'Saving…':created?'Save character':'Create character'}</button><button type="button" className="button secondary" disabled={busy||!sheet} onClick={()=>void toggleLock()}>{locked?'Save & unlock':'Save & lock'}</button>{onCancel&&<button type="button" className="button secondary character-creator-close" disabled={busy} onClick={onCancel}>Close</button>}</div>
   </>}>
    <fieldset disabled={busy} className="character-creator-fieldset">
     <AssetDetails project={project} manifest={draft} assetId={id} onSaved={async()=>{}} renderCharacter={({identity,gear,style})=>
      <CharacterStory project={project} manifest={draft} characterId={id} onSaved={async()=>{}} renderSections={({details,advanced})=><>
       <CharacterAccordion number={1} title="Name & Core Identity" defaultOpen>{identity}</CharacterAccordion>
       <CharacterAccordion number={2} title="Visual Assets & References">
        <section className="master-character-sheet" aria-label="Master Character Sheet">
         <header><strong>Master Character Sheet</strong><span>Primary Anchor</span></header>
        {sheet?<div className="asset-sheet-previews"><div><ReferenceThumbnail src={image(String(sheet))} label="Character sheet"/><span className="reference-image-label">Character sheet</span></div></div>:<div className="master-sheet-empty">No master sheet uploaded</div>}
        <label>Character sheet images<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy||locked} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file).catch(()=>{})}}/></label>
        <button type="button" className="button secondary" disabled={busy||locked} onClick={()=>setPool(true)}>Add from assets</button>
        </section>
        <div className="character-anchor-grid">{['body_anchor_url','face_anchor_url'].map(key=><AnchorImageField key={key} label={key==='body_anchor_url'?'Body':'Face'} project={project} value={anchors[key]||''} references={refs} disabled={busy||locked} onSelect={ref=>setImages([...(record?.reference_ids||[]),...(ref?[ref]:[])],{...anchors,[key]:ref})} onFile={file=>upload(file,key)}/>)}</div>
       </CharacterAccordion>
       <CharacterAccordion number={3} title="Gear, Props & Weapons">{gear}</CharacterAccordion>
       <CharacterAccordion number={4} title="Style & Technical Details">{style}<CharacterQuickDetails project={project} manifest={draft} characterId={id} onSaved={async()=>{}}/>{details}</CharacterAccordion>
       <CharacterAccordion number={5} title="Advanced Prompts & Continuity">{advanced}<CharacterStates project={project} manifest={draft} characterId={id} onSaved={async()=>{}}/></CharacterAccordion>
      </>}/>
     }/>
    <CharacterAccordion number={6} title="Identity & Approved Customization"><ContinuityFields type="character" value={continuity} onChange={setContinuity}/>{created&&<AssetContinuity project={project} manifest={{...draft,revision:baseRevision.current}} assetId={id} onSaved={async next=>{operations.current=[];baseRevision.current=next.revision;publish(next);await onSaved(next)}}/>}</CharacterAccordion></fieldset>
   <ReferencePoolPicker project={project} manifest={draft} open={pool} selected={record?.reference_ids||[]} disabled={busy||locked} onChoose={async(asset:any)=>{setImages([...(record?.reference_ids||[]),asset.id]);setPool(false)}} onClose={()=>setPool(false)}/>
  </AssetAccordionLayout>
 </CharacterFormContext.Provider>;
}
