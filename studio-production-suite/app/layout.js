import { Space_Grotesk, Syne } from 'next/font/google';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import BackgroundRotator from '../components/BackgroundRotator';
import GoogleAnalytics from '../components/GoogleAnalytics';
import SiteHeader from '../components/SiteHeader';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_USER_COOKIE, isAdminSessionValid, isOwnerUsername } from '../lib/admin-auth';
import './globals.css';

const space = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['400', '500', '700'],
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['600', '700', '800'],
});

export const metadata = {
  title: 'xrkr80hd Studio',
  description: 'XRKR80HDLocal hub for bands, tracks, projects, and media.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/site.webmanifest',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const sessionValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || '';
  const sessionUser = cookieStore.get(ADMIN_SESSION_USER_COOKIE)?.value || '';
  const adminMode = isAdminSessionValid(sessionValue);
  const ownerMode = adminMode && isOwnerUsername(sessionUser);

  return (
    <html lang="en">
      <body className={`${space.variable} ${syne.variable} page-standard`}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <BackgroundRotator />
        <SiteHeader adminMode={adminMode} ownerMode={ownerMode} adminUser={adminMode ? sessionUser : ''} />
        <main>
          <div className="container">{children}</div>
        </main>
      </body>
    </html>
  );
}
