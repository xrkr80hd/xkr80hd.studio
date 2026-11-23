'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MEMBER_TYPES, US_STATES } from '../../lib/community-rules.mjs';

export default function JoinForm({ mode = 'join', initialType = '' }) {
  const isJoin = mode === 'join';
  const [type, setType] = useState(MEMBER_TYPES.some((item) => item.key === initialType) ? initialType : '');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.mode = mode;
    if (isJoin) payload.member_type = type;
    if (isJoin && !type) {
      setError('Pick what kind of account this is.');
      return;
    }

    setStatus('sending');
    try {
      const response = await fetch('/api/community/auth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
      setSentTo(String(payload.email || ''));
      setStatus('sent');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <div className="yl-panel yl-narrow">
        <div className="yl-form">
          <h2>Check your email</h2>
          <p>
            We sent a sign-in link to <strong>{sentTo}</strong>. Open it on this device to {isJoin ? 'finish creating your account' : 'sign in'}.
          </p>
          <p className="yl-small">No email after a minute? Check your spam folder, or go back and try again.</p>
          <div className="yl-actions">
            <button type="button" className="yl-btn" onClick={() => setStatus('idle')}>
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="yl-panel yl-narrow yl-form" onSubmit={onSubmit} noValidate>
      {isJoin ? (
        <fieldset className="yl-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="yl-legend">I'm joining as a</legend>
          <div className="yl-types" role="radiogroup">
            {MEMBER_TYPES.map((item) => (
              <label key={item.key} className="yl-type">
                <input type="radio" name="member_type_choice" value={item.key} checked={type === item.key} onChange={() => setType(item.key)} />
                <strong>{item.label}</strong>
                <small>{item.blurb}</small>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {isJoin ? (
        <label className="yl-field">
          <span>{type === 'business' ? 'Business name' : type === 'band' ? 'Band name' : type === 'podcast' ? 'Podcast name' : 'Name'}</span>
          <input type="text" name="display_name" required minLength={2} maxLength={80} autoComplete="organization" />
        </label>
      ) : null}

      <label className="yl-field">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" inputMode="email" />
        {isJoin ? <span className="yl-hint">We email you a link to sign in. No password to remember.</span> : null}
      </label>

      {isJoin ? (
        <div className="yl-row">
          <label className="yl-field">
            <span>City or town</span>
            <input type="text" name="city" required maxLength={80} autoComplete="address-level2" />
          </label>
          <label className="yl-field">
            <span>State</span>
            <select name="state" required defaultValue="">
              <option value="" disabled>
                Pick
              </option>
              {US_STATES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <label className="yl-field">
            <span>ZIP</span>
            <input type="text" name="zip" required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="postal-code" />
          </label>
        </div>
      ) : null}

      {error ? (
        <p className="yl-alert" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="yl-btn yl-btn--primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending link…' : isJoin ? 'Join free' : 'Email me a sign-in link'}
      </button>

      <p className="yl-small">
        {isJoin ? (
          <>
            Already a member? <Link href="/signin">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/join">Join free</Link>
          </>
        )}
      </p>
    </form>
  );
}
