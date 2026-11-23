'use client';

import { useState } from 'react';
import styles from '../app/progress/progress.module.css';

export default function ProgressSignIn({ invite = '', emailReady = false, notice = '', compact = false }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState(notice);
  const viaInvite = Boolean(invite);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch(viaInvite ? '/api/progress/auth/join' : '/api/progress/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, invite }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
      if (viaInvite) { window.location.replace('/progress?signin=welcome'); return; }
      setSent(true);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <section className={styles.gate}>
        <h2>Check your email</h2>
        <p>We sent a sign-in link to <strong>{email}</strong>. Open it on this device within the hour and you'll stay signed in for 30 days.</p>
        <p className={styles.gateHint}>Don't see it? Check your spam or promotions folder.</p>
        <button type="button" className={styles.linkButton} onClick={() => setSent(false)}>Use a different email</button>
      </section>
    );
  }

  if (compact && !viaInvite && !emailReady) return null;

  if (!viaInvite && !emailReady) {
    return (
      <section className={styles.gate}>
        <h2>This page is for family and friends</h2>
        <p>Ask Travis for your invite link. It signs you in on this device for 30 days, no password needed.</p>
        {status && <p role="status" className={styles.gateStatus}>{status}</p>}
      </section>
    );
  }

  return (
    <form className={styles.gate} onSubmit={submit}>
      <h2>{viaInvite ? "You're invited" : compact ? 'Want to leave a note?' : 'Sign in to see updates'}</h2>
      <p>{viaInvite
        ? "Add your name and email and you're in. You'll stay signed in on this device for 30 days."
        : "Enter your name and email. We'll send a one-tap link, no password needed, and you'll stay signed in for 30 days."}</p>
      <label>
        Your name
        <input value={name} onChange={event => setName(event.target.value)} autoComplete="name" maxLength={80} required placeholder="First and last name" />
      </label>
      <label>
        Email
        <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" inputMode="email" maxLength={254} required placeholder="you@example.com" />
      </label>
      <button type="submit" className={styles.share} disabled={busy}>{busy ? 'One moment…' : viaInvite ? 'Join' : 'Email me a link'}</button>
      {status && <p role="status" className={styles.gateStatus}>{status}</p>}
    </form>
  );
}
