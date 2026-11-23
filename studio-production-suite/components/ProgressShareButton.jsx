'use client';

import { useState } from 'react';
import styles from '../app/progress/progress.module.css';

export default function ProgressShareButton({ path = '/progress', title = "Ashley's Progress", label = 'Share this page', small = false }) {
  const [status, setStatus] = useState('');

  async function share() {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus('Link copied');
    } catch (error) {
      if (error?.name !== 'AbortError') setStatus(url);
    }
    window.setTimeout(() => setStatus(''), 4000);
  }

  return (
    <span className={styles.shareWrap}>
      <button type="button" className={small ? styles.shareSmall : styles.share} onClick={share}>{label}</button>
      <span role="status" className={styles.shareStatus}>{status}</span>
    </span>
  );
}
