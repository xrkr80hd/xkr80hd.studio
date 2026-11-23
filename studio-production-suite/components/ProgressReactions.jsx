'use client';

import { useState } from 'react';
import styles from '../app/progress/progress.module.css';
import { REACTIONS } from '../lib/progress-reactions.mjs';

export default function ProgressReactions({ postId, initial, canReact = false, signInHref = '' }) {
  const [counts, setCounts] = useState(initial?.counts || {});
  const [mine, setMine] = useState(new Set(initial?.mine || []));
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState('');

  async function toggle(emoji) {
    if (!canReact) {
      if (signInHref) window.location.hash = signInHref.replace('#', '');
      setStatus('Want to react? Just send a text to Trav.');
      return;
    }
    if (busy) return;
    const was = mine.has(emoji);
    const apply = on => {
      setMine(current => { const next = new Set(current); if (on) next.add(emoji); else next.delete(emoji); return next; });
      setCounts(current => ({ ...current, [emoji]: Math.max(0, (current[emoji] || 0) + (on ? 1 : -1)) }));
    };
    apply(!was);
    setBusy(emoji);
    setStatus('');
    try {
      const response = await fetch('/api/progress/reactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId, emoji }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Your reaction could not be saved.');
      if (result.active === was) apply(result.active);
    } catch (error) {
      apply(was);
      setStatus(error.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className={styles.reactions}>
      <div className={styles.reactionRow} role="group" aria-label="Reactions">
        {REACTIONS.map(emoji => {
          const count = counts[emoji] || 0;
          const active = mine.has(emoji);
          if (!canReact && !count) return null;
          return (
            <button key={emoji} type="button" className={active ? `${styles.reaction} ${styles.reactionOn}` : styles.reaction} onClick={() => toggle(emoji)} aria-pressed={active} aria-label={`${emoji} ${count}`}>
              <span aria-hidden="true">{emoji}</span>{count > 0 && <span className={styles.reactionCount}>{count}</span>}
            </button>
          );
        })}
      </div>
      {status && <p role="status" className={styles.gateStatus}>{status}</p>}
    </div>
  );
}
