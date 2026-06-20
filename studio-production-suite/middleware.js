import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_USER_COOKIE, isAdminConfigReady, isAdminSessionValid, isOwnerUsername } from './lib/admin-auth';

function isProtectedPath(pathname) {
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/session')) {
    return false;
  }

  return (
    pathname === '/hub' ||
    pathname.startsWith('/hub/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/upload' ||
    pathname.startsWith('/upload/') ||
    pathname === '/api/upload' ||
    pathname.startsWith('/api/upload/') ||
    pathname.startsWith('/api/admin/')
  );
}

function isNonOwnerAllowedPath(pathname) {
  return (
    pathname === '/admin' ||
    pathname === '/admin/blog' ||
    pathname.startsWith('/admin/blog/') ||
    pathname === '/api/admin/blog' ||
    pathname.startsWith('/api/admin/blog/') ||
    pathname === '/api/upload' ||
    pathname.startsWith('/api/upload/')
  );
}

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAdminConfigReady()) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Admin auth is not configured on the server.' }, { status: 500 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('error', 'config');
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '';

  if (isAdminSessionValid(sessionCookie)) {
    const sessionUser = request.cookies.get(ADMIN_SESSION_USER_COOKIE)?.value || '';
    if (!isOwnerUsername(sessionUser) && !isNonOwnerAllowedPath(pathname)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Only owner can access this route.' }, { status: 403 });
      }

      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = '/admin';
      adminUrl.searchParams.set('error', 'scope');
      adminUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(adminUrl);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('next', pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/upload/:path*', '/api/upload/:path*', '/api/admin/:path*'],
};
