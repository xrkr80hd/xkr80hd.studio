'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

// The emailed link returns here with the sign-in code in the URL fragment
// (#access_token=...). The fragment never reaches a server log; we post it
// once to our own server, which checks it with Supabase and sets the cookie.
export default function JoinCallback() {
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search);
    const accessToken = hash.get('access_token') || '';
    const linkError = hash.get('error_description') || query.get('error_description') || '';
    window.history.replaceState(null, '', window.location.pathname);

    if (!accessToken) {
      setError(linkError ? 'That sign-in link has expired or was already used. Request a new one.' : 'That sign-in link is missing its code. Request a new one.');
      return;
    }

    fetch('/api/community/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Sign-in failed. Request a new link.');
        window.location.replace(result.isNew ? '/account?welcome=1' : '/account');
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="yl-panel yl-narrow">
      <div className="yl-form">
        {error ? (
          <>
            <h2>We couldn't sign you in</h2>
            <p className="yl-alert" role="alert">
              {error}
            </p>
            <div className="yl-actions">
              <Link className="yl-btn yl-btn--primary" href="/signin">
                Get a new link
              </Link>
              <Link className="yl-btn" href="/join">
                Join free
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2>Signing you in…</h2>
            <p>One moment.</p>
          </>
        )}
      </div>
    </div>
  );
}
