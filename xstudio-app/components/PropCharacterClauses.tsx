'use client';
import ProjectCharacterPicker from './ProjectCharacterPicker';
import {worldRecords} from '../lib/xce/world-library.mjs';
export type PropClause={character_id:string;text:string;enabled:boolean};
export default function PropCharacterClauses({manifest,value,onChange}:{manifest:any;value:PropClause[];onChange:(value:PropClause[])=>void}){
 const characters=worldRecords(manifest).filter((a:any)=>a.type==='characters'&&!a.deleted_at&&!manifest.manifest_store?.creatures?.[a.id]);
 const change=(index:number,patch:Partial<PropClause>)=>onChange(value.map((clause,i)=>i===index?{...clause,...patch}:clause));
 return <details className="form-accordion"><summary>Character clauses &amp; continuity</summary><p>Each clause applies only when this prop and the selected character are both in the scene.</p>{value.map((c,i)=><div className="character-link-row" key={i}><label className="clause-enable"><input type="checkbox" role="switch" className="xce-toggle" checked={c.enabled} onChange={e=>change(i,{enabled:e.target.checked})}/>Use this clause when together</label><ProjectCharacterPicker manifest={manifest} label="Applies with character" value={c.character_id} onChange={id=>change(i,{character_id:id})}/><label className="clause-text">Your clause<textarea rows={4} maxLength={2000} value={c.text} onChange={e=>change(i,{text:e.target.value})} placeholder="Write how this character uses, wears or carries this prop…"/></label><button type="button" className="button secondary" onClick={()=>onChange(value.filter((_,n)=>n!==i))}>Remove clause</button></div>)}<button type="button" className="button secondary" disabled={!characters.length||value.length>=50} onClick={()=>onChange([...value,{character_id:'',text:'',enabled:true}])}>+ Add character clause</button></details>;
}
