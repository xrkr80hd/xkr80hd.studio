'use client';

import { useMemo, useRef, useState } from 'react';
import { US_STATES } from '../../lib/community-rules.mjs';

const ACCEPT = {
  audio: 'audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg,audio/flac,.mp3,.m4a,.wav,.ogg,.flac',
  video: 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov',
  image: 'image/jpeg,image/png,image/webp',
};

const MIME_BY_EXT = {
  mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
};

function fileMime(file) {
  if (file.type) return file.type;
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  return MIME_BY_EXT[ext] || '';
}

function formatMb(bytes) {
  return `${(Number(bytes || 0) / (1024 * 1024)).toFixed(1)} MB`;
}

// PUT with progress, straight into the member's own storage folder.
function putWithProgress(url, file, mime, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', mime);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('The upload did not finish. Please try again.')));
    xhr.onerror = () => reject(new Error('The upload did not finish. Check your connection and try again.'));
    xhr.send(file);
  });
}

function Uploader({ kind, label, limit, count, onUploaded }) {
  const inputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const full = count >= limit.count;

  async function upload(file) {
    setError('');
    const mime = fileMime(file);
    try {
      setProgress(0);
      const start = await fetch('/api/community/media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, mime, size: file.size }),
      });
      const ticket = await start.json().catch(() => ({}));
      if (!start.ok) throw new Error(ticket.error || 'Uploads are unavailable right now.');
      if (ticket.kind !== kind) throw new Error(`That file isn't a ${kind === 'image' ? 'photo' : kind} file.`);

      await putWithProgress(ticket.uploadUrl, file, mime, setProgress);

      const save = await fetch('/api/community/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: ticket.path, title: title || file.name.replace(/\.[^.]+$/, '') }),
      });
      const saved = await save.json().catch(() => ({}));
      if (!save.ok) throw new Error(saved.error || 'The upload could not be saved.');
      onUploaded(saved.item);
      setTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="yl-form" style={{ gap: '0.6rem' }}>
      {kind !== 'image' ? (
        <label className="yl-field">
          <span>Title (optional)</span>
          <input type="text" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} disabled={full || progress !== null} />
        </label>
      ) : null}
      <div className="yl-actions" style={{ marginTop: 0 }}>
        <button type="button" className="yl-btn yl-btn--primary" disabled={full || progress !== null} onClick={() => inputRef.current?.click()}>
          {full ? `${label} full` : progress !== null ? 'Uploading…' : `Add ${kind === 'image' ? 'a photo' : kind === 'audio' ? 'a song or episode' : 'a video'}`}
        </button>
        <span className="yl-small" style={{ alignSelf: 'center' }}>
          Up to {limit.count}, {Math.round(limit.maxBytes / (1024 * 1024))} MB each
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />
      {progress !== null ? (
        <div className="yl-progress" aria-label={`Upload ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? (
        <p className="yl-alert" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function AccountManager({ initialMember, initialMedia = [], limits, types, welcome = false }) {
  const [member, setMember] = useState(initialMember);
  const [media, setMedia] = useState(initialMedia);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(welcome ? { ok: true, text: "Welcome! Your account is ready. Add a photo and a few details so people know who you are." } : null);

  const byKind = useMemo(
    () => ({
      audio: media.filter((item) => item.kind === 'audio'),
      video: media.filter((item) => item.kind === 'video'),
      image: media.filter((item) => item.kind === 'image'),
    }),
    [media]
  );
  const avatar = byKind.image.find((item) => item.storage_path === member.avatar_path);
  const typeLabel = types.find((item) => item.key === member.member_type)?.label || 'Member';

  async function patch(body, okText) {
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch('/api/community/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Your changes could not be saved.');
      setMember(result.member);
      if (okText) setNotice({ ok: true, text: okText });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`Remove "${item.title || 'this file'}"? This can't be undone.`)) return;
    const response = await fetch(`/api/community/media?id=${item.id}`, { method: 'DELETE' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice({ ok: false, text: result.error || 'That file could not be removed.' });
      return;
    }
    setMedia((current) => current.filter((entry) => entry.id !== item.id));
    setMember((current) => ({
      ...current,
      avatar_path: current.avatar_path === item.storage_path ? null : current.avatar_path,
      cover_path: current.cover_path === item.storage_path ? null : current.cover_path,
    }));
  }

  async function signOut() {
    await fetch('/api/community/auth/signout', { method: 'POST' });
    window.location.href = '/';
  }

  function onSubmit(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    patch(form, 'Profile saved.');
  }

  const added = (item) => setMedia((current) => [...current, item]);

  return (
    <>
      <div className="yl-account-head">
        <div className="yl-ident">
          {avatar?.url ? <img className="yl-avatar" src={avatar.url} alt="" /> : <span className="yl-avatar yl-initials">{member.display_name.slice(0, 1).toUpperCase()}</span>}
          <div>
            <h1 style={{ fontSize: '1.6rem' }}>{member.display_name}</h1>
            <p className="yl-small">
              <span className="yl-badge">{typeLabel}</span> {[member.city, member.state].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
        <button type="button" className="yl-btn yl-btn--ghost" onClick={signOut}>
          Sign out
        </button>
      </div>

      {notice ? (
        <p className={`yl-alert${notice.ok ? ' yl-alert--ok' : ''}`} role="status" style={{ marginBottom: '1.25rem' }}>
          {notice.text}
        </p>
      ) : null}

      <section className="yl-panel">
        <div className="yl-panel-head">
          <h2>Profile</h2>
          <span className="yl-small">Public profile pages are coming next.</span>
        </div>
        <form className="yl-form" onSubmit={onSubmit}>
          <div className="yl-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <label className="yl-field">
              <span>Name</span>
              <input type="text" name="display_name" defaultValue={member.display_name} required minLength={2} maxLength={80} />
            </label>
            <label className="yl-field">
              <span>Account type</span>
              <select name="member_type" defaultValue={member.member_type}>
                {types.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="yl-field">
            <span>Tagline</span>
            <input type="text" name="tagline" defaultValue={member.tagline || ''} maxLength={140} placeholder="One line about you" />
          </label>
          <label className="yl-field">
            <span>About</span>
            <textarea name="bio" defaultValue={member.bio || ''} maxLength={2000} />
          </label>
          <label className="yl-field">
            <span>Website</span>
            <input type="url" name="website_url" defaultValue={member.website_url || ''} maxLength={300} placeholder="https://" />
          </label>
          <div className="yl-row">
            <label className="yl-field">
              <span>City or town</span>
              <input type="text" name="city" defaultValue={member.city || ''} maxLength={80} />
            </label>
            <label className="yl-field">
              <span>State</span>
              <select name="state" defaultValue={member.state || ''}>
                {US_STATES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <label className="yl-field">
              <span>ZIP</span>
              <input type="text" name="zip" defaultValue={member.zip || ''} inputMode="numeric" maxLength={5} />
            </label>
          </div>
          <div>
            <button type="submit" className="yl-btn yl-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </section>

      <section className="yl-panel">
        <div className="yl-panel-head">
          <h2>Your uploads</h2>
          <span className="yl-small">Private to you until public profiles go live.</span>
        </div>
        <div className="yl-usage">
          <div>
            <strong>
              {byKind.audio.length}/{limits.audio.count}
            </strong>
            songs or episodes
          </div>
          <div>
            <strong>
              {byKind.video.length}/{limits.video.count}
            </strong>
            videos
          </div>
          <div>
            <strong>
              {byKind.image.length}/{limits.image.count}
            </strong>
            photos
          </div>
        </div>
      </section>

      <section className="yl-panel">
        <div className="yl-panel-head">
          <h2>Music and audio</h2>
        </div>
        <Uploader kind="audio" label="Songs" limit={limits.audio} count={byKind.audio.length} onUploaded={added} />
        {byKind.audio.length ? (
          <div className="yl-media-list">
            {byKind.audio.map((item) => (
              <div key={item.id} className="yl-media-item">
                <div>
                  <strong>{item.title || 'Untitled'}</strong> <span className="yl-small">{formatMb(item.size_bytes)}</span>
                  {item.url ? <audio controls preload="none" src={item.url} /> : null}
                </div>
                <button type="button" className="yl-btn yl-btn--ghost yl-btn--danger" onClick={() => removeItem(item)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="yl-panel">
        <div className="yl-panel-head">
          <h2>Videos</h2>
        </div>
        <Uploader kind="video" label="Videos" limit={limits.video} count={byKind.video.length} onUploaded={added} />
        {byKind.video.length ? (
          <div className="yl-media-list">
            {byKind.video.map((item) => (
              <div key={item.id} className="yl-media-item">
                <div>
                  <strong>{item.title || 'Untitled'}</strong> <span className="yl-small">{formatMb(item.size_bytes)}</span>
                  {item.url ? <video controls preload="metadata" playsInline src={item.url} /> : null}
                </div>
                <button type="button" className="yl-btn yl-btn--ghost yl-btn--danger" onClick={() => removeItem(item)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="yl-panel">
        <div className="yl-panel-head">
          <h2>Photos</h2>
          <span className="yl-small">Pick one as your profile picture.</span>
        </div>
        <Uploader kind="image" label="Photos" limit={limits.image} count={byKind.image.length} onUploaded={added} />
        {byKind.image.length ? (
          <div className="yl-media-photos">
            {byKind.image.map((item) => (
              <div key={item.id} className="yl-photo">
                {item.url ? <img src={item.url} alt={item.title || ''} /> : null}
                <div className="yl-photo-actions">
                  <button
                    type="button"
                    aria-pressed={member.avatar_path === item.storage_path}
                    disabled={saving}
                    onClick={() => patch({ avatar_path: member.avatar_path === item.storage_path ? null : item.storage_path }, 'Profile picture updated.')}
                  >
                    {member.avatar_path === item.storage_path ? 'Profile pic' : 'Use as profile'}
                  </button>
                  <button type="button" onClick={() => removeItem(item)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
