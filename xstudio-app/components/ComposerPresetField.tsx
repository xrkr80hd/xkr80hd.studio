'use client';
import OverlaySelect from './OverlaySelect';
import {useId,useState} from 'react';
import {presetOptions,presetSelection} from '../lib/xce/composer-presets.mjs';

type Props={field:string,label:string,value:string,onChange:(value:string)=>void,disabled?:boolean,multiline?:boolean};
export default function ComposerPresetField({field,label,value,onChange,disabled=false,multiline=false}:Props){
 const choices:{label:string,value:string,group?:string}[]=presetOptions(field),groups=[...new Set(choices.map(p=>p.group||'General'))];
 const id=useId(),[custom,setCustom]=useState(false),selection=presetSelection(field,value),isCustom=custom||selection==='__CUSTOM__';
 return <div className="comp-preset-field"><label htmlFor={id}>{label}</label><OverlaySelect id={id} value={isCustom?'__CUSTOM__':selection} disabled={disabled} onChange={e=>{if(e.target.value==='__CUSTOM__'){setCustom(true);return;}setCustom(false);onChange(e.target.value);}}><option value="">{field==='scene_action'?'Choose action (optional)':field==='world_inspiration'?'No world inspiration':'Use reference / unspecified'}</option><option value="__CUSTOM__">Write here…</option>{groups.map(group=><optgroup key={group} label={group}>{choices.filter(p=>(p.group||'General')===group).map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</optgroup>)}</OverlaySelect>{isCustom&&(multiline?<textarea aria-label={'Custom '+label.toLowerCase()} value={value} maxLength={2000} disabled={disabled} placeholder="Describe what happens. Use the names of your selected assets." onChange={e=>onChange(e.target.value)}/>:<input aria-label={'Custom '+label.toLowerCase()} value={value} maxLength={2000} disabled={disabled} placeholder={field==='environment.architecture'?'Write your architecture here…':'Write your own description here…'} onChange={e=>onChange(e.target.value)}/>)}</div>;
}
