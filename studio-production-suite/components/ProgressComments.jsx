'use client';

import { useState } from 'react';
import styles from '../app/progress/progress.module.css';

function when(value) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function ProgressComments({ postId, initial = [], canPost = false, owner = false, signInHref = '' }) {
  const [items, setItems] = useState(initial);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/progress/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId, body: text }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Your note could not be posted.');
      setItems(list => [...list, { ...result.item, mine: true }]);
      setText('');
      setOpen(false);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Remove this note?')) return;
    const response = await fetch(`/api/progress/comments?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (response.ok) setItems(list => list.filter(item => item.id !== id));
  }

  if (!items.length && !canPost && !signInHref) return null;

  return (
    <section className={styles.notes} aria-label="Notes from family">
      {items.length > 0 && (
        <ul className={styles.noteList}>
          {items.map(item => (
            <li key={item.id}>
              <p className={styles.noteMeta}><strong>{item.author_name}</strong><span>{when(item.created_at)}</span>
                {(owner || item.mine) && <button type="button" className={styles.noteRemove} onClick={() => remove(item.id)}>Remove</button>}
              </p>
              <p className={styles.noteBody}>{item.body}</p>
            </li>
          ))}
        </ul>
      )}
      {!canPost && signInHref && <a className={styles.noteOpen} href={signInHref}>💛 Sign in to leave a note</a>}
      {canPost && (open ? (
        <form className={styles.noteForm} onSubmit={submit}>
          <textarea value={text} onChange={event => setText(event.target.value)} rows={3} maxLength={2000} placeholder="Send some love…" aria-label="Your note" autoFocus />
          <div>
            <button type="submit" className={styles.share} disabled={busy || !text.trim()}>{busy ? 'Posting…' : 'Post note'}</button>
            <button type="button" className={styles.linkButton} onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
          </div>
          {status && <p role="status" className={styles.gateStatus}>{status}</p>}
        </form>
      ) : (
        <button type="button" className={styles.noteOpen} onClick={() => setOpen(true)}>💛 Leave a note{items.length ? '' : ' of love'}</button>
      ))}
    </section>
  );
}
