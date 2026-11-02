'use client';
import OverlaySelect from './OverlaySelect';
import {POWER_TIERS} from '../lib/xce/world-presets.mjs';
// How dangerous the character reads on screen; adds matching direction to AI video prompts.
export default function PowerTierField({value,onChange}:{value:string;onChange:(value:string)=>void}){
 return <label>On-screen Power<OverlaySelect aria-label="On-screen Power" value={value||''} onChange={e=>onChange(e.target.value)}>{Object.entries(POWER_TIERS as Record<string,{label:string}>).map(([key,t])=><option key={key||'none'} value={key}>{t.label}</option>)}</OverlaySelect></label>;
}
