'use client';
import OverlaySelect from './OverlaySelect';
// Shared by character creation and editing; persisted values remain RL / CB.
export default function VisualStyleSelect({value,onChange,disabled=false}:{value:string,onChange:(value:string)=>void,disabled?:boolean}){
 return <OverlaySelect aria-label="Visual style" value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}>{!value&&<option value="">Choose visual style</option>}<option value="RL">Realistic / live action</option><option value="CB">Comic book</option></OverlaySelect>;
}
