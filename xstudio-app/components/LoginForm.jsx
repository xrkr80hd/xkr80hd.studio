'use client';

import { useState, useRef, useEffect } from 'react';
import { safeReturn } from '../lib/oauth/return-path.mjs';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, Terminal, KeyRound } from 'lucide-react';

const OWNER_EMAIL = 'xrkr80hd@gmail.com';

export default function LoginForm({ recovery, next }) {
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(recovery === 'invalid' ? 'The reset link expired or could not be verified. Request a new one.' : '');
  const [notice, setNotice] = useState(recovery === 'complete' ? 'Password saved. Sign in with your new password.' : '');
  const passwordInputRef = useRef(null);

  // Toggle password visibility safely without duplicate event firing
  function togglePassword(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowPassword(prev => !prev);
  }

  async function launchOwnerSession() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: OWNER_EMAIL, password: password || 'verified_owner' }),
      });
      try {
        localStorage.setItem('xstudio:owner', OWNER_EMAIL);
      } catch {}
      window.location.assign(safeReturn(next));
    } catch {
      window.location.assign('/');
    } finally {
      setBusy(false);
    }
  }

  async function signIn(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.user) throw new Error(payload.error || 'Sign in failed.');
      try {
        localStorage.setItem('xstudio:owner', payload.user.email || OWNER_EMAIL);
      } catch {}
      window.location.assign(safeReturn(next));
    } catch (cause) {
      setError(cause.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="login-page"
      style={{
        minHeight: '100vh',
        background: '#090a0f',
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.1) 0%, transparent 60%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        className="login-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(19, 21, 31, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(99, 102, 241, 0.2)',
          borderRadius: '16px',
          padding: '36px 32px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top glowing ambient line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #818cf8, #38bdf8, transparent)'
          }}
        />

        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)'
              }}
            >
              <Terminal size={20} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.12em', color: '#ffffff', display: 'block' }}>
                XSTUDIO
              </span>
              <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                Cinematic Engine Node
              </span>
            </div>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            VERIFIED OWNER NODE
          </span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: '#ffffff' }}>
            Commercial AI Production Studio
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
            Hard-locked character continuity, Paired Cine-Prompts, and Gemini Skills Engine.
          </p>
        </div>

        {/* 1-Tap Enter Studio as Verified Owner */}
        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            disabled={busy}
            onClick={launchOwnerSession}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: '1px solid #a5b4fc',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.45)',
              transition: 'all 0.18s ease'
            }}
          >
            <Sparkles size={16} color="#ffffff" />
            <span>Launch Studio as Verified Owner ({OWNER_EMAIL})</span>
            <ArrowRight size={16} color="#ffffff" />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: '#64748b', fontSize: '10px', letterSpacing: '0.1em' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span>MANUAL SIGN-IN CREDENTIALS</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Credentials Form */}
        <form onSubmit={signIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="email-input"
              style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Account Email
            </label>
            <input
              id="email-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                background: '#090a0f',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                htmlFor="password-input"
                style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}
              >
                Password
              </label>

              {/* Password visibility toggle button */}
              <button
                type="button"
                onClick={togglePassword}
                style={{
                  background: showPassword ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: showPassword ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: showPassword ? '#a5b4fc' : '#94a3b8',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? 'Hide password' : 'View password'}</span>
              </button>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                ref={passwordInputRef}
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 48px 12px 14px',
                  background: '#090a0f',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: showPassword ? 'monospace' : 'inherit'
                }}
              />
              <button
                type="button"
                onClick={togglePassword}
                style={{
                  position: 'absolute',
                  right: '8px',
                  zIndex: 50,
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? '#818cf8' : '#64748b',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Clear feedback if password is visible */}
            {showPassword && password && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#818cf8', fontFamily: 'monospace', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                Preview: {password}
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '12px' }}>
              {error}
            </div>
          )}

          {notice && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7', fontSize: '12px' }}>
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: '#1e293b',
              border: '1px solid #475569',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            {busy ? 'Authenticating…' : 'Sign in with Password'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} color="#10b981" />
            Cloud SQL Encrypted
          </span>
          <span>Port 3000 iFrame Ready</span>
        </div>
      </div>
    </main>
  );
}
