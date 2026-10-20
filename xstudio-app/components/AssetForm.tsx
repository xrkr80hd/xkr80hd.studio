'use client';
import {useState,type ReactNode} from 'react';
import AssetAccordion from './AssetAccordion';
import AssetAccordionLayout from './AssetAccordionLayout';
import OverlaySelect from './OverlaySelect';
import VisualStyleSelect from './VisualStyleSelect';
import ReferenceThumbnail from './ReferenceThumbnail';
import ReferencePoolPicker from './ReferencePoolPicker';
import PropAssetCrop from './PropAssetCrop';
import AnchorImageField from './AnchorImageField';
import CharacterStates from './CharacterStates';
import PropCharacterClauses,{type PropClause} from './PropCharacterClauses';
import {CharacterRoleField} from './AssetDetails';
import {ASSET_FORM_FIELDS,ASSET_FORM_SECTIONS,assetFormKind} from '../lib/xce/asset-form-layout.mjs';
import {assetFormDraft} from '../lib/xce/asset-form.mjs';
import {assetMetadata,METADATA_FIELDS} from '../lib/xce/asset-metadata.mjs';
import {CLASSIFICATIONS,CLASSIFICATION_TYPES,classificationValue} from '../lib/xce/classifications.mjs';
import {worldRecords,WORLD_FIELDS,IMAGE_FIELDS} from '../lib/xce/world-library.mjs';
import {codedRecords} from '../lib/xce/asset-codes.mjs';
import {CHARACTER_GENDERS} from '../lib/xce/character-labels.mjs';
import {studioFetch} from '../lib/xce/studio-network.mjs';

type Props={project:string;manifest:any;assetId?:string;primaryCategory?:string;initial?:any;onSaved:(m:any,asset:any)=>Promise<any>;onClose:()=>void};
const labels:Record<string,string>={prop:'Prop',creature:'Creature',vehicle:'Vehicle',location:'Location',room:'Room',wardrobe:'Wardrobe'};
export default function AssetForm({project,manifest,assetId,primaryCategory='prop',initial,onSaved,onClose}:Props){
 const [id]=useState(()=>assetId||initial?.id||crypto.randomUUID());
 const [snapshot,setSnapshot]=useState(()=>assetId?structuredClone(manifest):assetFormDraft(manifest,id,primaryCategory));
 const [created,setCreated]=useState(!!assetId),[baseRevision,setBaseRevision]=useState(manifest.revision);
 const record=worldRecords(snapshot).find((a:any)=>a.id===id),primary=codedRecords(snapshot).find((e:any)=>(e.record.asset_id||e.record.id)===id)?.type||primaryCategory;
 const saved=assetMetadata(snapshot,project,baseRevision,id);
 const [values,setValues]=useState<Record<string,string>>(()=>({...Object.fromEntries([...Object.keys(METADATA_FIELDS),...Object.keys(ASSET_FORM_FIELDS),'quick_details','cast_role'].map(key=>[key,(saved.fields as any)[key]||''])),display_name:record?.name||initial?.name||''}));
 const [classification,setClassification]=useState(()=>classificationValue(snapshot,id)||({weapons:'weapon',magical_beings:'magical_being',beasts:'creature_beast'} as Record<string,string>)[initial?.library_category]||'');
 const [references,setReferences]=useState<string[]>(()=>record?.reference_ids?.length?record.reference_ids:initial?.reference_ids||[]);
 const [metadata,setMetadata]=useState<Record<string,string>>(()=>({...record?.metadata,...(!record?.metadata?.style_anchor&&record?.medium?{style_anchor:record.medium}:{})}));
 const [prompt,setPrompt]=useState(saved.generation_prompt.text),[gender,setGender]=useState(snapshot.character_network?.details?.[id]?.gender||'unspecified');
 const [clauses,setClauses]=useState<PropClause[]>(snapshot.asset_details?.[id]?.clauses||[]);
 const [equipment,setEquipment]=useState<string[]>(snapshot.asset_details?.[id]?.equipment_ids||[]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[pool,setPool]=useState(false);
 const kind=assetFormKind(primary,classification),locked=record?.status==='LOCKED',assetLabel=classification==='weapon'?'Weapon':classification==='equipment'?'Equipment':classification==='magical_being'?'Magical Being':labels[primary]||'Asset';
 const entries=Object.values(snapshot.references||{}) as any[],inventory=worldRecords(snapshot).filter((a:any)=>a.type==='props'&&!a.deleted_at);
 const nativeKeys=(WORLD_FIELDS as any)[record?.type]||(WORLD_FIELDS as any)[({creature:'characters',prop:'props',vehicle:'vehicles',location:'locations',room:'rooms',wardrobe:'wardrobe'} as any)[primary]]||[];
 const url=(ref:string)=>'/api/manifest?'+new URLSearchParams({project,file:ref});
 function update(key:string,value:string){setValues(v=>({...v,[key]:value}));setMessage('')}
 function anchor(key:string,value:string){setMetadata(v=>({...v,[key]:value}));if(value)setReferences(ids=>[...new Set([...ids,value])])}
 async function upload(file:File,key?:string){setBusy(true);setError('');try{
  const data=new FormData();data.set('project_id',project);data.set('file',file);data.set('role',primary==='creature'?'IDENTITY':['location','room'].includes(primary)?'LOCATION':'PROP');data.set('asset_name',file.name);
  const r=await studioFetch('/api/upload',{method:'POST',body:data}),result=await r.json();if(!r.ok)throw Error(result.error||'Upload failed');
  const reload=await studioFetch('/api/manifest?project='+encodeURIComponent(project));if(!reload.ok)throw Error('Image uploaded; reopen to refresh project references');const fresh=await reload.json();
  if(created&&(JSON.stringify(worldRecords(fresh).find((a:any)=>a.id===id))!==JSON.stringify(record)||JSON.stringify(fresh.asset_details?.[id])!==JSON.stringify(snapshot.asset_details?.[id])))throw Error('This asset changed while uploading. Reopen it before saving; the uploaded image is in project assets.');
  setSnapshot((m:any)=>({...m,references:fresh.references}));setBaseRevision(fresh.revision);setReferences(ids=>[...new Set([...ids,result.reference_id])]);if(key)anchor(key,result.reference_id);
 }catch(e){setError((e as Error).message);throw e}finally{setBusy(false)}}
 async function save(lockAction=false){setBusy(true);setError('');setMessage('');try{
  const patch=Object.fromEntries(Object.entries(values).filter(([key,value])=>value!==(saved.fields as any)[key]));
  const originalMetadata={...record?.metadata,...(!record?.metadata?.style_anchor&&record?.medium?{style_anchor:record.medium}:{})};
  const anchorPatch=Object.fromEntries(Object.entries(metadata).filter(([key,value])=>nativeKeys.includes(key)&&value!==(originalMetadata[key]||'')));
  const payload={action:'asset_form',project_id:project,asset_id:id,primary_category:primary,create:!created,expected_revision:baseRevision,confirm:true,metadata_patch:patch,expected_metadata_version:saved.version,
   ...(JSON.stringify(references)!==JSON.stringify(record?.reference_ids||[])?{reference_ids:references}:{}),...(Object.keys(anchorPatch).length?{world_metadata:anchorPatch}:{}),
   ...(classification!==classificationValue(snapshot,id)?{classification,expected_classification_version:snapshot.asset_details?.[id]?.classification_version||0}:{}),
   ...(gender!==(snapshot.character_network?.details?.[id]?.gender||'unspecified')?{gender}:{}),
   ...(JSON.stringify(equipment)!==JSON.stringify(snapshot.asset_details?.[id]?.equipment_ids||[])?{equipment_ids:equipment}:{}),
   ...(JSON.stringify(clauses)!==JSON.stringify(snapshot.asset_details?.[id]?.clauses||[])?{clauses}:{}),
   ...(prompt!==saved.generation_prompt.text?{generation_prompt:prompt,expected_prompt_version:saved.generation_prompt.version}:{})};
  const r=await studioFetch('/api/composer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),result=await r.json();if(!r.ok)throw Error(result.error||'Asset not saved');
  let next=result.manifest;
  if(lockAction){
   const r=await studioFetch('/api/anchor-lock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project,asset_id:id,source_image_id:record?.source_image_id||references[0],expected_revision:next.revision,action:locked?'unlock':'lock',confirm:true})});
   const result=await r.json();if(!r.ok){setSnapshot(next);setBaseRevision(next.revision);setCreated(true);throw Error('Asset saved. '+(result.error||'Lock change failed'));}
   const reload=await studioFetch('/api/manifest?project='+encodeURIComponent(project));if(!reload.ok){setSnapshot(next);setBaseRevision(next.revision);setCreated(true);throw Error('Asset saved. Reopen to refresh lock status');}next=await reload.json();
  }
  setSnapshot(next);setBaseRevision(next.revision);setCreated(true);setMessage(assetLabel+' saved.');await onSaved(next,worldRecords(next).find((a:any)=>a.id===id));
 }catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 function referenceFields(){const images=references.filter(ref=>kind!=='character'||![metadata.body_anchor_url,metadata.face_anchor_url].includes(ref));return <>
  {kind==='character'&&<div className="character-anchor-grid">{['body_anchor_url','face_anchor_url'].map(key=><AnchorImageField key={key} label={key==='body_anchor_url'?'Body':'Face'} project={project} value={metadata[key]||''} references={entries} disabled={busy||locked} onSelect={value=>anchor(key,value)} onFile={file=>upload(file,key)}/>)}</div>}
  <div className="asset-sheet-previews">{images.map(ref=><div key={ref}><ReferenceThumbnail src={url(ref)} label={kind==='character'?'Character sheet':'Asset reference'}/><button type="button" className="text-button" disabled={busy||locked} onClick={()=>{setReferences(ids=>ids.filter(id=>id!==ref));setMetadata(m=>Object.fromEntries(Object.entries(m).map(([k,v])=>[k,IMAGE_FIELDS.includes(k)&&v===ref?'':v])))}}>Remove</button></div>)}</div>
  <label>{kind==='character'?'Character sheet images':'Upload reference image'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy||locked} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file).catch(()=>{})}}/></label>
  <button type="button" className="button secondary" disabled={busy||locked} onClick={()=>setPool(true)}>Add from assets</button>
  {primary==='prop'&&<PropAssetCrop project={project} manifest={snapshot} disabled={busy||locked} onCrop={upload}/>}
 </>}
 function worldField(key:string){return <label key={key}>{key.replaceAll('_url',' image').replaceAll('_',' ')}{IMAGE_FIELDS.includes(key)||['parent_location_id','parent_character_id'].includes(key)?<OverlaySelect value={metadata[key]||''} disabled={busy||locked} onChange={e=>setMetadata(m=>({...m,[key]:e.target.value}))}><option value="">Choose {IMAGE_FIELDS.includes(key)?'reference':'parent'}</option>{(IMAGE_FIELDS.includes(key)?references.map(ref=>({id:ref,name:snapshot.references[ref]?.name||ref})):worldRecords(snapshot).filter((a:any)=>a.type===(key==='parent_location_id'?'locations':'characters')&&a.id!==id)).map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}</OverlaySelect>:<textarea rows={2} disabled={busy||locked} value={metadata[key]||''} onChange={e=>setMetadata(m=>({...m,[key]:e.target.value}))}/>}</label>}
 function field(key:string):ReactNode{
  if(key==='name')return <label>Name<input required maxLength={200} value={values.display_name} onChange={e=>update('display_name',e.target.value)}/></label>;
  if(key==='relationships')return primary==='prop'?<PropCharacterClauses manifest={snapshot} value={clauses} onChange={setClauses}/>:null;
  if(key==='classification')return <label>Classification<OverlaySelect value={classification} onChange={e=>setClassification(e.target.value)}><option value="">Unclassified</option>{Object.entries(CLASSIFICATIONS).filter(([key])=>(CLASSIFICATION_TYPES as any)[key].includes(primary)).map(([key,label])=><option key={key} value={key}>{label}</option>)}</OverlaySelect></label>;
  if(key==='references')return referenceFields();
  if(['body_anchor_url','face_anchor_url'].includes(key))return null;
  if(key==='role')return <CharacterRoleField value={values.cast_role||'general'} onChange={v=>update('cast_role',v)}/>;
  if(key==='gender')return <label>Gender<OverlaySelect value={gender} onChange={e=>setGender(e.target.value)}>{Object.entries(CHARACTER_GENDERS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</OverlaySelect></label>;
  if(key==='inventory')return <><div className="character-category-list">{inventory.map((a:any)=><label className="checkbox-choice" key={a.id}><input type="checkbox" checked={equipment.includes(a.id)} onChange={e=>setEquipment(ids=>e.target.checked?[...new Set([...ids,a.id])]:ids.filter(id=>id!==a.id))}/>{a.name}</label>)}</div><small aria-live="polite">{equipment.length} selected</small></>;
  if(key==='visual_style')return <label>Visual Style<VisualStyleSelect value={metadata.style_anchor||''} disabled={locked} onChange={v=>setMetadata(m=>({...m,style_anchor:v}))}/></label>;
  if(key==='lighting_preset')return worldField(key);
  if(key==='world_metadata')return <>{nativeKeys.filter((k:string)=>!['style_anchor','lighting_preset','face_anchor_url','body_anchor_url'].includes(k)).map(worldField)}</>;
  if(key==='generation_prompt')return <label>Generation Prompt<textarea rows={4} maxLength={30000} value={prompt} onChange={e=>setPrompt(e.target.value)}/><small>Version {saved.generation_prompt.version}. Original prompts stay in version history.</small></label>;
  if(key==='status')return <div className="step-hint">Reference / Approval Status: {record?.status||'DRAFT'} · {saved.reference_status.approved_reference_ids.length} approved reference(s)</div>;
  if(key==='alternate_forms')return created?<CharacterStates project={project} manifest={snapshot} characterId={id} onSaved={async()=>{const r=await studioFetch('/api/manifest?project='+encodeURIComponent(project));if(!r.ok)throw Error('Reload to refresh forms');const next=await r.json();setSnapshot(next);setBaseRevision(next.revision);await onSaved(next,worldRecords(next).find((a:any)=>a.id===id))}}/>:<small>Save this asset to attach alternate forms.</small>;
  const label=({...METADATA_FIELDS,...ASSET_FORM_FIELDS,quick_details:'Quick Details'} as Record<string,string>)[key];
  return label?<label>{label}<textarea rows={2} maxLength={key==='quick_details'?4000:10000} value={values[key]||''} onChange={e=>update(key,e.target.value)}/></label>:null;
 }
 return <AssetAccordionLayout label={(created?'Edit ':'Create ')+assetLabel} footer={<>
  {error&&<p role="alert" className="error-text">{error}</p>}{message&&<p role="status">{message}</p>}
  <div className="character-creator-actions"><button type="button" className="button primary" disabled={busy} onClick={()=>void save()}>{busy?'Saving…':(created?'Save ':'Create ')+assetLabel}</button><button type="button" className="button secondary" disabled={busy||!references.length} onClick={()=>void save(true)}>{locked?'Save & unlock':'Save & lock'}</button><button type="button" className="button secondary character-creator-close" disabled={busy} onClick={onClose}>Close</button></div>
 </>}>
  <fieldset disabled={busy} className="character-creator-fieldset">{(ASSET_FORM_SECTIONS[kind] as Array<[string,string[]]>).map(([title,keys],index)=><AssetAccordion key={kind+':'+title} number={index+1} title={title} defaultOpen={index===0}>{(keys as string[]).map(key=><div className="asset-field-slot" key={key}>{field(key)}</div>)}</AssetAccordion>)}</fieldset>
  <ReferencePoolPicker project={project} manifest={snapshot} open={pool} selected={references} disabled={busy||locked} onChoose={async(a:any)=>{setReferences(ids=>[...new Set([...ids,a.id])]);setPool(false)}} onClose={()=>setPool(false)}/>
 </AssetAccordionLayout>;
}
