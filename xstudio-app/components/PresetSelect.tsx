'use client';
import OverlaySelect from './OverlaySelect';
import {presetOptions} from '../lib/xce/world-presets.mjs';
// Pick-from-list fields: no typing. A value saved before the lists existed stays selectable.
export default function PresetSelect({field,label,value,onChange,disabled=false}:{field:string;label:string;value:string;onChange:(value:string)=>void;disabled?:boolean}){
 const groups=(presetOptions(field)||{}) as Record<string,string[]>,all=Object.values(groups).flat(),multi=Object.keys(groups).length>1;
 return <label>{label}<OverlaySelect aria-label={label} value={value||''} disabled={disabled} onChange={e=>onChange(e.target.value)}>
  <option value="">Not set</option>
  {value&&!all.includes(value)&&<option value={value}>{value}</option>}
  {Object.entries(groups).flatMap(([group,items])=>[...(multi?[<option key={'g:'+group} value={'__'+group} disabled>{'— '+group+' —'}</option>]:[]),...items.map(item=><option key={group+':'+item} value={item}>{item}</option>)])}
 </OverlaySelect></label>;
}
