'use client';

import { useState } from 'react';

export default function AdminPageSwitches({ pages, initialEnabled, ready, setupSql }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [needsSetup, setNeedsSetup] = useState(!ready);
  const [copied, setCopied] = useState(false);

  async function toggle(page) {
    const next = !enabled[page.key];
    setSaving(page.key);
    setMessage('');
    setEnabled((current) => ({ ...current, [page.key]: next }));
    try {
      const response = await fetch('/api/admin/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: page.key, enabled: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setEnabled((current) => ({ ...current, [page.key]: !next }));
        if (data.needsSetup) setNeedsSetup(true);
        setMessage(data.error || 'Could not save.');
        return;
      }
      setNeedsSetup(false);
      setMessage(`${page.label} is now ${next ? 'ON' : 'OFF'}.`);
    } catch {
      setEnabled((current) => ({ ...current, [page.key]: !next }));
      setMessage('Could not save. Check your connection.');
    } finally {
      setSaving('');
    }
  }

  async function copySql() {
    try {
      await navigator.clipboard.writeText(setupSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="page-switches">
      {needsSetup ? (
        <div className="page-switches-setup">
          <p>
            <strong>One-time setup:</strong> paste this into the Supabase SQL Editor and run it. Until then every page stays ON.
          </p>
          <pre>{setupSql}</pre>
          <button type="button" className="button" onClick={copySql}>{copied ? 'Copied' : 'Copy SQL'}</button>
        </div>
      ) : null}
      <ul className="page-switch-list">
        {pages.map((page) => {
          const on = enabled[page.key] !== false;
          return (
            <li key={page.key} className={`page-switch-row ${on ? 'is-on' : 'is-off'}`}>
              <div className="page-switch-text">
                <strong>{page.label}</strong>
                <a href={page.path} target="_blank" rel="noreferrer">{page.path}</a>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`${page.label} page`}
                className="page-switch"
                disabled={saving === page.key}
                onClick={() => toggle(page)}
              >
                <span className="page-switch-knob" />
                <span className="page-switch-label">{on ? 'ON' : 'OFF'}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {message ? <p className="page-switch-message" role="status">{message}</p> : null}
    </div>
  );
}
