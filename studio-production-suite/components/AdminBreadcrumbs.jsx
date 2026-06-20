'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS = {
  dashboard: 'Dashboard',
  home: 'Homepage Controls',
  tracks: 'Hub Tracks',
  users: 'Manage Admin Users',
  guide: 'Admin Guide',
  blog: 'Blog Manager',
  bands: 'Band Manager',
  podcasts: 'Podcast Manager',
  business: 'Business Manager',
  password: 'My Password',
  new: 'New',
  edit: 'Edit',
  socials: 'Socials',
};

function toLabel(segment) {
  const clean = decodeURIComponent(segment || '').trim();
  if (!clean) {
    return 'Section';
  }

  if (LABELS[clean]) {
    return LABELS[clean];
  }

  return clean
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === '/admin' || pathname === '/admin/login') {
    return null;
  }

  const allSegments = pathname.split('/').filter(Boolean);
  if (!allSegments.length || allSegments[0] !== 'admin') {
    return null;
  }

  const segments = allSegments.slice(1);
  if (!segments.length) {
    return null;
  }

  return (
    <nav className="admin-breadcrumbs" aria-label="Admin breadcrumbs">
      <Link href="/admin">Admin Dashboard</Link>
      {segments.map((segment, index) => {
        const href = `/admin/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;

        return (
          <span key={`${href}-${segment}`} className="admin-breadcrumb-item">
            <span className="admin-breadcrumb-sep" aria-hidden="true">
              /
            </span>
            {isLast ? <span>{toLabel(segment)}</span> : <Link href={href}>{toLabel(segment)}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
