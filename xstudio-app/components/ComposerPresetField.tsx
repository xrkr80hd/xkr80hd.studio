'use client';
import {useId,useState} from 'react';
import {presetOptions,presetSelection} from '../lib/xce/composer-presets.mjs';

type Props={field:string,label:string,value:string,onChange:(value:string)=>void,disabled?:boolean,multiline?:boolean};
export default function ComposerPresetField({field,label,value,onChange,disabled=false,multiline=false}:Props){
 const id=useId(),[custom,setCustom]=useState(false),selection=presetSelection(field,value),isCustom=custom||selection==='__CUSTOM__';
 return <div className="comp-preset-field"><label htmlFor={id}>{label}</label><select id={id} value={isCustom?'__CUSTOM__':selection} disabled={disabled} onChange={e=>{if(e.target.value==='__CUSTOM__'){setCustom(true);return;}setCustom(false);onChange(e.target.value);}}><option value="">{field==='scene_action'?'Choose action (optional)':'Use reference / unspecified'}</option>{presetOptions(field).map((p:{label:string,value:string})=><option key={p.value} value={p.value}>{p.label}</option>)}<option value="__CUSTOM__">Custom…</option></select>{isCustom&&(multiline?<textarea aria-label={'Custom '+label.toLowerCase()} value={value} maxLength={2000} disabled={disabled} placeholder="Describe what happens. Use the names of your selected assets." onChange={e=>onChange(e.target.value)}/>:<input aria-label={'Custom '+label.toLowerCase()} value={value} maxLength={2000} disabled={disabled} onChange={e=>onChange(e.target.value)}/>)}</div>;
}
