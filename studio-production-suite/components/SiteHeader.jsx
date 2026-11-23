'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AdminTopBar from './AdminTopBar';
import AdminViewBar from './AdminViewBar';

const publicNavItems = [
  { href: '/', label: 'Home', className: 'nav-cool' },
  { href: '/lets-gleaux', label: 'Lets Gleaux', className: 'nav-gleaux' },
  { href: '/progress', label: "Ashley's Progress", className: 'nav-progress' },
  { href: '/hub', label: 'XRKR80HD Hub', className: 'nav-cool' },
  { href: '/local-legends-archive', label: 'Legends', className: 'nav-cool' },
  { href: '/your-local-scene', label: 'Scene', className: 'nav-cool' },
  { href: '/your-local-artists', label: 'Artists', className: 'nav-cool' },
  { href: '/your-local-blog', label: 'Blog', className: 'nav-cool' },
  { href: '/podcast', label: 'Podcast', className: 'nav-cool' },
  { href: '/your-local-business', label: 'Business', className: 'nav-cool' },
  { href: '/contact', label: 'Contact', className: 'nav-cool' },
  { href: '/join', label: 'Join', className: 'nav-join' },
];

function isActive(pathname, href) {
  if (href === '/') {
    return pathname === '/';
  }

  if (href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/dashboard';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader({ adminMode = false, ownerMode = false, adminUser = '', visitorView = false, hiddenPaths = [] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);
  const isAdminRoute = pathname === '/admin' || pathname?.startsWith('/admin/');
  const showAdminMode = adminMode && isAdminRoute;
  const adminSeesOffPages = adminMode && !visitorView;
  const hidden = new Set(hiddenPaths);
  const visiblePublicItems = publicNavItems
    .filter((item) => adminSeesOffPages || !hidden.has(item.href))
    .map((item) => (hidden.has(item.href) ? { ...item, label: `${item.label} (off)`, className: `${item.className || ''} nav-off`.trim() } : item));
  const navItems = visiblePublicItems;
  const showViewBar = adminMode && !isAdminRoute;

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

  if (showAdminMode) {
    return <AdminTopBar ownerMode={ownerMode} adminUser={adminUser} />;
  }

  return (
    <>
    <header ref={headerRef} className="nav">
      <div className="container nav-inner">
        <Link prefetch={false} href="/" className="brand" onClick={() => setOpen(false)}>
          xrkr80hd.studio
        </Link>
        <button
          className="nav-toggle"
          type="button"
          aria-label="Toggle navigation"
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
        </nav>
      </div>
    </header>
    {showViewBar ? <AdminViewBar visitorView={visitorView} /> : null}
    </>
  );
}
