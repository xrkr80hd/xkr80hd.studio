'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { shouldTrackGoogleAnalytics } from '../lib/google-analytics.mjs';

const MEASUREMENT_ID = 'G-3ZHD6MN490';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scriptReady, setScriptReady] = useState(false);
  const lastTrackedPage = useRef('');
  const trackingAllowed = shouldTrackGoogleAnalytics(pathname);
  const queryString = searchParams.toString();

  useEffect(() => {
    if (!scriptReady || !trackingAllowed || typeof window.gtag !== 'function') {
      return;
    }

    const pagePath = queryString ? `${pathname}?${queryString}` : pathname;

    if (lastTrackedPage.current === pagePath) {
      return;
    }

    lastTrackedPage.current = pagePath;
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, queryString, scriptReady, trackingAllowed]);

  if (!trackingAllowed) {
    return null;
  }

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
      strategy="afterInteractive"
      onLoad={() => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
        setScriptReady(true);
      }}
    />
  );
}
