'use client';
import OverlaySelect from './OverlaySelect';
import {useCallback,useEffect,useState} from 'react';
// One place to plug any AI into XSTUDIO: ChatGPT and Claude sign in over OAuth, other tools use a key.
const GUIDES=[
 {id:'chatgpt',name:'ChatGPT',steps:['In ChatGPT open Settings → Apps & Connectors → Advanced settings and turn on Developer mode (Business, Enterprise and Edu admins may need to allow it first).','Back in Apps & Connectors choose Create (some workspaces: Workspace settings → Apps → Create).','Name it XSTUDIO, paste the server link below and choose OAuth sign-in.','Sign in to XSTUDIO when asked and approve access, then finish with Create.','In a chat, open + → More, pick XSTUDIO, and select your World Builder plugin. Say push to send results here.'],note:'Menu names move around between ChatGPT releases; look for Apps & Connectors and Developer mode.'},
 {id:'claude',name:'Claude',steps:['In Claude open Customize → Connectors and choose Add custom connector (Team and Enterprise owners: Organization settings → Connectors → Add → Custom).','Name it XSTUDIO and paste the server link below.','Leave sign-in on the detected OAuth setting and choose Add, then Connect.','Sign in to XSTUDIO and approve access.','In any chat use + → Connectors to switch XSTUDIO on, and turn on World Builder.']},
 {id:'claudecode',name:'Claude Code',steps:['In a terminal run the command below.','Run /mcp inside Claude Code and sign in to XSTUDIO when it asks.'],command:'claude mcp add --transport http xstudio '},
 {id:'other',name:'Other tools',steps:['Gemini, Grok, Google Flow and other tools without OAuth sign-in use a key.','Create a key below, copy it once, and paste it into that tool as a bearer token.','Keys last 30 days and can be revoked any time.']}
];
export default function ConnectionsPanel(){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[label,setLabel]=useState(''),[provider,setProvider]=useState('gemini'),[customProvider,setCustomProvider]=useState(''),[token,setToken]=useState(''),[tokenName,setTokenName]=useState(''),[copied,setCopied]=useState(''),[guide,setGuide]=useState('chatgpt'),[origin,setOrigin]=useState('https://xstudio.xrkr80hd.studio');
 const server=origin+'/mcp',active=GUIDES.find(g=>g.id===guide);
 const refresh=useCallback(async()=>{const r=await fetch('/api/integrations/tokens',{cache:'no-store'});const j=await r.json();if(!r.ok)throw Error(j.error||'Connections unavailable');setItems(j.credentials||[])},[]);
 useEffect(()=>{setOrigin(location.origin);refresh().catch(e=>setError(e.message))},[refresh]);
 async function copy(text,key){try{await navigator.clipboard.writeText(text);setCopied(key);setTimeout(()=>setCopied(c=>c===key?'':c),2000)}catch{setError('Select the text and copy it manually.')}}
 async function create(event){event.preventDefault();setBusy(true);setError('');setToken('');try{const r=await fetch('/api/integrations/tokens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:label.trim(),provider:(provider==='other'?customProvider:provider).trim().toLowerCase(),scopes:['asset:read','asset:write'],expires_in_days:30})});const j=await r.json();if(!r.ok||!j.token)throw Error(j.error||'Could not create token');setToken(j.token);setTokenName(j.credential?.label||label.trim());setLabel('');setCustomProvider('');await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function revoke(id){if(!window.confirm('Revoke access for this connection?'))return;setBusy(true);setError('');try{const r=await fetch('/api/integrations/tokens?id='+encodeURIComponent(id),{method:'DELETE'});const j=await r.json();if(!r.ok||!j.revoked)throw Error(j.error||'Could not revoke connection');await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <main className="standalone-page connect-ai">
  <div className="button-row"><a className="button secondary" href="/">← Back to studio</a></div>
  <h1>Connect your AI</h1>
  <p className="step-hint">Link ChatGPT or Claude once. Your AI then reads your worlds, characters and locations straight from XSTUDIO and saves results back here, no downloading or copy-paste.</p>
  {error&&<p role="alert" className="error-text">{error}</p>}
  <section className="panel connect-server"><h2>Your XSTUDIO server link</h2><div className="connect-copy"><code>{server}</code><button type="button" className="button primary" onClick={()=>copy(server,'server')}>{copied==='server'?'Copied':'Copy link'}</button></div></section>
  <div className="tabs connect-tabs" role="tablist" aria-label="Choose your AI">{GUIDES.map(g=><button key={g.id} type="button" role="tab" aria-selected={guide===g.id} className={guide===g.id?'active':''} onClick={()=>setGuide(g.id)}>{g.name}</button>)}</div>
  <section className="panel connect-guide" role="tabpanel" aria-label={active.name+' steps'}>
   <ol>{active.steps.map((s,i)=><li key={i}>{s}</li>)}</ol>
   {active.command&&<div className="connect-copy"><code>{active.command+server}</code><button type="button" className="button secondary" onClick={()=>copy(active.command+server,'cmd')}>{copied==='cmd'?'Copied':'Copy command'}</button></div>}
   {active.note&&<p className="step-hint">{active.note}</p>}
   {guide==='other'&&<form className="connect-key-form" onSubmit={create}>
    <label className="story-field">Connection name<input required maxLength={80} value={label} onChange={e=>setLabel(e.target.value)} placeholder="Gemini on laptop"/></label>
    <label className="story-field">Tool<OverlaySelect value={provider} onChange={e=>setProvider(e.target.value)}><option value="gemini">Gemini</option><option value="grok">Grok</option><option value="flow">Google Flow</option><option value="videoexpress">Video Express AI</option><option value="gpt">ChatGPT (key instead of sign-in)</option><option value="other">Other tool</option></OverlaySelect></label>
    {provider==='other'&&<label className="story-field">Tool code<input required maxLength={80} pattern="[a-zA-Z0-9][a-zA-Z0-9_-]*" title="Letters, numbers, underscores or hyphens; no spaces." value={customProvider} onChange={e=>setCustomProvider(e.target.value)}/></label>}
    <button type="submit" className="button primary" disabled={busy}>{busy?'Working…':'Create key'}</button>
   </form>}
   {token&&<div role="status" className="connect-new-key"><strong>Key for {tokenName}</strong><p>Copy it now; it won't be shown again.</p><input readOnly value={token} aria-label="New key" onFocus={e=>e.target.select()}/><div className="button-row"><button type="button" className="button primary" onClick={()=>copy(token,'key')}>{copied==='key'?'Copied':'Copy key'}</button><button type="button" className="button secondary" onClick={()=>setToken('')}>Hide</button></div></div>}
  </section>
  <section className="panel"><h2>Active keys</h2>{items.length===0?<p className="step-hint">No keys. ChatGPT and Claude sign-ins don't need one.</p>:items.map(x=><div className="connection-entry" key={x.id}><strong>{x.label}</strong><span>{x.provider} · {x.revoked_at?'Revoked':Date.parse(x.expires_at)<=Date.now()?'Expired':'Active'} · expires {new Date(x.expires_at).toLocaleDateString()}</span>{!x.revoked_at&&Date.parse(x.expires_at)>Date.now()&&<button type="button" className="button secondary" onClick={()=>revoke(x.id)} disabled={busy}>Revoke</button>}</div>)}</section>
 </main>;
}
