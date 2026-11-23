'use client';

import { useEffect } from 'react';

// If Supabase sends a member's sign-in link to a page other than /join/callback
// (for example the front page, its default), pass the sign-in code on to the
// callback page so the member still ends up signed in on their account page.
export default function AuthHashForwarder() {
  useEffect(() => {
    const { hash, pathname } = window.location;
    if (!hash || pathname === '/join/callback') return;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const isSupabaseAuth = params.has('access_token') && params.get('token_type') === 'bearer';
    const isSupabaseError = params.has('error_description') && params.has('error_code');
    if (isSupabaseAuth || isSupabaseError) {
      window.location.replace(`/join/callback${hash}`);
    }
  }, []);
  return null;
}
