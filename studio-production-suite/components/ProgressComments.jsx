'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '../app/progress/progress.module.css';

const ROTATE_MS = 6000;

function when(value) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function ProgressComments({ postId, initial = [], canPost = false, owner = false, signInHref = '' }) {
  const [items, setItems] = useState(initial);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const box = useRef(null);
  const count = items.length;
  const rotating = count > 1 && !showAll;

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  // Keep the shown note in range when notes are added or removed.
  useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);

  // Each note shows for a few seconds, then the next one fades in. Stops while paused,
  // while someone is reading the full list, for reduced motion, or when the card is off screen.
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!box.current || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [rotating]);
  useEffect(() => {
    if (!rotating || paused || reduceMotion || !visible) return undefined;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [rotating, paused, reduceMotion, visible, count]);

  const step = delta => setIndex(current => (current + delta + count) % count);

  async function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/progress/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId, body: text }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Your note could not be posted.');
      setItems(list => { setIndex(list.length); return [...list, { ...result.item, mine: true }]; });
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
      {count > 0 && rotating && (() => {
        const item = items[Math.min(index, count - 1)];
        return (
          <div className={styles.noteCarousel} ref={box}>
            <figure
              key={item.id}
              className={styles.noteSlide}
              onClick={() => setPaused(value => !value)}
              aria-live={paused || reduceMotion ? 'polite' : 'off'}
              title={paused ? 'Tap to keep the notes moving' : 'Tap to pause'}
            >
              <blockquote className={styles.noteBody}>{item.body}</blockquote>
              <figcaption className={styles.noteMeta}>
                <strong>{item.author_name}</strong><span>{when(item.created_at)}</span>
                {(owner || item.mine) && <button type="button" className={styles.noteRemove} onClick={event => { event.stopPropagation(); remove(item.id); }}>Remove</button>}
              </figcaption>
            </figure>
            <div className={styles.noteControls}>
              <button type="button" className={styles.noteArrow} onClick={() => step(-1)} aria-label="Previous note">‹</button>
              <span className={styles.noteCount}>{Math.min(index, count - 1) + 1} / {count}{paused && !reduceMotion ? ' · paused' : ''}</span>
              <button type="button" className={styles.noteArrow} onClick={() => step(1)} aria-label="Next note">›</button>
              <button type="button" className={styles.linkButton} onClick={() => setShowAll(true)}>See all {count} notes</button>
            </div>
          </div>
        );
      })()}
      {count > 0 && !rotating && (
        <>
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
          {count > 1 && <button type="button" className={`${styles.linkButton} ${styles.noteBack}`} onClick={() => setShowAll(false)}>Show one at a time</button>}
        </>
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
