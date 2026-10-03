'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from '../app/admin/gleaux/admin-gleaux.module.css';
function uploadFile(url, file, contentType, progress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); xhr.open('PUT', url); xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Audio upload failed. Please try again.'));
    xhr.onerror = () => reject(new Error('Network error. Check your connection and retry.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please retry.')); xhr.timeout = 600000; xhr.send(file);
  });
}
function UploadSlot({ slot, path, onUploaded }) {
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [message, setMessage] = useState('');
  async function upload(event) {
    const file = event.target.files?.[0]; if (!file) return;
    const input = event.target; setBusy(true); setProgress(0); setMessage('Preparing upload…');
    try {
      const response = await fetch('/api/admin/gleaux/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot, filename: file.name, size: file.size }) });
      const intent = await response.json(); if (!response.ok) throw new Error(intent.error);
      setMessage('Uploading audio…'); await uploadFile(intent.signed_url, file, intent.content_type, setProgress);
      setMessage('Activating audio…');
      const activated = await fetch('/api/admin/gleaux/upload', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot, path: intent.path }) });
      const result = await activated.json(); if (!activated.ok) throw new Error(result.error);
      onUploaded(result.path); setMessage('Uploaded and active.');
    } catch (error) { setMessage(error.message || 'Upload failed.'); }
    finally { setBusy(false); input.value = ''; }
  }
  return <section className={styles.slot}><span className={styles.tag}>{slot === 'player' ? '01 / STREAMING' : '02 / FREE DOWNLOAD'}</span><h2>{slot === 'player' ? 'Featured player audio' : 'Download file'}</h2><p>{slot === 'player' ? 'The audio visitors hear in the Gleaux player.' : 'The file visitors receive from the download button.'}</p><p className={styles.filename}>{path ? path.split('/').pop().slice(37) : 'No audio uploaded yet'}</p><label className={styles.upload}>{busy ? 'Uploading…' : path ? 'Replace audio' : 'Upload audio'}<input type="file" aria-label={`Upload ${slot} audio`} disabled={busy} accept=".mp3,.wav,.m4a,.ogg,.flac" onChange={upload} /></label><small>MP3, WAV, M4A, OGG or FLAC · Up to 200 MB</small>{busy && <progress aria-label="Upload progress" max="100" value={progress} />}<p role="status" className={styles.message}>{message}</p></section>;
}
export default function AdminGleauxPanel({ initialItem, initialCount }) {
  const [item, setItem] = useState(initialItem), [status, setStatus] = useState(''), [saving, setSaving] = useState(false);
  async function save(event) {
    event.preventDefault(); setSaving(true); setStatus('Saving…');
    try { const response = await fetch('/api/admin/gleaux', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: item.title, description: item.description, downloads_enabled: item.downloads_enabled }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setStatus('Settings saved.'); }
    catch (error) { setStatus(error.message || 'Save failed.'); } finally { setSaving(false); }
  }
  return <div className={styles.panel}><header><span className={styles.tag}>OWNER CONTROLS / GLEAUX FOR THE GIRLS</span><h1>Lets Gleaux</h1><p>Your dedicated campaign player and free download.</p><Link href="/lets-gleaux" target="_blank">View the Gleaux page ↗</Link></header><div className={styles.stats}><strong>{initialCount.toLocaleString()}</strong><span>Download requests<br /><small>Successful download links issued. Repeat requests within one minute are counted once per browser/network combination. File completion cannot be measured.</small></span></div><div className={styles.grid}>{['player', 'download'].map(slot => <UploadSlot key={slot} slot={slot} path={item[`${slot}_path`]} onUploaded={path => setItem(value => ({ ...value, [`${slot}_path`]: path }))} />)}</div><form className={styles.settings} onSubmit={save}><h2>Page settings</h2><label>Track title<input required maxLength="100" value={item.title} onChange={event => setItem({ ...item, title: event.target.value })} /></label><label>Campaign description<textarea maxLength="600" rows="4" value={item.description} onChange={event => setItem({ ...item, description: event.target.value })} /></label><label className={styles.check}><input type="checkbox" checked={item.downloads_enabled} onChange={event => setItem({ ...item, downloads_enabled: event.target.checked })} /> Enable free downloads</label><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button><p role="status">{status}</p></form></div>;
}
