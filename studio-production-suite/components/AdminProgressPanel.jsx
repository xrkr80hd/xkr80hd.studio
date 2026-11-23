'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from '../app/admin/progress/admin-progress.module.css';
import AdminFamilyTable from './AdminFamilyTable';

const MAX_PHOTOS = 12;
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PICK_BYTES = 60 * 1024 * 1024;
const MAX_EDGE = 2400;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch {}
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Phone photos (including iPhone HEIC where the browser can read it) are turned into
// a right-side-up JPEG no bigger than 2400px, so uploads are quick on a cell signal.
async function preparePhoto(file, index) {
  if (file.type === 'image/gif') return file.size <= MAX_BYTES ? file : null;
  let image;
  try { image = await decodeImage(file); } catch { image = null; }
  if (!image) return TYPES.includes(file.type) && file.size <= MAX_BYTES ? file : null;
  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  // Always redraw, so camera details such as location never leave the phone.
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  if (typeof image.close === 'function') image.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86));
  if (!blob || blob.size > MAX_BYTES) return null;
  return new File([blob], `photo-${Date.now()}-${index}.jpg`, { type: 'image/jpeg' });
}

function putFile(url, file, contentType) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('A photo failed to upload. Please try again.')));
    xhr.onerror = () => reject(new Error('Network error. Check your connection and retry.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please retry.'));
    xhr.timeout = 300000;
    xhr.send(file);
  });
}

async function uploadPhoto(file) {
  const response = await fetch('/api/admin/progress/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name || 'photo.jpg', size: file.size }),
  });
  const intent = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(intent.error || 'Could not start the upload.');
  await putFile(intent.signed_url, file, intent.content_type);
  return intent.path;
}

function formatWhen(value) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function Composer({ initial, onDone, onCancel }) {
  const editing = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title || '');
  const [body, setBody] = useState(initial?.body || '');
  const [kept, setKept] = useState(initial?.photos || []);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [status, setStatus] = useState('');
  const input = useRef(null);

  async function addFiles(event) {
    const room = MAX_PHOTOS - kept.length - files.length;
    const picked = Array.from(event.target.files || []);
    event.target.value = '';
    const wanted = picked.slice(0, Math.max(0, room));
    setPreparing(true);
    setStatus(`Getting ${wanted.length === 1 ? 'your photo' : `${wanted.length} photos`} ready…`);
    const ready = [];
    let skipped = 0;
    for (let index = 0; index < wanted.length; index += 1) {
      const file = wanted[index];
      const usable = file.size <= MAX_PICK_BYTES && (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) ? await preparePhoto(file, index) : null;
      if (usable) ready.push({ file: usable, preview: URL.createObjectURL(usable) }); else skipped += 1;
    }
    setFiles(current => [...current, ...ready]);
    setPreparing(false);
    if (skipped) setStatus(`${skipped} photo${skipped === 1 ? " couldn't" : "s couldn't"} be read. Try a JPG or PNG, or take a screenshot of it.`);
    else if (picked.length > wanted.length) setStatus(`Up to ${MAX_PHOTOS} photos per update.`);
    else setStatus('');
  }

  async function submit(event) {
    event.preventDefault();
    if (!title.trim() && !body.trim() && kept.length + files.length === 0) {
      setStatus('Write something or add a photo first.');
      return;
    }
    setBusy(true);
    try {
      const paths = [];
      for (let index = 0; index < files.length; index += 1) {
        setStatus(`Uploading photo ${index + 1} of ${files.length}…`);
        paths.push(await uploadPhoto(files[index].file));
      }
      setStatus(editing ? 'Saving…' : 'Posting…');
      const response = await fetch('/api/admin/progress', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: initial?.id, title, body, photo_paths: [...kept.map(photo => photo.path), ...paths] }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Something went wrong. Please retry.');
      files.forEach(item => URL.revokeObjectURL(item.preview));
      setTitle(''); setBody(''); setKept([]); setFiles([]);
      setStatus(editing ? 'Saved.' : 'Posted! It is live on the Progress page.');
      onDone();
    } catch (error) {
      setStatus(error.message || 'Something went wrong. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  const photoCount = kept.length + files.length;

  return (
    <form className={styles.composer} onSubmit={submit}>
      <h2>{editing ? 'Edit update' : 'Post an update'}</h2>
      <label>
        Headline <span className={styles.optional}>(optional)</span>
        <input value={title} maxLength={140} onChange={event => setTitle(event.target.value)} placeholder="e.g. Quick update" />
      </label>
      <label>
        Update
        <textarea value={body} maxLength={8000} rows={7} onChange={event => setBody(event.target.value)} placeholder="Write what you want family to know…" />
      </label>

      {photoCount > 0 && (
        <div className={styles.thumbs}>
          {kept.map(photo => (
            <figure key={photo.path}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" />
              <button type="button" onClick={() => setKept(list => list.filter(item => item.path !== photo.path))} aria-label="Remove photo" disabled={busy}>×</button>
            </figure>
          ))}
          {files.map(item => (
            <figure key={item.preview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt="" />
              <button type="button" onClick={() => { URL.revokeObjectURL(item.preview); setFiles(list => list.filter(entry => entry !== item)); }} aria-label="Remove photo" disabled={busy}>×</button>
            </figure>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={() => input.current?.click()} disabled={busy || preparing || photoCount >= MAX_PHOTOS}>
          {preparing ? 'Preparing photos…' : `📷 Add photos${photoCount ? ` (${photoCount}/${MAX_PHOTOS})` : ''}`}
        </button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={addFiles} />
        <button type="submit" className={styles.primary} disabled={busy || preparing}>{busy ? 'Working…' : editing ? 'Save changes' : 'Post update'}</button>
        {editing && <button type="button" className={styles.link} onClick={onCancel} disabled={busy}>Cancel</button>}
      </div>
      <p role="status" className={styles.status}>{status}</p>
    </form>
  );
}


function FamilyAccess() {
  const [settings, setSettings] = useState(null);
  const [emailReady, setEmailReady] = useState(false);
  const [invite, setInvite] = useState('');
  const [copied, setCopied] = useState('');
  const [status, setStatus] = useState('');

  async function load() {
    const settingsResponse = await fetch('/api/admin/progress/settings', { cache: 'no-store' });
    const settingsBody = await settingsResponse.json().catch(() => ({}));
    if (settingsResponse.ok) { setSettings(settingsBody.item); setEmailReady(Boolean(settingsBody.emailReady)); }
  }

  useEffect(() => { load().catch(() => setStatus('Could not load family access.')); }, []);

  async function setPrivacy(requireSignin) {
    setStatus('Saving…');
    const response = await fetch('/api/admin/progress/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ require_signin: requireSignin }) });
    if (response.ok) { setSettings({ require_signin: requireSignin }); setStatus('Saved.'); } else setStatus('Could not save.');
  }

  function inviteMessage(link) {
    const updates = `${window.location.origin}/progress`;
    return [
      "Hey everyone! I set up a page where I'll post updates and photos on how Ashley is doing.",
      `Updates: ${updates}`,
      `To leave her a note or a reaction, use this invite link: ${link}`,
      "The invite link is good for 7 days. Once you sign in, it keeps you logged in for 30 days on that phone or browser. If you switch to another browser or device, you'll need a new link, so just ask me. Please don't pass the invite link around.",
    ].join('\n');
  }

  async function getInvite() {
    if (invite) return invite;
    const response = await fetch('/api/admin/progress/invite', { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Could not make a link.');
    setInvite(body.link);
    return body.link;
  }

  // copy: 'message' copies the ready-to-text note with the link inside, 'link' copies the bare link.
  async function copyInvite(kind) {
    setStatus('Making a link…');
    let link;
    try { link = await getInvite(); } catch (error) { setStatus(error.message); return; }
    const text = kind === 'message' ? inviteMessage(link) : link;
    setCopied(text);
    try {
      await navigator.clipboard.writeText(text);
      setStatus(kind === 'message' ? 'Invite message copied. Paste it in a text to family.' : 'Invite link copied.');
    } catch {
      setStatus('Ready below. Press and hold to copy it.');
    }
  }

  async function shareInvite() {
    if (!navigator.share || !copied) return;
    try { await navigator.share({ text: copied }); } catch {}
  }

  return (
    <section className={styles.list}>
      <h2>Family access</h2>
      <div className={styles.toggleRow} role="radiogroup" aria-label="Who can read updates">
        <button type="button" role="radio" aria-checked={settings?.require_signin === true} className={settings?.require_signin ? styles.primary : styles.secondary} onClick={() => setPrivacy(true)} disabled={!settings}>Family only (sign-in)</button>
        <button type="button" role="radio" aria-checked={settings?.require_signin === false} className={settings && !settings.require_signin ? styles.primary : styles.secondary} onClick={() => setPrivacy(false)} disabled={!settings}>Anyone with the link</button>
      </div>
      <p className={styles.help}>{settings?.require_signin === false ? 'Anyone with the link can read. Only invited, signed-in family can leave notes.' : 'Only signed-in family can read updates and leave notes.'}</p>
      <p className={styles.help}>{emailReady ? 'Email sign-in is on: family can request a one-tap link by email.' : 'Email sign-in is not set up yet, so use an invite link for now.'}</p>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => copyInvite('message')}>Copy invite message</button>
        <button type="button" className={styles.secondary} onClick={() => copyInvite('link')}>Copy link only</button>
        {copied && typeof navigator !== 'undefined' && navigator.share && <button type="button" className={styles.secondary} onClick={shareInvite}>Share…</button>}
      </div>
      {copied && <textarea className={styles.inviteBox} readOnly rows={copied.includes('\n') ? 7 : 2} value={copied} onFocus={event => event.target.select()} aria-label="Invite to send" />}
      <p className={styles.help}>Invite links work for 7 days. Whoever opens one adds their name and email and stays signed in for 30 days on that phone or browser. A new browser or device needs a new link.</p>
      <p role="status" className={styles.status}>{status}</p>

      <AdminFamilyTable />
    </section>
  );
}

export default function AdminProgressPanel({ initialItems = [] }) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  async function refresh() {
    const response = await fetch('/api/admin/progress', { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (response.ok) setItems(result.items || []);
  }

  async function copyLink(item, number) {
    const url = `${window.location.origin}/progress/${item.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: `Ashley's Progress · Update ${number}`, url }); return; }
      await navigator.clipboard.writeText(url);
      setMessage(`Link to Update ${number} copied.`);
    } catch (error) {
      if (error?.name !== 'AbortError') setMessage(url);
    }
  }

  async function remove(item) {
    if (!window.confirm('Delete this update and its photos? This cannot be undone.')) return;
    setMessage('Deleting…');
    const response = await fetch(`/api/admin/progress?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(result.error || 'Could not delete.'); return; }
    setMessage('Deleted.');
    if (editing?.id === item.id) setEditing(null);
    await refresh();
  }

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <span className={styles.tag}>OWNER CONTROLS / FAMILY UPDATES</span>
        <h1>Progress</h1>
        <p>Post updates and photos for family. Anyone with the link can read (unless you switch it below); only you post updates, and only invited family can leave notes.</p>
        <Link href="/progress" target="_blank">View the Progress page ↗</Link>
      </header>

      {editing
        ? <Composer key={editing.id} initial={editing} onDone={async () => { setEditing(null); await refresh(); }} onCancel={() => setEditing(null)} />
        : <Composer key="new" onDone={refresh} />}

      <section className={styles.list}>
        <h2>Posted updates <span>{items.length}</span></h2>
        <p role="status" className={styles.status}>{message}</p>
        {items.length === 0 && <p className={styles.empty}>Nothing posted yet. Your first update will show at the top of the page.</p>}
        {items.map((item, index) => (
          <article key={item.id} className={styles.item}>
            <div>
              <p className={styles.when}>Update {items.length - index} · {formatWhen(item.created_at)}{item.photos.length ? ` · ${item.photos.length} photo${item.photos.length === 1 ? '' : 's'}` : ''}</p>
              <strong>{item.title || (item.body ? item.body.slice(0, 80) + (item.body.length > 80 ? '…' : '') : 'Photos')}</strong>
            </div>
            <div className={styles.itemActions}>
              <button type="button" className={styles.secondary} onClick={() => copyLink(item, items.length - index)}>Share link</button>
              <button type="button" className={styles.secondary} onClick={() => { setEditing(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
              <button type="button" className={styles.danger} onClick={() => remove(item)}>Delete</button>
            </div>
          </article>
        ))}
      </section>

      <FamilyAccess />
    </div>
  );
}
