'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function HomeBioModal({ fullBio = '', headline = '' }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const bio = String(fullBio || '').trim();
  if (!bio) {
    return null;
  }

  const title = String(headline || 'XRKR80HD').trim() || 'XRKR80HD';

  const modal = mounted
    ? createPortal(
        <div
          className={`home-bio-overlay ${open ? 'open' : ''}`.trim()}
          aria-hidden={open ? 'false' : 'true'}
          onMouseDown={(event) => {
            if (open && event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            className={`home-bio-sheet ${open ? 'open' : ''}`.trim()}
            role="dialog"
            aria-modal={open ? 'true' : 'false'}
            aria-labelledby="home-bio-modal-title"
            aria-describedby="home-bio-modal-text"
          >
            <button type="button" className="home-bio-close" aria-label="Close full bio" onClick={() => setOpen(false)}>
              ×
            </button>
            <h3 id="home-bio-modal-title" className="section-title">
              {title} Full Bio
            </h3>
            <div className="home-bio-sheet-content">
              <div className="home-bio-sheet-text" id="home-bio-modal-text">
                <p>{bio}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button type="button" className="button" onClick={() => setOpen(true)}>
        Read full bio here
      </button>
      {modal}
    </>
  );
}
