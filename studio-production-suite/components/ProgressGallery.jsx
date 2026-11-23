'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../app/progress/progress.module.css';

const CAROUSEL_AFTER = 3;
const ROTATE_MS = 4500;
const HOLD_MS = 8000;

export default function ProgressGallery({ photos = [], label = 'Photo' }) {
  const [open, setOpen] = useState(-1);
  const touchStart = useRef(null);
  const count = photos.length;
  const close = useCallback(() => setOpen(-1), []);
  const step = useCallback(delta => setOpen(index => (index + delta + count) % count), [count]);

  // More than three photos: a slow, swipeable carousel with two showing at a time.
  const carousel = count > CAROUSEL_AFTER;
  const track = useRef(null);
  const holdUntil = useRef(0);
  const [slide, setSlide] = useState(0);
  const slideRef = useRef(0);
  const [visible, setVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const lastStart = Math.max(0, count - 2);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!carousel || !track.current || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(track.current);
    return () => observer.disconnect();
  }, [carousel]);

  const goTo = useCallback((target, smooth = true) => {
    const el = track.current;
    const first = el?.children[0];
    if (!el || !first) return;
    const width = first.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || '0');
    el.scrollTo({ left: target * width, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const hold = () => { holdUntil.current = Date.now() + HOLD_MS; };
  const nudge = delta => {
    hold();
    const next = slide + delta;
    goTo(next > lastStart ? 0 : next < 0 ? lastStart : next);
  };

  useEffect(() => {
    if (!carousel || reduceMotion || !visible || open >= 0) return undefined;
    const timer = window.setInterval(() => {
      if (Date.now() < holdUntil.current) return;
      const current = slideRef.current;
      goTo(current >= lastStart ? 0 : current + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [carousel, reduceMotion, visible, open, lastStart, goTo]);

  const onScroll = () => {
    const el = track.current;
    const first = el?.children[0];
    if (!el || !first) return;
    const width = first.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || '0');
    const current = Math.min(lastStart, Math.round(el.scrollLeft / width));
    slideRef.current = current;
    setSlide(current);
  };

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
  const thumbs = photos.map((photo, index) => (
    <button key={photo.path} type="button" className={styles.photo} onClick={() => setOpen(index)} aria-label={`Open ${label.toLowerCase()} ${index + 1} of ${count}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={`${label} ${index + 1}`} loading="lazy" decoding="async" />
    </button>
  ));

  return (
    <>
      {carousel ? (
        <div className={styles.photoCarousel}>
          <div
            ref={track}
            className={styles.photoTrack}
            onScroll={onScroll}
            onPointerDown={hold}
            onTouchStart={hold}
            onWheel={hold}
            onMouseEnter={hold}
            onFocus={hold}
            aria-label={`${count} photos`}
          >
            {thumbs}
          </div>
          <div className={styles.noteControls}>
            <button type="button" className={styles.noteArrow} onClick={() => nudge(-1)} aria-label="Previous photos">‹</button>
            <span className={styles.noteCount}>{slide + 1}–{Math.min(count, slide + 2)} of {count}</span>
            <button type="button" className={styles.noteArrow} onClick={() => nudge(1)} aria-label="Next photos">›</button>
          </div>
        </div>
      ) : (
        <div className={`${styles.photos} ${layout}`}>{thumbs}</div>
      )}

      {/* The full-size view is drawn at the top of the page, outside the update card,
          so phones size and place it against the whole screen. */}
      {open >= 0 && typeof document !== 'undefined' && createPortal(
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
        </div>,
        document.body,
      )}
    </>
  );
}
