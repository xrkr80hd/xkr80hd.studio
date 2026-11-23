'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const COOKIE = 'xrkr_view_as';

export function setVisitorView(on) {
  document.cookie = on
    ? `${COOKIE}=visitor; path=/; max-age=86400; samesite=lax`
    : `${COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function ViewAsVisitorButton({ goTo = '/' }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="button"
      onClick={() => {
        setVisitorView(true);
        router.push(goTo);
        router.refresh();
      }}
    >
      View as visitor
    </button>
  );
}

// Floating bar on public pages, only for a signed-in admin.
export default function AdminViewBar({ visitorView }) {
  const router = useRouter();

  if (visitorView) {
    return (
      <div className="admin-view-bar is-visitor" role="region" aria-label="Visitor view">
        <span className="admin-view-bar-label">Visitor view</span>
        <button
          type="button"
          className="admin-view-bar-btn primary"
          onClick={() => {
            setVisitorView(false);
            router.refresh();
          }}
        >
          Back to admin view
        </button>
      </div>
    );
  }

  return (
    <div className="admin-view-bar" role="region" aria-label="Admin shortcuts">
      <Link href="/admin" prefetch={false} className="admin-view-bar-btn primary">
        ← Dashboard
      </Link>
      <button
        type="button"
        className="admin-view-bar-btn"
        onClick={() => {
          setVisitorView(true);
          router.refresh();
        }}
      >
        View as visitor
      </button>
    </div>
  );
}
