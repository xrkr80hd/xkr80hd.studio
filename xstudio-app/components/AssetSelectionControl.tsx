'use client';
export default function AssetSelectionControl({active,checked,label,disabled=false,onToggle}:{active:boolean;checked:boolean;label:string;disabled?:boolean;onToggle:()=>void}){
 if(!active)return null;
 return <label className="asset-select selecting"><input type="checkbox" checked={checked} disabled={disabled} aria-label={'Select '+label} onChange={onToggle}/><span>{checked?'Selected':'Select'}</span></label>;
}
