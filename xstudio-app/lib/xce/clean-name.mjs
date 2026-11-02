// Turn an uploaded filename into a readable asset name, and spot names that say nothing.
const KEEP_UPPER=new Set(['NES','RAV4','CDJR','GMC','BMW','KIA','SUV','4X4','ANC','CP','RP','OR','TV','UI','HD','RL','CB','FF6','II','III','IV','VI']);
export function genericUploadName(raw){
 const n=String(raw||'').replace(/\.[a-z0-9]{2,5}$/i,'').replace(/\s*\[[^\]]*\]\s*/g,'').trim();
 return !n||/^(image|img|photo|picture|screenshot|signature|untitled|download|file)([\s_-]*(gen)?[\s_-]*\d*)?(\s*\(\d+\))*$/i.test(n)||/^image[\s_-]*gen[\s_-]*\d+(\s*\([^)]*\))*$/i.test(n)||/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(n)||/^[\d\s_()-]{3,}$/.test(n);
}
export function cleanUploadName(raw,fallback='Image'){
 let n=String(raw||'').replace(/\s*\[[^\]]*\]\s*/g,' ').replace(/\.(png|jpe?g|webp|gif|heic)\b/gi,'');
 n=n.replace(/\((\d+)\)/g,'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim().replace(/^[-\s.]+|[-\s.]+$/g,'');
 if(!n)return fallback;
 if(n===n.toUpperCase()&&/[A-Z]{3}/.test(n))n=n.split(' ').map(w=>KEEP_UPPER.has(w)||/\d/.test(w)?w:w.charAt(0)+w.slice(1).toLowerCase()).join(' ');
 return n.slice(0,200);
}
// What a library card shows: saved names stay as typed, raw filenames read as titles.
export function displayName(raw){
 const n=String(raw||'');
 if(!/\.(png|jpe?g|webp|gif|heic)\b|\[[^\]]*\]|_/i.test(n)&&!(n===n.toUpperCase()&&/[A-Z]{4}/.test(n)))return n;
 return cleanUploadName(n.replace(/^(FF6|STARTROPICS|SRT|CDJR|WA|MM|RAC)\s*-\s*/i,'').replace(/\s*-\s*(LOCATION|SCENE|VEHICLE|PROP|CHARACTER|STORY)\s+(REFERENCE|SCENE)(\s+DUPLICATE)?(\s+SCREENSHOT)?\s*(?=\.|\[|$)/i,''),n);
}
// Key for spotting look-alike names: "Figaro Castle", "Figaro Castle (2)" and "figaro castle v2" match.
export function nameKey(raw){return displayName(raw).toLowerCase().replace(/\((copy|\d+|[a-z])( - pick one)?\)|\bcopy\b|\bv\d+\b|\bduplicate\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
