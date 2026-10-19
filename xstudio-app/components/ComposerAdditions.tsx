'use client';
import OverlaySelect from './OverlaySelect';
import {useId} from 'react';
import {additionOptions} from '../lib/xce/composer-presets.mjs';
type Option={label:string,value:string,group?:string};
export default function ComposerAdditions({field,label,values,onChange,disabled=false}:{field:string,label:string,values:string[],onChange:(v:string[])=>void,disabled?:boolean}){
 const id=useId(),options:Option[]=additionOptions(field),groups=[...new Set(options.map(o=>o.group||'Details'))];
 return <details className="comp-additions"><summary>{label}{values.length?' ('+values.length+')':''}</summary><label htmlFor={id}>Add a detail</label><OverlaySelect id={id} value="" disabled={disabled||values.length>=20} onChange={e=>{if(e.target.value&&!values.includes(e.target.value))onChange([...values,e.target.value]);}}><option value="">Choose an addition…</option>{groups.map(group=><optgroup key={group} label={group}>{options.filter(o=>(o.group||'Details')===group).map(o=><option key={o.value} value={o.value} disabled={values.includes(o.value)}>{o.label}</option>)}</optgroup>)}</OverlaySelect><div className="comp-addition-list">{values.map((value,i)=><div key={value}><span>{options.find(o=>o.value===value)?.label||value}</span><button type="button" disabled={disabled} aria-label={'Remove '+(options.find(o=>o.value===value)?.label||value)} onClick={()=>onChange(values.filter((_,j)=>i!==j))}>×</button></div>)}</div></details>;
}
