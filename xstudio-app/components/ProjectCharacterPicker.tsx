'use client';
import {useState} from 'react';
import {sceneCastGroups} from '../lib/xce/scene-cast.mjs';
export default function ProjectCharacterPicker({manifest,value='',onChange,label='Character',exclude=[],includeCreatures=false,disabled=false}:{manifest:any;value?:string;onChange:(id:string)=>void;label?:string;exclude?:string[];includeCreatures?:boolean;disabled?:boolean}){
 const groups=sceneCastGroups(manifest).filter((g:any)=>includeCreatures||g.id!=='creatures');
 const [category,setCategory]=useState<string|null>(null),[search,setSearch]=useState('');
 // Existing clause targets hydrate their category; new selections always start with categories.
 const current=category===null?groups.find((g:any)=>g.records.some((a:any)=>a.id===value)):groups.find((g:any)=>g.id===category);
 const visible=(current?.records||[]).filter((a:any)=>!exclude.includes(a.id)&&String(a.name||'').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 return <div className="project-character-picker">
  {!current ? <label>Category<select value="" disabled={disabled} onChange={e=>{setCategory(e.target.value);setSearch('')}}><option value="">Choose category…</option>{groups.map((g:any)=><option key={g.id} value={g.id}>{g.label}</option>)}</select></label> : <section className="character-category-panel" aria-label={label}>
   <div className="character-category-header"><button type="button" className="button secondary" disabled={disabled} onClick={()=>{setCategory('');setSearch('')}}>← Categories</button><strong>{current.label}</strong></div>
   <label>Search<input type="search" disabled={disabled} value={search} placeholder="Find a character…" onChange={e=>setSearch(e.target.value)}/></label>
   <div className="character-category-list" key={current.id} role="group" aria-label={label}>
    {visible.length ? visible.map((a:any)=><button type="button" className="button secondary" key={a.id} disabled={disabled} aria-pressed={a.id===value} onClick={()=>onChange(a.id)}>{a.name}{a.id===value?' ✓':''}</button>) : <p role="status">No matching characters</p>}
   </div>
  </section>}
 </div>;
}
