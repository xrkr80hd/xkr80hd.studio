'use client';
import OverlaySelect from './OverlaySelect';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const KINDS = ['All assets', 'Image', 'Video', 'Audio', 'Document', 'Other'];
const SOURCES = [
  { value: 'manual', label: 'Manual upload' },
  { value: 'flow', label: 'Google Flow' },
  { value: 'grok', label: 'Grok' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'video_express_ai', label: 'Video Express AI' },
  { value: 'other', label: 'Other tool' },
];

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/></>,
    library: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M8 5V3h8v2"/></>,
    upload: <><path d="M12 16V3m0 0-4 4m4-4 4 4"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 16-5-5L5 21"/></>,
    video: <><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 9 4-2v10l-4-2"/></>,
    audio: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    document: <><path d="M6 2h8l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h5M8 13h7M8 17h7"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v3h16v-3"/></>,
    close: <><path d="M5 5 19 19M19 5 5 19"/></>,
    check: <><path d="m4 12 5 5L20 6"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3"/><path d="M13 3h5a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-5"/></>,
  };
  return <svg {...common}>{paths[name] || paths.document}</svg>;
}

function classify(asset) {
  const kind = String(asset.kind || '').toLowerCase();
  const mime = String(asset.mime_type || '').toLowerCase();
  if (kind.includes('image') || mime.startsWith('image/')) return 'Image';
  if (kind.includes('video') || mime.startsWith('video/')) return 'Video';
  if (kind.includes('audio') || mime.startsWith('audio/')) return 'Audio';
  if (kind.includes('document') || kind.includes('prompt') || mime.includes('pdf') || mime.startsWith('text/')) return 'Document';
  return 'Other';
}

function prettySize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return 'Size unknown';
  if (value < 1024) return `${value} B`;
  if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1073741824) return `${(value / 1048576).toFixed(1)} MB`;
  return `${(value / 1073741824).toFixed(1)} GB`;
}

function prettyDate(value) {
  if (!value) return 'Date unknown';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Date unknown' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function sourceLabel(value) {
  return SOURCES.find((source) => source.value === value)?.label || (value ? String(value).replaceAll('_', ' ') : 'Manual upload');
}

export default function StudioDashboard({ productionContract, providerAvailability }) {
  const [session, setSession] = useState(null);
  const [sessionState, setSessionState] = useState('loading');
  const [assets, setAssets] = useState([]);
  const [assetState, setAssetState] = useState('loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All assets');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [statusBusyId, setStatusBusyId] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadDone, setUploadDone] = useState('');
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('');
  const [sourceProvider, setSourceProvider] = useState('manual');
  const [generationProvider, setGenerationProvider] = useState(providerAvailability.gemini ? 'gemini' : 'grok');
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generationBusy, setGenerationBusy] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [credentialLabel, setCredentialLabel] = useState('');
  const [credentialProvider, setCredentialProvider] = useState('');
  const [credentialBusy, setCredentialBusy] = useState(false);
  const [credentialError, setCredentialError] = useState('');
  const [issuedToken, setIssuedToken] = useState('');
  const fileInput = useRef(null);

  const loadCredentials = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/tokens', { cache: 'no-store', credentials: 'same-origin' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load API access.');
      setCredentials(Array.isArray(payload.credentials) ? payload.credentials : []);
      setCredentialError('');
    } catch (cause) {
      setCredentialError(cause.message || 'Could not load API access.');
    }
  }, []);

  const loadAssets = useCallback(async () => {
    setAssetState('loading');
    try {
      const loaded = [];
      let offset = 0;
      while (true) {
        const response = await fetch(`/api/assets?offset=${offset}`, { cache: 'no-store', credentials: 'same-origin' });
        if (response.status === 401 || response.status === 403) {
          window.location.assign('/login');
          return;
        }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Could not load the library.');
        loaded.push(...(Array.isArray(payload.assets) ? payload.assets : []));
        if (payload.next_offset == null) break;
        if (!Number.isInteger(payload.next_offset) || payload.next_offset <= offset) throw new Error('Invalid library page.');
        offset = payload.next_offset;
      }
      setAssets([...new Map(loaded.map(asset => [asset.id, asset])).values()]);
      setAssetState('ready');
      setError('');
    } catch (cause) {
      setAssetState('error');
      setError(cause.message || 'Could not load the library.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' });
        if (response.status === 401 || response.status === 403) {
          window.location.assign('/login');
          return;
        }
        const payload = await response.json();
        if (!response.ok || !payload.user) throw new Error(payload.error || 'Could not verify your session.');
        if (!cancelled) {
          setSession(payload.user);
          setSessionState('ready');
          loadAssets();
          loadCredentials();
        }
      } catch (cause) {
        if (!cancelled) {
          setSessionState('error');
          setError(cause.message || 'Could not verify your session.');
        }
      }
    }
    boot();
    return () => { cancelled = true; };
  }, [loadAssets, loadCredentials]);

  async function issueCredential(event) {
    event.preventDefault();
    setCredentialBusy(true);
    setCredentialError('');
    setIssuedToken('');
    try {
      const response = await fetch('/api/integrations/tokens', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ label: credentialLabel.trim(), provider: credentialProvider.trim().toLowerCase(), scopes: ['asset:read', 'asset:write'], expires_in_days: 30 }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.token) throw new Error(payload.error || 'Could not create access token.');
      setIssuedToken(payload.token);
      setCredentialLabel('');
      setCredentialProvider('');
      await loadCredentials();
    } catch (cause) {
      setCredentialError(cause.message || 'Could not create access token.');
    } finally {
      setCredentialBusy(false);
    }
  }

  async function revokeCredential(id) {
    if (!window.confirm('Revoke this token? The connected tool will immediately lose API access.')) return;
    setCredentialBusy(true);
    setCredentialError('');
    try {
      const response = await fetch(`/api/integrations/tokens?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' });
      const payload = await response.json();
      if (!response.ok || !payload.revoked) throw new Error(payload.error || 'Could not revoke access.');
      await loadCredentials();
    } catch (cause) {
      setCredentialError(cause.message || 'Could not revoke access.');
    } finally {
      setCredentialBusy(false);
    }
  }

  const visibleAssets = useMemo(() => assets.filter((asset) => {
    const typeMatches = filter === 'All assets' || classify(asset) === filter;
    const text = `${asset.name || ''} ${asset.source_provider || ''} ${asset.kind || ''}`.toLowerCase();
    return typeMatches && text.includes(query.trim().toLowerCase());
  }), [assets, filter, query]);

  const stats = useMemo(() => ({
    total: assets.length,
    approved: assets.filter((asset) => String(asset.workflow_status || '').toLowerCase() === 'locked').length,
    sources: new Set(assets.map((asset) => asset.source_provider).filter(Boolean)).size,
  }), [assets]);

  function chooseFile(selected) {
    if (!selected) return;
    setFile(selected);
    setName(selected.name.replace(/\.[^.]+$/, ''));
    setKind(selected.type.startsWith('image/') ? 'image' : selected.type.startsWith('video/') ? 'video' : selected.type.startsWith('audio/') ? 'audio' : 'document');
    setUploadError('');
  }

  async function upload(event) {
    event.preventDefault();
    if (!file) { setUploadError('Choose a file first.'); return; }
    if (!name.trim()) { setUploadError('Give this asset a name.'); return; }
    if (file.size > 100 * 1024 * 1024) { setUploadError('This file is over the 100 MB upload limit.'); return; }
    setUploadBusy(true);
    setUploadError('');
    try {
      if (file.size <= 4 * 1024 * 1024) {
        const form = new FormData();
        form.set('file', file);
        form.set('name', name.trim());
        form.set('kind', kind || 'other');
        form.set('source_provider', sourceProvider);
        const response = await fetch('/api/assets', { method: 'POST', body: form, credentials: 'same-origin' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Upload failed.');
      } else {
        const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (!publicUrl || !publicKey) throw new Error('Large-file uploads are not configured yet.');
        const details = { name: name.trim(), kind: kind || 'other', mime_type: file.type || 'application/octet-stream', byte_size: file.size, source_provider: sourceProvider };
        const ticketResponse = await fetch('/api/assets/upload-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(details) });
        const ticket = await ticketResponse.json();
        if (!ticketResponse.ok || !ticket.path || !ticket.token) throw new Error(ticket.error || 'Could not prepare the upload.');
        const client = createClient(publicUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const sent = await client.storage.from('xstudio-assets').uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: details.mime_type });
        if (sent.error) throw new Error(sent.error.message || 'File transfer failed.');
        const completeResponse = await fetch('/api/assets/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ ...details, path: ticket.path }) });
        const completed = await completeResponse.json();
        if (!completeResponse.ok) throw new Error(completed.error || 'File transferred, but could not be added to the library.');
      }
      setUploadDone(`${name.trim()} added to your library.`);
      setFile(null);
      setName('');
      setKind('');
      setSourceProvider('manual');
      if (fileInput.current) fileInput.current.value = '';
      setUploadOpen(false);
      await loadAssets();
    } catch (cause) {
      setUploadError(cause.message || 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  }

  async function download(asset) {
    setBusyId(asset.id);
    setError('');
    try {
      const response = await fetch(`/api/assets/${encodeURIComponent(asset.id)}/download`, { credentials: 'same-origin' });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Could not open this asset.');
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause.message || 'Could not open this asset.');
    } finally {
      setBusyId('');
    }
  }

  async function updateWorkflowStatus(asset, nextStatus) {
    if (nextStatus === asset.workflow_status) return;
    if (nextStatus === 'locked' && !window.confirm('Mark this asset LOCKED? This records your approval for reuse; it does not prevent later edits.')) return;
    setStatusBusyId(asset.id);
    setError('');
    try {
      const response = await fetch(`/api/assets/${encodeURIComponent(asset.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ workflow_status: nextStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not update asset status.');
      setAssets((previous) => previous.map((item) => item.id === asset.id ? { ...item, workflow_status: payload.asset?.workflow_status || nextStatus } : item));
    } catch (cause) {
      setError(cause.message || 'Could not update asset status.');
    } finally {
      setStatusBusyId('');
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    window.location.assign('/login');
  }

  async function generateImage(event) {
    event.preventDefault();
    if (!generationPrompt.trim()) return;
    setGenerationBusy(true);
    setGenerationError('');
    try {
      const response = await fetch('/api/providers/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ provider: generationProvider, prompt: generationPrompt.trim() }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.asset) throw new Error(payload.error || 'Image generation failed.');
      setGenerationPrompt('');
      setUploadDone('Generated image saved as a draft in your private library.');
      await loadAssets();
    } catch (cause) {
      setGenerationError(cause.message || 'Image generation failed.');
    } finally {
      setGenerationBusy(false);
    }
  }

  if (sessionState !== 'ready') {
    return <div className="app-loading"><img src="/xstudio.jpg" alt="XSTUDIO"/><p>{sessionState === 'loading' ? 'Opening your private studio…' : error}</p>{sessionState === 'error' && <a href="/login">Go to sign in</a>}</div>;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation">
        <a href="/" className="brand"><span className="brand-mark"><img src="/xstudio.jpg" alt=""/></span><span><strong>XSTUDIO</strong><small>PRIVATE WORKSPACE</small></span></a>
        <div className="nav-group-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Workspace">
          <a className="nav-item active" href="#overview" onClick={() => setMobileNavOpen(false)}><Icon name="grid"/> Overview</a>
          <a className="nav-item" href="#library" onClick={() => setMobileNavOpen(false)}><Icon name="library"/> Asset library <span className="nav-count">{assets.length}</span></a>
          <a className="nav-item" href="#connections" onClick={() => setMobileNavOpen(false)}><Icon name="arrow"/> Connections</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><span className="privacy-icon"><Icon name="lock" size={17}/></span><div><strong>Private by default</strong><p>Only your verified owner session can open this studio.</p></div></div>
          <button type="button" className="account-row" onClick={logout}><span className="avatar">{(session.email || 'O').slice(0, 1).toUpperCase()}</span><span className="account-copy"><strong>Studio owner</strong><small>{session.email || 'Owner account'}</small></span><Icon name="logout" size={17}/></button>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar"><button type="button" className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMobileNavOpen(!mobileNavOpen)}><Icon name="menu"/></button><span className="breadcrumb">WORKSPACE <span>/</span> OVERVIEW</span><span className="topbar-right"><span className="status-dot"/> Owner workspace</span></header>

        <div className="content-wrap">
          <section className="hero" aria-labelledby="hero-title"><div className="hero-text"><div className="eyebrow"><span className="eyebrow-line"/> YOUR PRIVATE PRODUCTION HUB</div><h1 id="hero-title">Your ideas, <em>in one place.</em></h1><p>Store the references, exports, and working assets you create across tools. Keep their source and approval state alongside the files.</p><button type="button" className="primary-button" onClick={() => { setUploadError(''); setUploadOpen(true); }}><Icon name="upload" size={18}/> Add an asset</button></div><div className="hero-art" aria-hidden="true"><img src="/xstudio.jpg" alt=""/></div></section>

          {uploadDone && <div className="notice success" role="status"><Icon name="check" size={18}/>{uploadDone}<button type="button" aria-label="Dismiss" onClick={() => setUploadDone('')}><Icon name="close" size={16}/></button></div>}
          {error && <div className="notice error" role="alert">{error}<button type="button" aria-label="Dismiss" onClick={() => setError('')}><Icon name="close" size={16}/></button></div>}

          <section className="metrics" aria-label="Library summary"><div className="metric"><span>ASSETS</span><strong>{stats.total}</strong><small>In your private library</small></div><div className="metric"><span>APPROVED</span><strong>{stats.approved}</strong><small>Marked locked for reuse</small></div><div className="metric"><span>SOURCE LABELS</span><strong>{stats.sources}</strong><small>Tools represented in files</small></div></section>

          <section className="rules-section" aria-labelledby="rules-title"><div className="rules-intro"><span className="section-kicker">XSTUDIO PRODUCTION RULES</span><h2 id="rules-title">Carry the same anchor across tools.</h2><p>The installed XSTUDIO contract travels with this app. Use it when preparing prompts and recording approved references.</p></div><div className="rules-grid"><div className="rule-card"><span className="rule-number">01 / CHARACTER</span><h3>Six views. One identity.</h3><p>Simple character sheets use {productionContract.views.length} ordered views: {productionContract.views.map((view) => view.replaceAll('_', ' ')).join(' · ')}.</p><div className="rule-command">MCSRL / MCSCB</div></div><div className="rule-card"><span className="rule-number">02 / REFERENCE</span><h3>Keep source roles clear.</h3><p>Label each file by what it controls. A failed output stays rejected; it never becomes a new identity source.</p><div className="rule-command">DRAFT → LOCKED / REJECTED</div></div><div className="rule-card"><span className="rule-number">03 / PLATFORM</span><h3>Export with the right limits.</h3><p>Flow voice performance and preview dialogue each stay within {productionContract.voiceLimit} characters. Other tools need their own verified inputs.</p><div className="rule-command">FLOW-READY PROMPTS</div></div></div><div className="command-guide" aria-label="XSTUDIO command guide"><span><strong>PTP</strong> written picture prompt</span><span><strong>RITP</strong> picture reinterpretation</span><span><strong>MAP</strong> location geometry</span><span><strong>/resetref</strong> rebuild from approved references</span><span><strong>/xstudiostrbrd</strong> reserved</span></div><p className="rules-footnote">These are reference rules, not an automatic generator. “Locked” records your approval but does not make a file immutable. Image generation and direct provider transfers require verified connections.</p></section>

          <section id="library" className="library-section" aria-labelledby="library-title"><div className="section-heading"><div><span className="section-kicker">THE LIBRARY</span><h2 id="library-title">Production assets</h2><p>Files stay private. Each download link expires after a short time.</p></div><button type="button" className="secondary-button" onClick={() => { setUploadError(''); setUploadOpen(true); }}><Icon name="upload" size={17}/> Upload file</button></div>
            <div className="library-toolbar"><div className="filter-row" role="group" aria-label="Filter assets by type">{KINDS.map((item) => <button key={item} type="button" className={`filter-pill ${filter === item ? 'selected' : ''}`} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="search-box"><Icon name="search" size={17}/><span className="sr-only">Search assets</span><input type="search" placeholder="Search assets" value={query} onChange={(event) => setQuery(event.target.value)}/></label></div>
            {assetState === 'loading' && <div className="empty-state"><div className="empty-icon"><Icon name="library" size={25}/></div><h3>Loading your library…</h3></div>}
            {assetState === 'error' && <div className="empty-state"><div className="empty-icon"><Icon name="library" size={25}/></div><h3>Library unavailable</h3><p>{error}</p><button type="button" className="secondary-button" onClick={loadAssets}>Try again</button></div>}
            {assetState === 'ready' && visibleAssets.length === 0 && <div className="empty-state"><div className="empty-icon"><Icon name="library" size={25}/></div><h3>{assets.length ? 'No assets match this search' : 'Start your production library'}</h3><p>{assets.length ? 'Try another name or asset type.' : 'Upload a reference, prompt, image, video, or audio file to keep it with its source details.'}</p>{!assets.length && <button type="button" className="secondary-button" onClick={() => setUploadOpen(true)}>Add your first asset</button>}</div>}
            {assetState === 'ready' && visibleAssets.length > 0 && <div className="asset-list">{visibleAssets.map((asset) => <article className="asset-row" key={asset.id}><div className={`asset-icon ${classify(asset).toLowerCase()}`}><Icon name={classify(asset).toLowerCase()} size={21}/></div><div className="asset-main"><h3>{asset.name || 'Untitled asset'}</h3><div className="asset-details"><span>{classify(asset)}</span><span>{prettySize(asset.byte_size)}</span><span>{prettyDate(asset.created_at)}</span><span className={`transfer-state ${asset.status || ''}`}>{asset.status || 'ready'}</span></div></div><div className="asset-tags"><span className="source-tag">{sourceLabel(asset.source_provider)}</span><label className="workflow-label"><span className="sr-only">Approval state for {asset.name || 'asset'}</span><OverlaySelect value={asset.workflow_status || 'draft'} onChange={(event) => updateWorkflowStatus(asset, event.target.value)} disabled={statusBusyId === asset.id} aria-label={`Approval state for ${asset.name || 'asset'}`}><option value="draft">Draft</option><option value="locked">Locked</option><option value="rejected">Rejected</option></OverlaySelect></label></div><button type="button" className="download-button" onClick={() => download(asset)} disabled={busyId === asset.id || asset.status !== 'ready'} aria-label={`Open ${asset.name || 'asset'}`}><Icon name="download" size={18}/><span>{busyId === asset.id ? 'Opening…' : 'Open'}</span></button></article>)}</div>}
          </section>

          <section id="connections" className="connections-section" aria-labelledby="connections-title"><div className="section-heading"><div><span className="section-kicker">HOW IT CONNECTS</span><h2 id="connections-title">Bring work together</h2><p>Label files by source now. Provider generation is available only when its server key is configured.</p></div></div><div className="connections-grid"><div className="connection-card"><div className="connection-head"><span className="connection-symbol cyan">↥</span><span className="connection-state ready">READY</span></div><h3>Private upload</h3><p>Bring files from your device into XSTUDIO with source, type, and name recorded at upload.</p></div><div className="connection-card"><div className="connection-head"><span className="connection-symbol gold">⇄</span><span className={`connection-state ${providerAvailability.gemini || providerAvailability.grok ? 'ready' : 'planned'}`}>{providerAvailability.gemini || providerAvailability.grok ? 'KEY CONFIGURED' : 'NOT CONNECTED'}</span></div><h3>External AI tools</h3><p>Gemini and Grok image generation use server-side keys when configured. Flow and Video Express AI are manual source labels here.</p></div><div className="connection-card"><div className="connection-head"><span className="connection-symbol violet">⌘</span><span className="connection-state planned">OWNER ONLY</span></div><h3>API access</h3><p>Asset API routes require the owner session. Create and revoke scoped tool tokens below when you need external access.</p></div></div><div className="generate-panel"><div><span className="section-kicker">IMAGE GENERATION</span><h3>Generate and save a draft</h3><p>Use an available provider with a prompt based on your approved references. Generated files enter the library as drafts for review.</p></div><form onSubmit={generateImage}><div className="generate-fields"><label><span>Provider</span><OverlaySelect value={generationProvider} onChange={(event) => setGenerationProvider(event.target.value)} disabled={!providerAvailability.gemini && !providerAvailability.grok}><option value="gemini" disabled={!providerAvailability.gemini}>Gemini {providerAvailability.gemini ? '' : '(not connected)'}</option><option value="grok" disabled={!providerAvailability.grok}>Grok {providerAvailability.grok ? '' : '(not connected)'}</option></OverlaySelect></label><label className="prompt-field"><span>Image prompt</span><textarea value={generationPrompt} onChange={(event) => setGenerationPrompt(event.target.value)} maxLength={2000} rows={3} placeholder="Describe the image you want to create…" disabled={!providerAvailability.gemini && !providerAvailability.grok}/></label></div>{generationError && <p className="form-error" role="alert">{generationError}</p>}<button type="submit" className="secondary-button" disabled={generationBusy || !generationPrompt.trim() || (!providerAvailability.gemini && !providerAvailability.grok)}>{generationBusy ? 'Generating…' : 'Generate image'}</button>{!providerAvailability.gemini && !providerAvailability.grok && <small className="generation-unavailable">No image provider key is configured.</small>}</form></div></section>
          <section className="connections-section" aria-labelledby="api-access-title">
            <div className="section-heading"><div><span className="section-kicker">EXTERNAL TOOLS</span><h2 id="api-access-title">Asset API access</h2><p>Create a short-lived token for a tool you trust. It can upload assets and request short download links. You can revoke it here at any time.</p></div></div>
            <div className="generate-panel api-access-panel">
              <form onSubmit={issueCredential}>
                <div className="generate-fields">
                  <label><span>Connection name</span><input value={credentialLabel} onChange={(event) => setCredentialLabel(event.target.value)} maxLength={80} placeholder="My workflow" required/></label>
                  <label><span>Tool label</span><input value={credentialProvider} onChange={(event) => setCredentialProvider(event.target.value)} maxLength={80} pattern="[a-zA-Z0-9][a-zA-Z0-9_-]*" placeholder="gemini" required/></label>
                </div>
                <p className="upload-limit">Read and write access expires after 30 days. Each asset keeps this tool label as its source.</p>
                {credentialError && <p className="form-error" role="alert">{credentialError}</p>}
                <button className="secondary-button" type="submit" disabled={credentialBusy}>{credentialBusy ? 'Working…' : 'Create token'}</button>
              </form>
              {issuedToken && <div className="api-issued" role="status"><strong>Copy this token now. It will not be shown again.</strong><input readOnly value={issuedToken} aria-label="New API token" onFocus={(event) => event.target.select()}/><button type="button" className="text-button" onClick={() => setIssuedToken('')}>Hide token</button></div>}
              <div className="api-credentials"><h3>Active connections</h3>{credentials.filter((item) => !item.revoked_at && new Date(item.expires_at).getTime() > Date.now()).length === 0 ? <p>No active tokens.</p> : credentials.filter((item) => !item.revoked_at && new Date(item.expires_at).getTime() > Date.now()).map((item) => <div className="api-credential" key={item.id}><span><strong>{item.label}</strong><small>{item.provider} · expires {prettyDate(item.expires_at)}</small></span><button type="button" className="text-button" onClick={() => revokeCredential(item.id)} disabled={credentialBusy}>Revoke</button></div>)}</div>
              <p className="upload-limit">API endpoint: <code>https://osbsjjoxepxezcmupcak.supabase.co/functions/v1/xstudio-assets-api</code>. Send the token as a Bearer header. POST a multipart file to upload; GET with <code>?id=asset-uuid</code> for a 60-second download link.</p>
            </div>
          </section>
          <footer className="footer">XSTUDIO <span>·</span> Private production workspace</footer>
        </div>
      </main>

      {uploadOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploadBusy) setUploadOpen(false); }}><section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-head"><div><span className="section-kicker">ADD TO LIBRARY</span><h2 id="upload-title">Upload an asset</h2></div><button type="button" className="icon-button" aria-label="Close upload" onClick={() => setUploadOpen(false)} disabled={uploadBusy}><Icon name="close"/></button></div><p className="modal-intro">Keep the original file and the details that help you find it later.</p><form onSubmit={upload}><label className={`dropzone ${file ? 'has-file' : ''}`}><input ref={fileInput} type="file" onChange={(event) => chooseFile(event.target.files?.[0])} required/><span className="drop-icon"><Icon name="upload" size={23}/></span><strong>{file ? file.name : 'Choose a file'}</strong><span>{file ? prettySize(file.size) : 'Image, video, audio, document, or project reference'}</span></label><p className="upload-limit">Files over 4 MB use direct transfer. Storage service limits may still reject a file below the 100 MB app limit.</p><div className="field"><label htmlFor="asset-name">Asset name</label><input id="asset-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={160} required placeholder="e.g. Andy character reference"/></div><div className="field-grid"><div className="field"><label htmlFor="asset-kind">Asset type</label><OverlaySelect id="asset-kind" value={kind} onChange={(event) => setKind(event.target.value)} required><option value="">Select type</option><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option><option value="document">Document</option><option value="other">Other</option></OverlaySelect></div><div className="field"><label htmlFor="asset-source">Created with</label><OverlaySelect id="asset-source" value={sourceProvider} onChange={(event) => setSourceProvider(event.target.value)}>{SOURCES.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}</OverlaySelect></div></div>{uploadError && <p className="form-error" role="alert">{uploadError}</p>}<div className="modal-actions"><button type="button" className="text-button" onClick={() => setUploadOpen(false)} disabled={uploadBusy}>Cancel</button><button className="primary-button" type="submit" disabled={uploadBusy}><Icon name="upload" size={17}/>{uploadBusy ? 'Uploading…' : 'Save asset'}</button></div></form></section></div>}
    </div>
  );
}
