'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const OWNER_EMAIL = 'xrkr80hd@gmail.com';

export default function LoginForm({ recovery }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(recovery === 'invalid' ? 'The reset link expired or could not be verified. Request a new one.' : '');
  const [notice, setNotice] = useState(recovery === 'complete' ? 'Password saved. Sign in with your new password.' : '');

  async function signIn(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.user) throw new Error(payload.error || 'Sign in failed.');
      window.location.assign('/');
    } catch (cause) {
      setError(cause.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function sendRecovery() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      );
      const { error: recoveryError } = await client.auth.resetPasswordForEmail(OWNER_EMAIL, {
        redirectTo: 'https://xstudio.xrkr80hd.studio/auth/callback',
      });
      if (recoveryError) throw recoveryError;
      setNotice('If the owner account can receive email, a reset link is on its way. Open it in this browser.');
    } catch {
      setError('Could not send a reset link. Please try again shortly.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="XSTUDIO introduction">
        <div className="login-brand">XSTUDIO <span>PRIVATE PRODUCTION WORKSPACE</span></div>
        <div className="login-story-main"><img className="login-art" src="/xstudio.jpg" alt=""/><div><h1>Everything you create, <em>connected.</em></h1><p>Your private home for production references and assets from the tools you use.</p></div></div>
        <div className="login-story-foot">xstudio.xrkr80hd.studio</div>
      </section>
      <section className="login-panel" aria-labelledby="login-title"><div className="login-card"><span className="section-kicker">OWNER ACCESS</span><h2 id="login-title">Welcome back.</h2><p>Sign in with the owner account assigned to this studio.</p><form onSubmit={signIn}><div className="field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required/></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required/></div>{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}<button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Sign in to XSTUDIO'}</button></form><button className="text-button recovery-link" type="button" onClick={sendRecovery} disabled={busy}>Forgot your password? Email a reset link</button><div className="login-hint"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg> This workspace is restricted to the verified owner.</div></div></section>
    </main>
  );
}
