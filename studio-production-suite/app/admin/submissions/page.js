'use client';

import { useEffect, useState } from 'react';
import AdminBreadcrumbs from '../../../components/AdminBreadcrumbs';

const TYPES = [
  { key: '', label: 'All' },
  { key: 'band', label: 'Band' },
  { key: 'artist', label: 'Artist' },
  { key: 'podcast', label: 'Podcast' },
  { key: 'local_business', label: 'Business' },
  { key: 'legend', label: 'Legend' },
  { key: 'local_scene', label: 'Scene' },
  { key: 'blog', label: 'Blog' },
  { key: 'other', label: 'Other' },
];

function SubmissionCard({ submission, onDismiss }) {
  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = async () => {
    if (!window.confirm(`Dismiss submission from ${submission.name}?`)) return;
    setDismissing(true);
    try {
      await fetch('/api/admin/submissions', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: submission.id }),
      });
      onDismiss(submission.id);
    } catch {
      setDismissing(false);
    }
  };

  const date = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleString()
    : 'Unknown date';

  return (
    <div className="card submission-card">
      <div className="submission-card-head">
        <div>
          <span className="submission-type-badge">{submission.submit_type.replace(/_/g, ' ')}</span>
          <h3 className="submission-name">{submission.name}</h3>
          {submission.city ? <p className="meta">{submission.city}</p> : null}
        </div>
        <button className="button danger" type="button" onClick={handleDismiss} disabled={dismissing}>
          {dismissing ? 'Dismissing...' : 'Dismiss'}
        </button>
      </div>

      <div className="submission-card-body">
        {submission.contact_name || submission.contact_email ? (
          <p className="meta">
            Contact: <strong>{submission.contact_name || '—'}</strong>
            {submission.contact_email ? (
              <> · <a href={`mailto:${submission.contact_email}`}>{submission.contact_email}</a></>
            ) : null}
          </p>
        ) : null}

        {submission.summary ? <p className="submission-summary">{submission.summary}</p> : null}

        {submission.details ? (
          <details className="submission-details-toggle">
            <summary className="meta">Full details</summary>
            <p className="submission-details-body">{submission.details}</p>
          </details>
        ) : null}

        {submission.links.length > 0 ? (
          <div className="submission-links">
            <p className="meta" style={{ marginBottom: '0.3rem' }}>Links:</p>
            <ul>
              {submission.links.map((link) => (
                <li key={link}>
                  <a href={link} target="_blank" rel="noreferrer noopener">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {submission.files.length > 0 ? (
          <div className="submission-files">
            <p className="meta" style={{ marginBottom: '0.4rem' }}>Files ({submission.files.length}):</p>
            <div className="submission-files-grid">
              {submission.files.map((url) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.split('?')[0]);
                const isVideo = /\.(mp4|webm|mov|m4v|ogv)$/i.test(url.split('?')[0]);
                const isAudio = /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(url.split('?')[0]);
                const filename = decodeURIComponent(url.split('/').pop().split('?')[0]);
                return (
                  <a key={url} className="submission-file-item" href={url} target="_blank" rel="noreferrer noopener">
                    {isImage ? (
                      <img src={url} alt={filename} className="submission-file-thumb" />
                    ) : isVideo ? (
                      <video src={url} muted preload="metadata" className="submission-file-thumb" />
                    ) : isAudio ? (
                      <span className="submission-file-icon">🎵</span>
                    ) : (
                      <span className="submission-file-icon">📄</span>
                    )}
                    <span className="meta submission-file-name">{filename}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <p className="meta submission-date">Received: {date}</p>
    </div>
  );
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const url = activeType ? `/api/admin/submissions?type=${activeType}` : '/api/admin/submissions';
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((body) => {
        if (body.error) {
          setError(body.error);
        } else {
          setSubmissions(body.submissions || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load submissions.');
        setLoading(false);
      });
  }, [activeType]);

  const dismiss = (id) => setSubmissions((current) => current.filter((s) => s.id !== id));

  const counts = TYPES.slice(1).reduce((acc, t) => {
    acc[t.key] = submissions.filter((s) => s.submit_type === t.key).length;
    return acc;
  }, {});

  return (
    <>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Submissions' }]} />

      <section className="card hero">
        <h1>Submissions Inbox</h1>
        <p>All public submissions sorted by type. Dismiss to remove from inbox.</p>
      </section>

      <section className="card section-space">
        <div className="submissions-filter-bar">
          {TYPES.map((t) => (
            <button
              key={t.key}
              className={`button${activeType === t.key ? ' primary' : ''}`}
              type="button"
              onClick={() => setActiveType(t.key)}
            >
              {t.label}
              {t.key && counts[t.key] ? ` (${counts[t.key]})` : ''}
            </button>
          ))}
        </div>

        {error ? <p className="alert">{error}</p> : null}

        {loading ? (
          <p className="meta" style={{ marginTop: '1rem' }}>Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="meta" style={{ marginTop: '1rem', opacity: 0.55 }}>
            {activeType ? `No ${activeType.replace(/_/g, ' ')} submissions.` : 'Inbox is empty.'}
          </p>
        ) : (
          <div className="submissions-list">
            {submissions.map((s) => (
              <SubmissionCard key={s.id} submission={s} onDismiss={dismiss} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
