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

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function DashboardIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6L12 3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function SwitchIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2.5" y="7" width="19" height="10" rx="5" />
      <circle cx="16.5" cy="12" r="2.6" />
    </svg>
  );
}

// Small icon dock at the bottom of public pages, only for a signed-in admin.
export default function AdminViewBar({ visitorView }) {
  const router = useRouter();

  const toggleVisitor = (on) => {
    setVisitorView(on);
    router.refresh();
  };

  if (visitorView) {
    return (
      <nav className="admin-dock is-visitor" aria-label="Visitor view">
        <button
          type="button"
          className="admin-dock-btn active"
          onClick={() => toggleVisitor(false)}
          aria-label="Back to admin view"
          data-tip="Back to admin view"
        >
          <ShieldIcon />
        </button>
      </nav>
    );
  }

  return (
    <nav className="admin-dock" aria-label="Admin shortcuts">
      <Link href="/admin" prefetch={false} className="admin-dock-btn" aria-label="Dashboard" data-tip="Dashboard">
        <DashboardIcon />
      </Link>
      <button type="button" className="admin-dock-btn" onClick={() => toggleVisitor(true)} aria-label="View as visitor" data-tip="View as visitor">
        <EyeIcon />
      </button>
      <Link href="/admin?open=pages#page-switches" prefetch={false} className="admin-dock-btn" aria-label="Pages on or off" data-tip="Pages on/off">
        <SwitchIcon />
      </Link>
    </nav>
  );
}
