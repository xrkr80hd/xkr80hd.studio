'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getAdminGroups } from '../lib/admin-nav';

function isActive(pathname, href) {
  if (href === '/admin') return pathname === '/admin' || pathname === '/admin/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminTopBar({ ownerMode = false, adminUser = '' }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [open, setOpen] = useState('');
  const barRef = useRef(null);
  const groups = getAdminGroups(ownerMode);
  const current = groups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href));

  useEffect(() => {
    setOpen('');
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (barRef.current && !barRef.current.contains(event.target)) setOpen('');
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen('');
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  }

  const toggle = (name) => setOpen((value) => (value === name ? '' : name));

  return (
    <header ref={barRef} className="admin-bar">
      <div className="container admin-bar-inner">
        <Link prefetch={false} href="/admin" className="brand admin-brand admin-bar-brand">
          xrkr80hd <span className="admin-bar-tag">Admin</span>
        </Link>

        <nav className="admin-bar-main" aria-label="Admin">
          <Link prefetch={false} href="/admin" className={`admin-bar-link hide-sm ${isActive(pathname, '/admin') ? 'active' : ''}`.trim()}>
            Dashboard
          </Link>
          <button
            type="button"
            className={`admin-bar-link admin-bar-menu-btn ${open === 'menu' ? 'active' : ''}`.trim()}
            aria-expanded={open === 'menu'}
            aria-controls="admin-bar-menu"
            onClick={() => toggle('menu')}
          >
            {current ? current.label : 'Menu'} <span aria-hidden="true">▾</span>
          </button>
          <Link prefetch={false} href="/" className="admin-bar-link hide-sm">
            View site ↗
          </Link>
        </nav>

        <div className="admin-bar-account hide-sm">
          <button type="button" className="admin-bar-chip" aria-expanded={open === 'account'} onClick={() => toggle('account')}>
            {adminUser || 'Admin'} <span aria-hidden="true">▾</span>
          </button>
          {open === 'account' ? (
            <div className="admin-bar-pop admin-bar-account-pop">
              <p>Signed in as <strong>{adminUser || 'admin'}</strong></p>
              <Link prefetch={false} href="/admin/password">My Password</Link>
              <button type="button" className="admin-bar-signout" onClick={signOut}>Sign out</button>
            </div>
          ) : null}
        </div>

        {open === 'menu' ? (
          <div id="admin-bar-menu" className="admin-bar-pop admin-bar-menu">
            <div className="admin-bar-quick show-sm">
              <Link prefetch={false} href="/admin">Dashboard</Link>
              <Link prefetch={false} href="/">View site ↗</Link>
            </div>
            <div className="admin-bar-groups">
              {groups.map((group) => (
                <div key={group.key} className="admin-bar-group">
                  <p className="admin-bar-group-title">{group.title}</p>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      prefetch={false}
                      href={item.href}
                      className={isActive(pathname, item.href) ? 'active' : ''}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            <div className="admin-bar-quick show-sm admin-bar-quick-account">
              <span>Signed in as <strong>{adminUser || 'admin'}</strong></span>
              <button type="button" className="admin-bar-signout" onClick={signOut}>Sign out</button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
