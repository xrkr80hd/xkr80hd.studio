'use client';
import {useState} from 'react';
import {LockKeyhole,UnlockKeyhole} from 'lucide-react';
export default function CharacterAnchorLock({project,manifest,asset,sourceId,onLocked}:{project:string,manifest:any,asset:any,sourceId:string,onLocked:(result:any)=>Promise<void>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const locked=asset.status==='LOCKED';
 async function toggle(){setBusy(true);setError('');try{const response=await fetch('/api/anchor-lock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project,asset_id:asset.asset_id||asset.id,source_image_id:sourceId,expected_revision:manifest.revision,action:locked?'unlock':'lock',confirm:true})});const result=await response.json();if(!response.ok)throw Error(result.error||'Could not update asset lock');await onLocked(result)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className="character-anchor-lock"><button type="button" className="button secondary" disabled={busy||!sourceId} onClick={()=>void toggle()}>{locked?<UnlockKeyhole size={15}/>:<LockKeyhole size={15}/>} {busy?(locked?'Unlocking…':'Locking…'):(locked?'Unlock asset':'Lock asset')}</button>{error&&<p className="error-text" role="alert">{error}</p>}</div>;
}
