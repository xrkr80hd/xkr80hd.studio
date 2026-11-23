'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../app/progress/progress.module.css';

export default function ProgressGallery({ photos = [], label = 'Photo' }) {
  const [open, setOpen] = useState(-1);
  const touchStart = useRef(null);
  const count = photos.length;
  const close = useCallback(() => setOpen(-1), []);
  const step = useCallback(delta => setOpen(index => (index + delta + count) % count), [count]);

  useEffect(() => {
    if (open < 0) return undefined;
    const onKey = event => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [open, close, step]);

  if (!count) return null;
  const layout = count === 1 ? styles.single : count === 3 ? styles.three : '';

  return (
    <>
      <div className={`${styles.photos} ${layout}`}>
        {photos.map((photo, index) => (
          <button key={photo.path} type="button" className={styles.photo} onClick={() => setOpen(index)} aria-label={`Open ${label.toLowerCase()} ${index + 1} of ${count}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`${label} ${index + 1}`} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      {open >= 0 && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${label} ${open + 1} of ${count}`}
          onClick={event => { if (event.target === event.currentTarget) close(); }}
          onTouchStart={event => { touchStart.current = event.touches[0].clientX; }}
          onTouchEnd={event => {
            if (touchStart.current === null || count < 2) return;
            const delta = event.changedTouches[0].clientX - touchStart.current;
            if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
            touchStart.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open].url} alt={`${label} ${open + 1}`} />
          <button type="button" className={styles.lightboxClose} onClick={close} aria-label="Close photo">×</button>
          {count > 1 && (
            <>
              <button type="button" className={`${styles.lightboxNav} ${styles.prev}`} onClick={() => step(-1)} aria-label="Previous photo">‹</button>
              <button type="button" className={`${styles.lightboxNav} ${styles.next}`} onClick={() => step(1)} aria-label="Next photo">›</button>
              <p className={styles.lightboxCount}>{open + 1} / {count}</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
