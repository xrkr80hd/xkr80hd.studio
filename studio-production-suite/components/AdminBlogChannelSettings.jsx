'use client';

import { useEffect, useState } from 'react';
import MediaUrlInput from './MediaUrlInput';

export default function AdminBlogChannelSettings() {
  const [channelName, setChannelName] = useState('');
  const [cardImageUrl, setCardImageUrl] = useState('');
  const [channelSlug, setChannelSlug] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      const response = await fetch('/api/admin/blog/channel', { method: 'GET', cache: 'no-store' });
      const body = await response.json().catch(() => ({}));

      if (cancelled) {
        return;
      }

      if (!response.ok) {
        setStatus(body.error || 'Failed to load channel settings.');
        setLoading(false);
        return;
      }

      setChannelName(String(body?.item?.channel_name || ''));
      setCardImageUrl(String(body?.item?.card_image_url || ''));
      setChannelSlug(String(body?.item?.channel_slug || ''));
      setStatus('');
      setLoading(false);
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="card section-space">
        <h2 className="section-title">Your Blog Channel Card</h2>
        <p className="meta">Loading channel settings...</p>
      </section>
    );
  }

  return (
    <form
      className="card section-space"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setStatus('Saving channel settings...');

        const response = await fetch('/api/admin/blog/channel', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            channel_name: channelName,
            card_image_url: cardImageUrl,
          }),
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          setStatus(body.error || 'Failed to save channel settings.');
          setSaving(false);
          return;
        }

        setChannelName(String(body?.item?.channel_name || channelName));
        setCardImageUrl(String(body?.item?.card_image_url || cardImageUrl));
        setChannelSlug(String(body?.item?.channel_slug || channelSlug));
        setStatus('Channel settings saved.');
        setSaving(false);
      }}
    >
      <h2 className="section-title">Your Blog Channel Card</h2>
      <p className="meta" style={{ marginBottom: '0.7rem' }}>
        Rename your channel and set your card graphic for public blog channel listings.
      </p>

      <div className="form-row">
        <label htmlFor="channel-name">Channel Name</label>
        <input
          id="channel-name"
          type="text"
          value={channelName}
          onChange={(event) => setChannelName(event.target.value)}
          placeholder="xrkr80hdblog"
          required
        />
      </div>

      <MediaUrlInput
        id="channel-card-image"
        label="Channel Card Graphic"
        value={cardImageUrl}
        onChange={setCardImageUrl}
        folder="images/posts"
        accept="image/*"
        placeholder="https://... or /..."
        help="This image is shown on your public blog channel card."
      />

      <p className="meta">
        Public channel path: /your-local-blog/channel/{channelSlug || 'your-channel'}
      </p>

      <div className="actions">
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Channel Settings'}
        </button>
      </div>

      {status ? <p className="meta">{status}</p> : null}
    </form>
  );
}
