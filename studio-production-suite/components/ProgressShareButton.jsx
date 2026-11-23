'use client';

import { useState } from 'react';
import styles from '../app/progress/progress.module.css';

export default function ProgressShareButton() {
  const [status, setStatus] = useState('');

  async function share() {
    const url = `${window.location.origin}/progress`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ashley's Progress", text: 'Updates for family and friends', url });
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
      <button type="button" className={styles.share} onClick={share}>Share this page</button>
      <span role="status" className={styles.shareStatus}>{status}</span>
    </span>
  );
}
