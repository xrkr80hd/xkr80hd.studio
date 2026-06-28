'use client';

import { useEffect, useRef } from 'react';

export default function AutoFitChannelTitle({ title, className = 'blog-channel-hero-title' }) {
  const frameRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const frame = frameRef.current;
    const label = labelRef.current;
    if (!frame || !label) {
      return;
    }

    const fit = () => {
      label.style.fontSize = '';

      const frameStyle = window.getComputedStyle(frame);
      const baseFont = parseFloat(window.getComputedStyle(label).fontSize) || 16;
      const minFont = 13;
      const padLeft = parseFloat(frameStyle.paddingLeft) || 0;
      const padRight = parseFloat(frameStyle.paddingRight) || 0;
      const available = Math.max(frame.clientWidth - padLeft - padRight, 0);
      const required = label.scrollWidth;

      if (!available || !required) {
        return;
      }

      const ratio = Math.min(1, available / required);
      const nextFont = Math.max(minFont, Math.floor(baseFont * ratio));
      label.style.fontSize = `${nextFont}px`;
    };

    fit();

    const observer = new ResizeObserver(() => fit());
    observer.observe(frame);

    return () => observer.disconnect();
  }, [title]);

  return (
    <h1 className={className} ref={frameRef}>
      <span className="blog-channel-hero-title-text" ref={labelRef}>{title}</span>
    </h1>
  );
}
