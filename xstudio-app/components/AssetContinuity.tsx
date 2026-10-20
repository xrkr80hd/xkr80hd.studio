'use client';
import {useState} from 'react';
import {worldRecords} from '../lib/xce/world-library.mjs';
import {VEHICLE_FIELDS,vehicleViewList} from '../lib/xce/visual-identity.mjs';
import {studioFetch} from '../lib/xce/studio-network.mjs';
const checkNames=['body_configuration','paint','wheels_tires','grille_lights','trim_badges','interior_layout','seats_upholstery','modifications','camera'];
const freshChecks=()=>Object.fromEntries(checkNames.map(k=>[k,false]));
export function ContinuityFields({type,value,onChange}:{type:string,value:any,onChange:(next:any)=>void}){
 return <div>
  {type==='vehicle'&&<label>VIN (optional for custom vehicles)<input maxLength={17} value={value.vin||''} onChange={e=>onChange({...value,vin:e.target.value.toUpperCase()})}/></label>}
  <label>edit: requested customization<textarea rows={3} value={value.edit_instruction||''} onChange={e=>onChange({...value,edit_instruction:e.target.value})}/></label>
  <label>Instruction purpose<select value={value.intent||'modify'} onChange={e=>onChange({...value,intent:e.target.value})}><option value="modify">Apply only requested changes</option><option value="verify">Verify the existing details</option></select></label>
  <small>Save with this form. Base identity stays separate from requested changes; resolve the requested attributes before generation.</small>
 </div>;
}
export default function AssetContinuity({project,manifest,assetId,onSaved}:{project:string,manifest:any,assetId:string,onSaved:(next:any)=>Promise<any>}){
 const asset=worldRecords(manifest).find((r:any)=>r.id===assetId),vehicle=asset?.type==='vehicles',model=asset?.visual_identity;
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[vin,setVin]=useState(''),[instruction,setInstruction]=useState('');
 const [field,setField]=useState(vehicle?'seat_material':'costume_layers'),[value,setValue]=useState(''),[changes,setChanges]=useState<Record<string,any>>({});
 const [source,setSource]=useState(asset?.reference_ids?.[0]||''),[evidenceField,setEvidenceField]=useState('seat_rows'),[evidenceValue,setEvidenceValue]=useState('');
 const [sheetMode,setSheetMode]=useState(asset?.mode||'simple'),[sheetMedium,setSheetMedium]=useState(asset?.medium||'RL');
 const [ratio,setRatio]=useState('16:9'),[viewId,setViewId]=useState('front'),[output,setOutput]=useState(''),[checks,setChecks]=useState(freshChecks),[observations,setObservations]=useState(''),[lastPrompt,setLastPrompt]=useState('');
 const [sheetChecks,setSheetChecks]=useState<Record<string,boolean>>({face_identity:false,anatomy:false,wardrobe:false,format:false});
 const image=(id:string)=>'/api/manifest?'+new URLSearchParams({project,file:id});
 async function action(action:string,extra:any={}){
  setBusy(true);setError('');try{const response=await studioFetch('/api/continuity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project,asset_id:assetId,action,expected_revision:manifest.revision,confirm:true,...extra})}),result=await response.json();if(!response.ok)throw Error(result.error||'Continuity change failed');setLastPrompt(result.prompt||'');if(result.manifest)await onSaved(result.manifest);setInstruction('');setValue('');setChanges({})}catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 if(!asset)return <p>Save the asset first.</p>;
 const resolvedChanges=()=>({...changes,...(value.trim()?{[field]:field==='costume_layers'?value.split(',').map(v=>v.trim()).filter(Boolean):value}:{})});
 return <div>
  <p>{model?`${model.state} · Identity revision ${model.revision}`:'Use one saved identity across all reference angles and future scenes.'}</p>
  {!model?<>{vehicle&&<label>VIN (optional)<input value={vin} maxLength={17} onChange={e=>setVin(e.target.value.toUpperCase())}/></label>}<button type="button" className="button secondary" disabled={busy} onClick={()=>void action('establish',vin?{vin}:{})}>Establish identity from saved references</button></>:<>
   {model.vin&&<><p>VIN: {model.vin} · {model.vin_verification.status}</p>{model.vin_verification.status!=='verified'&&<button type="button" className="button secondary" disabled={busy} onClick={()=>void action('verify_vin')}>Retry VIN verification</button>}</>}
   <details><summary>Locked base and active appearance</summary><dl>{Object.entries(model.active_visual_reference).map(([key,v])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{Array.isArray(v)?v.join(', '):typeof v==='object'?JSON.stringify(v):String(v)}</dd></div>)}</dl></details>
   {vehicle&&<details><summary>Reference-backed vehicle specifications</summary>
    <p>Unverified factory details: {model.vin_verification.unverified_fields.join(', ').replaceAll('_',' ')||'None outstanding in the saved evidence list'}.</p>
    <label>Observed attribute<select value={evidenceField} onChange={e=>setEvidenceField(e.target.value)}>{VEHICLE_FIELDS.map(k=><option key={k} value={k}>{k.replaceAll('_',' ')}</option>)}</select></label>
    <label>Observed value<input value={evidenceValue} onChange={e=>setEvidenceValue(e.target.value)}/></label>
    <label>Evidence image<select value={source} onChange={e=>setSource(e.target.value)}><option value="">Choose assigned image</option>{(asset.reference_ids||[]).map((id:string)=><option key={id} value={id}>{manifest.references[id]?.name||id}</option>)}</select></label>
    <button type="button" className="button secondary" disabled={busy||!source||!evidenceValue.trim()} onClick={()=>void action('evidence',{evidence:[{field:evidenceField,value:evidenceValue,source_type:'reference_image',source_reference_id:source}]})}>Save observed specification</button>
   </details>}
   <label>edit: requested changes<textarea rows={3} value={instruction} onChange={e=>setInstruction(e.target.value)}/></label><button type="button" className="button secondary" disabled={busy||!instruction.trim()} onClick={()=>void action('edit',{instruction})}>Save requested edit</button>
   {model.approved_modifications.map((edit:any)=><div key={edit.id}><p>{edit.instruction} · {edit.status.replaceAll('_',' ')}</p>{edit.status==='pending_resolution'&&<>
    <label>Requested attribute<select value={field} onChange={e=>setField(e.target.value)}>{(vehicle?VEHICLE_FIELDS:['costume_layers','material_spec']).map(k=><option key={k} value={k}>{k.replaceAll('_',' ')}</option>)}</select></label>
    <label>Approved value<textarea value={value} onChange={e=>setValue(e.target.value)}/></label><small>Choose only explicitly requested attributes. Clothing layers list the complete approved outfit, separated by commas.</small>
    <button type="button" className="button secondary" disabled={busy||!value.trim()} onClick={()=>{setChanges(resolvedChanges());setValue('')}}>Add another requested attribute</button>
    {Object.keys(changes).length>0&&<p>{Object.keys(changes).map(k=>k.replaceAll('_',' ')).join(', ')}</p>}
    <button type="button" className="button secondary" disabled={busy||!Object.keys(resolvedChanges()).length} onClick={()=>void action('resolve_edit',{request_id:edit.id,changes:resolvedChanges()})}>Apply resolved changes</button>
   </>}</div>)}
   {model.discrepancies.filter((d:any)=>d.status==='unresolved').map((d:any,i:number)=><p role="alert" key={i}>Resolve {d.field}: reference says {String(d.reference_value)}, verified evidence says {String(d.verified_value)}. Use XCE to register a corrected reference or authorize the specific customization.</p>)}
   {!vehicle&&<div><label>Sheet layout<select value={sheetMode} onChange={e=>setSheetMode(e.target.value)}><option value="simple">Simple six-column sheet</option><option value="complex">Complex six-view sheet</option></select></label><label>Rendering style<select value={sheetMedium} onChange={e=>setSheetMedium(e.target.value)}><option value="RL">Realistic / live action</option><option value="CB">Comic book</option></select></label><button type="button" className="button secondary" disabled={busy} onClick={()=>void action('prepare_sheet',{mode:sheetMode,medium:sheetMedium})}>Prepare character sheet</button>{lastPrompt&&<label>Prepared character prompt<textarea rows={6} readOnly value={lastPrompt}/></label>}
    <label>Saved character sheet<select value={output} onChange={e=>setOutput(e.target.value)}><option value="">Choose output in this project</option>{Object.values(manifest.references||{}).filter((r:any)=>r.role!=='DIAGNOSTIC'&&!r.deleted_at).map((r:any)=><option key={r.id} value={r.id}>{r.name||r.id}</option>)}</select></label>
    {output&&<ReferenceImage src={image(output)} label="Character sheet being reviewed"/>}
    {Object.keys(sheetChecks).map(k=><label className="checkbox-choice" key={k}><input type="checkbox" checked={sheetChecks[k]} onChange={e=>setSheetChecks(v=>({...v,[k]:e.target.checked}))}/>{k.replaceAll('_',' ')} consistent</label>)}
    <label>Actual sheet inspection notes<textarea value={observations} onChange={e=>setObservations(e.target.value)}/></label>
    <button type="button" className="button secondary" disabled={busy||!output||!observations.trim()} onClick={()=>void action('record_sheet',{reference_id:output,expected_identity_revision:model.revision,sheet_checks:sheetChecks,observations})}>Record sheet review</button>
    {model.active_sheet&&<><ReferenceImage src={image(model.active_sheet.reference_id)} label="Reviewed character sheet"/><p>{model.active_sheet.status}</p>{model.active_sheet.status==='reviewed'&&<button type="button" className="button secondary" disabled={busy} onClick={()=>void action('approve_sheet',{reference_id:model.active_sheet.reference_id,approval_instruction:'Owner explicitly approved the displayed character sheet.'})}>Approve displayed character sheet</button>}</>}
   </div>}
   {vehicle&&<details><summary>Vehicle camera views</summary><label>Aspect ratio<input value={ratio} onChange={e=>setRatio(e.target.value)} placeholder="16:9"/></label>
    {vehicleViewList({...asset,asset_type:'vehicle'}).map(view=>{const saved=model.views[view.id];return <div key={view.id}><strong>{view.label}</strong><p>{view.camera}</p>{saved?.reference_id&&<><ReferenceImage src={image(saved.reference_id)} label={view.label}/><p>{saved.status.replaceAll('_',' ')}</p></>}
     {view.id==='rear_cabin'&&Number(model.active_visual_reference.seat_rows)===1?<button type="button" className="button secondary" disabled={busy} onClick={()=>void action('mark_view_not_applicable',{view_id:view.id,observations:'Saved evidence confirms one seating row; rear cabin does not exist.'})}>Mark no rear cabin</button>:<button type="button" className="button secondary" disabled={busy} onClick={()=>{setViewId(view.id);setChecks(freshChecks());setOutput('');setObservations('');void action('prepare_view',{view_id:view.id,aspect_ratio:ratio})}}>{saved?'Prepare this angle again':'Prepare this angle'}</button>}
     {saved?.status==='reviewed'&&<button type="button" className="button secondary" disabled={busy} onClick={()=>void action('record_view',{view_id:view.id,reference_id:saved.reference_id,approve:true,approval_instruction:'Owner explicitly approved the displayed '+view.label+' image.'})}>Approve displayed view</button>}
    </div>})}
    {lastPrompt&&<label>Prepared reference prompt<textarea rows={6} readOnly value={lastPrompt}/></label>}
    <details><summary>Review a generated view</summary><label>Prepared view<select value={viewId} onChange={e=>{setViewId(e.target.value);setChecks(freshChecks());setOutput('')}}>{vehicleViewList({...asset,asset_type:'vehicle'}).map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
     <label>Saved output image<select value={output} onChange={e=>setOutput(e.target.value)}><option value="">Choose output in this project</option>{Object.values(manifest.references||{}).filter((r:any)=>r.role!=='DIAGNOSTIC'&&!r.deleted_at).map((r:any)=><option key={r.id} value={r.id}>{r.name||r.id}</option>)}</select></label>
     {output&&<ReferenceImage src={image(output)} label="Output being reviewed"/>}
     {checkNames.map(k=><label className="checkbox-choice" key={k}><input type="checkbox" checked={checks[k]} onChange={e=>setChecks(v=>({...v,[k]:e.target.checked}))}/>{k.replaceAll('_',' ')} consistent (or not visible in this angle)</label>)}
     <label>Actual inspection notes<textarea value={observations} onChange={e=>setObservations(e.target.value)}/></label><button type="button" className="button secondary" disabled={busy||!output||!observations.trim()} onClick={()=>void action('record_view',{view_id:viewId,reference_id:output,expected_identity_revision:model.revision,checks,observations})}>Record this view&apos;s review</button>
    </details>
    <button type="button" className="button secondary" disabled={busy} onClick={()=>void action('finish_sheet',{aspect_ratio:ratio})}>Combine approved views</button>
    {model.combined_sheet&&<a className="button secondary" href={'/api/continuity?'+new URLSearchParams({project_id:project,asset_id:assetId,action:'sheet'})}>Download reference sheet</a>}
   </details>}
  </>}{error&&<p role="alert" className="error-text">{error}</p>}
 </div>;
}
function ReferenceImage({src,label}:{src:string,label:string}){return <a href={src}><img src={src} alt={label} loading="lazy" style={{width:'100%',maxHeight:260,objectFit:'contain'}}/></a>}
