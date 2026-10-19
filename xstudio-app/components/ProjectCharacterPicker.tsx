'use client';
import {useState} from 'react';
import {sceneCastGroups} from '../lib/xce/scene-cast.mjs';
export default function ProjectCharacterPicker({manifest,value='',onChange,label='Character',exclude=[],includeCreatures=false,disabled=false}:{manifest:any;value?:string;onChange:(id:string)=>void;label?:string;exclude?:string[];includeCreatures?:boolean;disabled?:boolean}){
 const groups=sceneCastGroups(manifest).filter((g:any)=>includeCreatures||g.id!=='creatures');
 const [category,setCategory]=useState(()=>groups.find((g:any)=>g.records.some((a:any)=>a.id===value))?.id||''),[search,setSearch]=useState('');
 const current=groups.find((g:any)=>g.id===category)||groups[0],visible=(current?.records||[]).filter((a:any)=>!exclude.includes(a.id)&&a.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 return <div className="project-character-picker"><label>Category<select value={current?.id||''} disabled={disabled} onChange={e=>{setCategory(e.target.value);setSearch('')}}>{groups.map((g:any)=><option key={g.id} value={g.id}>{g.label}</option>)}</select></label><label>Search<input type="search" disabled={disabled} value={search} placeholder="Find a character…" onChange={e=>setSearch(e.target.value)}/></label><label>{label}<select disabled={disabled} value={visible.some((a:any)=>a.id===value)?value:''} onChange={e=>{if(e.target.value)onChange(e.target.value)}}><option value="">{visible.length?'Choose a character…':'No matching characters'}</option>{visible.map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>;
}
