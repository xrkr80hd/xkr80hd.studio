'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import AdminAccordionSection from './AdminAccordionSection';
import MediaUrlInput from './MediaUrlInput';

function emptyTrack() {
  return {
    id: null,
    title: '',
    description: '',
    audio_url: '',
    cover_image_url: '',
    sort_order: 0,
    is_published: true,
    include_in_radio: true,
  };
}

function normalizeTrack(item) {
  return {
    ...emptyTrack(),
    ...item,
    sort_order: Number.isFinite(Number(item?.sort_order)) ? Number(item.sort_order) : 0,
    is_published: item?.is_published === undefined ? true : Boolean(item.is_published),
    include_in_radio: item?.include_in_radio === undefined ? true : Boolean(item.include_in_radio),
  };
}

export default function AdminBandTracksManager({ bandSlug, bandName = '', initialTracks = [] }) {
  const router = useRouter();
  const [tracks, setTracks] = useState((initialTracks || []).map(normalizeTrack));
  const [form, setForm] = useState(emptyTrack());
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const sortedTracks = useMemo(() => {
    const items = [...tracks];
    items.sort((a, b) => {
      const orderA = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : 0;
      const orderB = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    return items;
  }, [tracks]);

  const resetForm = () => setForm(emptyTrack());

  const reload = async () => {
    const response = await fetch(`/api/admin/bands/${encodeURIComponent(bandSlug)}/tracks`, { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || 'Failed to refresh band tracks.');
    }
    setTracks((body.items || []).map(normalizeTrack));
  };

  return (
    <>
      <form
        className="card section-space"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setStatus(form.id ? 'Saving track...' : 'Adding track...');

          const payload = {
            title: form.title,
            description: form.description,
            audio_url: form.audio_url,
            cover_image_url: form.cover_image_url,
            sort_order: form.sort_order,
            is_published: form.is_published,
            include_in_radio: form.include_in_radio,
          };

          try {
            const endpoint = form.id
              ? `/api/admin/bands/${encodeURIComponent(bandSlug)}/tracks/${encodeURIComponent(form.id)}`
              : `/api/admin/bands/${encodeURIComponent(bandSlug)}/tracks`;
            const method = form.id ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
              method,
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
              setStatus(body.error || 'Save failed.');
              setSaving(false);
              return;
            }

            await reload();
            setStatus(form.id ? 'Track updated.' : 'Track added.');
            setSaving(false);
            resetForm();
            router.refresh();
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Save failed due to network error.');
            setSaving(false);
          }
        }}
      >
        <h2 className="section-title">Band Tracks</h2>
        <p className="meta">
          Upload tracks for <strong>{bandName || bandSlug}</strong>. Published + included tracks feed XRKR Radio.
        </p>
        <p className="meta">Bands are limited to 3 top tracks.</p>

        <AdminAccordionSection title="Track Basics" note="Title, description and ordering." defaultOpen>
          <div className="grid cols-3">
            <div className="form-row">
              <label htmlFor="band-track-title">Track Title</label>
              <input
                id="band-track-title"
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="band-track-sort-order">Sort Order</label>
              <input
                id="band-track-sort-order"
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="band-track-description">Description (optional)</label>
            <textarea
              id="band-track-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
        </AdminAccordionSection>

        <AdminAccordionSection title="Audio Source" note="Upload audio or switch to URL mode; cover image is optional." defaultOpen>
          <MediaUrlInput
            id="band-track-audio-url"
            label="Audio Source"
            value={form.audio_url}
            onChange={(value) => setForm((current) => ({ ...current, audio_url: value }))}
            folder={`audio/tracks/bands/${String(bandSlug || '').trim() || 'band'}`}
            replaceMode={Boolean(form.id)}
            replaceKey={form.id ? `audio/tracks/bands/${String(bandSlug || '').trim() || 'band'}/${String(form.id)}/main` : ''}
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.webm"
            showUrlInput={false}
            placeholder="https://... or /..."
          />

          <MediaUrlInput
            id="band-track-cover-url"
            label="Track Cover (optional)"
            value={form.cover_image_url}
            onChange={(value) => setForm((current) => ({ ...current, cover_image_url: value }))}
            folder={`images/bands/${String(bandSlug || '').trim() || 'band'}/tracks`}
            replaceMode={Boolean(form.id)}
            replaceKey={form.id ? `images/bands/${String(bandSlug || '').trim() || 'band'}/tracks/${String(form.id)}/cover` : ''}
            accept="image/*"
            placeholder="Upload cover image"
          />
        </AdminAccordionSection>

        <AdminAccordionSection title="Publish and Radio" note="Control visibility and radio inclusion." defaultOpen={false}>
          <div className="actions">
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) => setForm((current) => ({ ...current, is_published: event.target.checked }))}
              />
              <span className="meta">Published</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <input
                type="checkbox"
                checked={form.include_in_radio}
                onChange={(event) => setForm((current) => ({ ...current, include_in_radio: event.target.checked }))}
              />
              <span className="meta">Include in XRKR Radio</span>
            </label>
          </div>
          <div className="actions">
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : form.id ? 'Update Track' : 'Add Track'}
            </button>
            {form.id ? (
              <button className="button" type="button" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
          {status ? <p className="meta">{status}</p> : null}
        </AdminAccordionSection>
      </form>

      <section className="card section-space">
        <AdminAccordionSection title={`Band Track Library (${sortedTracks.length})`} note="Tracks owned by this band only." defaultOpen={false}>
          {sortedTracks.length ? (
            <div className="grid">
              {sortedTracks.map((track) => (
                <article key={track.id} className="card">
                  <h4>{track.title}</h4>
                  <p className="meta">
                    sort {track.sort_order} | {track.is_published ? 'published' : 'draft'} | radio {track.include_in_radio ? 'on' : 'off'}
                  </p>
                  {track.description ? <p>{track.description}</p> : null}
                  {track.audio_url ? <audio controls src={track.audio_url} style={{ width: '100%' }} /> : null}
                  <div className="actions">
                    <button className="button primary" type="button" onClick={() => setForm(normalizeTrack(track))}>
                      Edit
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm(`Delete track "${track.title}"?`);
                        if (!confirmed) {
                          return;
                        }

                        const response = await fetch(
                          `/api/admin/bands/${encodeURIComponent(bandSlug)}/tracks/${encodeURIComponent(track.id)}`,
                          { method: 'DELETE' }
                        );
                        const body = await response.json().catch(() => ({}));
                        if (!response.ok) {
                          setStatus(body.error || 'Delete failed.');
                          return;
                        }

                        await reload();
                        setStatus(`Deleted "${track.title}".`);
                        if (form.id === track.id) {
                          resetForm();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="meta">No tracks for this band yet.</p>
          )}
        </AdminAccordionSection>
      </section>
    </>
  );
}
