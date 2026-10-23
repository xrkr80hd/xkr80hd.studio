'use client';

import { useState } from 'react';

export default function PasswordResetForm() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(event) {
    event.preventDefault();
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Password update failed.');
      window.location.assign('/login?recovery=complete');
    } catch (cause) {
      setError(cause.message || 'Password update failed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-page"><section className="login-story" aria-label="XSTUDIO introduction"><div className="login-brand">XSTUDIO <span>PRIVATE PRODUCTION WORKSPACE</span></div><div className="login-story-main"><img className="login-art" src="/xstudio.jpg" alt=""/><div><h1>Secure your <em>studio.</em></h1><p>Choose a new password for your owner account.</p></div></div><div className="login-story-foot">xstudio.xrkr80hd.studio</div></section><section className="login-panel" aria-labelledby="reset-title"><div className="login-card"><span className="section-kicker">OWNER RECOVERY</span><h2 id="reset-title">Set a new password.</h2><p>Use at least 12 characters. You will sign in again afterward.</p><form onSubmit={save}><div className="field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} required/></div><div className="field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required/></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button></form></div></section></main>;
}
