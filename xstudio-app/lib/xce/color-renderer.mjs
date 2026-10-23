import {CONTROL_RANGES,NEUTRAL_SETTINGS} from './color-grades.mjs';
const clamp=v=>Math.min(1,Math.max(0,v));
// Deterministic sRGB creative transform; NOT a camera transform or a true LUT.
// Signed controls [-100,100], grain [0,100], haze fixed 0. All neutral values are 0.
// Temperature shifts R/B by +/-0.12; contrast slope 2^(value/100), saturation
// multiplier 1+value/100, tint uses palette vectors weighted by luminance,
// black level +/-0.15, grain fixed pixel hash +/-0.04. Intensity mixes RGB.
export function renderGrade(source,grade,intensity=grade.intensity){
 if(!Number.isFinite(intensity)||intensity<0||intensity>100)throw Error('Invalid intensity');
 const out=new Uint8ClampedArray(source);if(!intensity)return out;
 const s={...NEUTRAL_SETTINGS,...grade.settings};for(const [k,[lo,hi]]of Object.entries(CONTROL_RANGES))if(!Number.isFinite(s[k])||s[k]<lo||s[k]>hi)throw Error('Invalid '+k);
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),sh=rgb(grade.palette.shadows),hl=rgb(grade.palette.highlights);const mix=intensity/100;
 for(let i=0;i<out.length;i+=4){const orig=[source[i]/255,source[i+1]/255,source[i+2]/255];let v=orig.map((x,c)=>x+(c===0?1:c===2?-1:0)*s.temperature/100*.12);let l=.2126*v[0]+.7152*v[1]+.0722*v[2];v=v.map(x=>l+(x-l)*(1+s.saturation/100));v=v.map((x,c)=>(x-.5)*2**(s.contrast/100)+.5+s.blackLevel/100*.15+(sh[c]-(sh[0]+sh[1]+sh[2])/3)*(1-clamp(l))**2*s.shadowTint/100*.5+(hl[c]-(hl[0]+hl[1]+hl[2])/3)*clamp(l)**2*s.highlightTint/100*.5);let h=(i/4+1)>>>0;h=Math.imul(h^(h>>>16),0x45d9f3b);h=Math.imul(h^(h>>>16),0x45d9f3b);const hash=((h^(h>>>16))>>>0)/4294967295;v=v.map(x=>clamp(x+(hash-.5)*.08*s.grain/100));for(let c=0;c<3;c++)out[i+c]=Math.round((orig[c]*(1-mix)+v[c]*mix)*255)}return out;
}
export function estimateGrade(pixels,base){let r=0,g=0,b=0,n=0,min=255,max=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<128)continue;r+=pixels[i];g+=pixels[i+1];b+=pixels[i+2];min=Math.min(min,pixels[i],pixels[i+1],pixels[i+2]);max=Math.max(max,pixels[i],pixels[i+1],pixels[i+2]);n++}if(!n)throw Error('Reference has no visible pixels');return {...structuredClone(base),description:'Estimated from reference image; not an exact LUT or camera transform.',settings:{...base.settings,temperature:Math.round(Math.max(-100,Math.min(100,(r-b)/n/2))),contrast:Math.round((max-min)/255*30-15),haze:0},extraction:{estimated:true,method:'Global RGB statistics; scene and lighting influence this estimate.'}}}
