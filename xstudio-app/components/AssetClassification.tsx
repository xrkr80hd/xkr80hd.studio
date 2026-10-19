'use client';
import {useEffect,useState} from 'react';
import OverlaySelect from './OverlaySelect';
import {CLASSIFICATIONS,CLASSIFICATION_TYPES,classificationRows} from '../lib/xce/classifications.mjs';
import {studioFetch} from '../lib/xce/studio-network.mjs';
export default function AssetClassification({project,manifest,assetId,onSaved}:{project:string,manifest:any,assetId:string,onSaved:()=>Promise<any>}){
 const row=classificationRows(manifest,project,manifest.revision).find((r:any)=>r.asset_id===assetId);
 const [value,setValue]=useState(row?.secondary_classification||''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{setValue(row?.secondary_classification||'')},[assetId,row?.secondary_classification]);
 if(!row)return null;
 async function save(){if(!row)return;setBusy(true);setMessage('');try{const r=await studioFetch('/api/composer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'classify',project_id:project,asset_id:assetId,classification:value,expected_version:row.version,expected_revision:manifest.revision,confirm:true})});const d=await r.json();if(!r.ok||!d.results?.[0]?.ok)throw Error(d.error||d.results?.[0]?.error||'Classification not saved');await onSaved();setMessage('Classification saved.')}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <div className="story-field"><label>Classification<OverlaySelect disabled={busy} value={value} onChange={e=>setValue(e.target.value)}><option value="">Unclassified</option>{Object.entries(CLASSIFICATIONS).filter(([key])=>(CLASSIFICATION_TYPES as any)[key].includes(row.primary_category)).map(([key,label])=><option key={key} value={key}>{label}</option>)}</OverlaySelect></label><button type="button" className="button secondary" disabled={busy||value===row.secondary_classification} onClick={()=>void save()}>{busy?'Saving…':'Save classification'}</button>{message&&<p role="status">{message}</p>}</div>;
}
