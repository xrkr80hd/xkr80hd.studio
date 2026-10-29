'use client';
import {useEffect,useState,useSyncExternalStore} from 'react';
import {ChevronDown,Copy,Eye,Plus,X} from 'lucide-react';
import {studioFetch} from '../lib/xce/studio-network.mjs';

type Link={id:string,project:string,expires_at:string};
type Entry={link:Link|null,url:string|null};

// Tiny shared store so the panel and the header badge stay in sync.
const state=new Map<string,Entry>();
const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(l=>l());
const subscribe=(l:()=>void)=>{listeners.add(l);return()=>{listeners.delete(l)}};
const EMPTY:Entry={link:null,url:null};
function setEntry(project:string,entry:Entry){
 state.set(project,entry);
 // The full link is only shown once by the server; keep it on this device so it can be copied again until it ends.
 try{if(entry.link&&entry.url)localStorage.setItem('xstudio:showcase:'+project,JSON.stringify(entry));else localStorage.removeItem('xstudio:showcase:'+project)}catch{/* storage unavailable */}
 emit();
}
function cached(project:string,id:string):string|null{
 try{const raw=localStorage.getItem('xstudio:showcase:'+project);if(!raw)return null;const e=JSON.parse(raw) as Entry;return e.link?.id===id?e.url:null}catch{return null}
}
function useEntry(project:string){return useSyncExternalStore(subscribe,()=>state.get(project)||EMPTY,()=>EMPTY)}
function useNow(active:boolean){
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{if(!active)return;const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[active]);
 return now;
}
const clock=(ms:number)=>{const s=Math.max(0,Math.floor(ms/1000));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;return (h?h+':'+String(m).padStart(2,'0'):String(m))+':'+String(r).padStart(2,'0')};

async function call(body:object){
 const r=await studioFetch('/api/showcase',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data:any=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||'Showcase unavailable.');
 return data as {link:Link|null,url?:string};
}

/** Small "Live · 24:12" pill for the project header. Renders nothing when no link is live. */
export function ShowcaseBadge({project}:{project:string}){
 const {link}=useEntry(project);
 const now=useNow(Boolean(link));
 if(!link)return null;
 const left=Date.parse(link.expires_at)-now;
 if(left<=0)return null;
 return <span className="showcase-badge" title="This project has a live Showcase folder link"><span aria-hidden="true"/>Live · {clock(left)}</span>;
}

export default function ShowcaseFolder({project,title}:{project:string,title:string}){
 const {link,url}=useEntry(project);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 const now=useNow(Boolean(link));
 const left=link?Date.parse(link.expires_at)-now:0;
 const live=Boolean(link&&left>0);

 useEffect(()=>{let on=true;setError('');
  call({action:'status',project_id:project}).then(r=>{if(on)setEntry(project,{link:r.link,url:r.link?cached(project,r.link.id):null})}).catch(()=>{/* panel still works; status is best effort */});
  return()=>{on=false};
 },[project]);
 useEffect(()=>{if(link&&left<=0)setEntry(project,EMPTY)},[link,left,project]);

 async function run(body:object){
  setBusy(true);setError('');setCopied(false);
  try{const r=await call(body);setEntry(project,{link:r.link,url:r.url??(r.link?url:null)});return r}
  catch(e){setError((e as Error).message);return null}
  finally{setBusy(false)}
 }
 async function copy(){if(!url)return;try{await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setError('Copy unavailable here. Press and hold the link to copy it.')}}

 return <details className="panel workflow-step help-section showcase-folder">
  <summary><span><strong>Showcase folder</strong><small>{live?'Live now · ends in '+clock(left):'A temporary, read-only link you can paste into ChatGPT or Gemini.'}</small></span>{live&&<span className="showcase-badge"><span aria-hidden="true"/>Live</span>}<ChevronDown size={19}/></summary>
  <div className="accordion-content">
   <p className="step-description">Shares only <strong>{title}</strong>'s images and names for 30 minutes. Anyone with the link can view them, nothing can be edited, and the link and every image stop working when time runs out.</p>
   <div className="button-row">
    <button type="button" className="button primary" disabled={busy} onClick={()=>run({action:'create',project_id:project})}><Eye size={16}/>{live?'New link':'Showcase folder'}</button>
   </div>
   {live&&link&&<div className="showcase-live">
    {url?<div className="showcase-link"><input readOnly value={url} aria-label="Showcase link" onFocus={e=>e.currentTarget.select()}/><button type="button" className="button secondary" onClick={copy}><Copy size={16}/>{copied?'Copied':'Copy'}</button></div>
     :<p className="step-hint">This link was created on another device or before a reload, so it can't be shown again. Tap <strong>New link</strong> to replace it.</p>}
    <div className="button-row showcase-controls">
     <span className="showcase-timer" role="timer" aria-live="off">Ends in {clock(left)}</span>
     <button type="button" className="button secondary" disabled={busy} onClick={()=>run({action:'extend',id:link.id})}><Plus size={16}/>30 min</button>
     <button type="button" className="button secondary" disabled={busy} onClick={()=>run({action:'kill',id:link.id})}><X size={16}/>Kill now</button>
    </div>
   </div>}
   {error&&<p role="alert" className="error-text step-hint">{error}</p>}
   <p className="step-hint">Making a new link ends the old one. Kill now stops the page immediately; an image someone already had open can keep loading for up to 10 more minutes. Links never last more than 24 hours, even with extensions. An AI that opened the link while it was live may keep its own copy of what it saw.</p>
  </div>
 </details>;
}
