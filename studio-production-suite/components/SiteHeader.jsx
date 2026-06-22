'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const publicNavItems = [
  { href: '/', label: 'Home', className: 'nav-cool' },
  { href: '/hub', label: 'XRKR80HD Hub', className: 'nav-cool' },
  { href: '/local-legends-archive', label: 'Legends', className: 'nav-cool' },
  { href: '/your-local-scene', label: 'Scene', className: 'nav-cool' },
  { href: '/your-local-artists', label: 'Artists', className: 'nav-cool' },
  { href: '/your-local-blog', label: 'Blog', className: 'nav-cool' },
  { href: '/podcast', label: 'Podcast', className: 'nav-cool' },
  { href: '/your-local-business', label: 'Business', className: 'nav-cool' },
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
  const headerRef = useRef(null);
  const navItems = adminMode ? getAdminNavItems(ownerMode) : publicNavItems;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const header = headerRef.current;
      if (!header || header.contains(event.target)) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <header ref={headerRef} className={`nav ${adminMode ? 'admin-mode' : ''}`.trim()}>
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
