'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const publicNavItems = [
  { href: '/', label: 'Home', className: 'nav-cool' },
  {
    href: '/hub',
    label: (
      <span className="split-label">
        <span className="split-cool">XRKR</span>
        <span className="split-80">80</span>
        <span className="split-cool">HD</span>
        <span className="split-space"> </span>
        <span className="split-white">Hub</span>
      </span>
    ),
  },
  {
    href: '/local-legends-archive',
    label: (
      <span className="split-label">
        <span className="split-cool">YourLocal</span>
        <span className="split-space"> </span>
        <span className="split-white">Legends</span>
      </span>
    ),
  },
  {
    href: '/your-local-scene',
    label: (
      <span className="split-label">
        <span className="split-cool">YourLocal</span>
        <span className="split-space"> </span>
        <span className="split-white">Scene</span>
      </span>
    ),
  },
  {
    href: '/your-local-blog',
    label: (
      <span className="split-label">
        <span className="split-cool">YourLocal</span>
        <span className="split-space"> </span>
        <span className="split-white">Blog</span>
      </span>
    ),
  },
  {
    href: '/podcast',
    label: (
      <span className="split-label">
        <span className="split-cool">YourLocal</span>
        <span className="split-space"> </span>
        <span className="split-white">Podcast</span>
      </span>
    ),
  },
  {
    href: '/your-local-business',
    label: (
      <span className="split-label">
        <span className="split-cool">YourLocal</span>
        <span className="split-space"> </span>
        <span className="split-white">Business</span>
      </span>
    ),
  },
  { href: '/contact', label: 'Contact', className: 'nav-cool' },
];

function getAdminNavItems(ownerMode) {
  const items = [
    { href: '/admin', label: 'Dashboard', className: 'nav-admin-link' },
    { href: '/admin/guide', label: 'Guide', className: 'nav-admin-link' },
    { href: '/admin/blog', label: 'Blog', className: 'nav-admin-link' },
    { href: '/admin/bands', label: 'Bands', className: 'nav-admin-link' },
    { href: '/admin/podcasts', label: 'Podcasts', className: 'nav-admin-link' },
    { href: '/admin/business', label: 'Business', className: 'nav-admin-link' },
    { href: '/admin/password', label: 'Password', className: 'nav-admin-link' },
    { href: '/hub', label: 'Hub', className: 'nav-admin-link nav-admin-secondary' },
    { href: '/', label: 'Site', className: 'nav-admin-link nav-admin-secondary' },
  ];

  if (ownerMode) {
    items.push({ href: '/admin/home', label: 'Home', className: 'nav-admin-link' });
    items.push({ href: '/admin/tracks', label: 'Hub Tracks', className: 'nav-admin-link' });
    items.push({ href: '/admin/users', label: 'Users', className: 'nav-admin-link' });
  }

  return items;
}

function isActive(pathname, href) {
  if (href === '/') {
    return pathname === '/';
  }

  if (href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/dashboard';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader({ adminMode = false, ownerMode = false, adminUser = '' }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = adminMode ? getAdminNavItems(ownerMode) : publicNavItems;

  return (
    <header className={`nav ${adminMode ? 'admin-mode' : ''}`.trim()}>
      <div className="container nav-inner">
        <Link prefetch={false} href={adminMode ? '/admin' : '/'} className={`brand ${adminMode ? 'admin-brand' : ''}`.trim()} onClick={() => setOpen(false)}>
          xrkr80hd.studio
        </Link>
        <button
          className={`nav-toggle ${adminMode ? 'admin-toggle' : ''}`.trim()}
          type="button"
          aria-label={adminMode ? 'Toggle admin navigation' : 'Toggle navigation'}
          aria-expanded={open ? 'true' : 'false'}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`nav-links ${open ? 'open' : ''}`} id="site-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`${item.className || ''} ${isActive(pathname, item.href) ? 'active' : ''}`.trim()}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {adminMode && adminUser ? <span className="nav-admin-user nav-admin-user-mobile">Signed in: {adminUser}</span> : null}
        </nav>
        {adminMode && adminUser ? <span className="nav-admin-user nav-admin-user-desktop">Signed in: {adminUser}</span> : null}
      </div>
    </header>
  );
}
