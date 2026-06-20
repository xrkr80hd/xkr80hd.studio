'use client';

import { useMemo, useState } from 'react';
import AdminAccordionSection from './AdminAccordionSection';
import MediaUrlInput from './MediaUrlInput';

const COMMON_TRACK_GENRES = [
  'metalcore',
  'djent',
  'mathcore',
  'progressive',
  'cinematic',
  'soundtrack',
  'metal',
  'rock',
  'ambient',
  'electronic',
  'instrumental',
  'other',
];

function emptyTrack() {
  return {
    id: null,
    title: '',
    artist_name: 'xrkr80hd',
    genre: '',
    description: '',
    audio_url: '',
    cover_image_url: '',
    external_url: '',
    release_date: '',
    sort_order: 0,
    is_featured: true,
  };
}

function normalizeTrack(track) {
  const base = emptyTrack();
  const releaseDateRaw = String(track?.release_date || '').trim();
  const releaseDate = releaseDateRaw ? releaseDateRaw.slice(0, 10) : '';

  return {
    ...base,
    ...track,
    release_date: releaseDate,
    sort_order: Number.isFinite(Number(track?.sort_order)) ? Number(track.sort_order) : 0,
    is_featured: Boolean(track?.is_featured),
  };
}

function formatReleaseDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return 'No date';
  }
  return raw.slice(0, 10);
}

function buildTrackPayload(form) {
  return {
    title: form.title,
    artist_name: form.artist_name,
    genre: form.genre,
    description: form.description,
    audio_url: form.audio_url,
    cover_image_url: form.cover_image_url,
    external_url: form.external_url,
    release_date: form.release_date,
    sort_order: form.sort_order,
    is_featured: form.is_featured,
  };
}

function TrackEditorSections({ form, setForm, idPrefix, isEdit, genreListId }) {
  const fieldId = (name) => `${idPrefix}-${name}`;
  const replaceAudioKey = isEdit && form.id ? `audio/tracks/${String(form.id)}/main` : '';
  const replaceCoverKey = isEdit && form.id ? `images/posts/tracks/${String(form.id)}/cover` : '';

  return (
    <>
      <AdminAccordionSection title="Track Basics" note="Name, artist, genre and description." defaultOpen>
        <div className="grid cols-3">
          <div className="form-row">
            <label htmlFor={fieldId('title')}>Title</label>
            <input
              id={fieldId('title')}
              type="text"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor={fieldId('artist')}>Artist Name</label>
            <input
              id={fieldId('artist')}
              type="text"
              value={form.artist_name}
              onChange={(event) => setForm((current) => ({ ...current, artist_name: event.target.value }))}
            />
          </div>
          <div className="form-row">
            <label htmlFor={fieldId('genre')}>Genre</label>
            <input
              id={fieldId('genre')}
              type="text"
              list={genreListId}
              value={form.genre}
              onChange={(event) => setForm((current) => ({ ...current, genre: event.target.value }))}
              placeholder="Start typing (ex: metalcore, djent, soundtrack)..."
            />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor={fieldId('description')}>Description</label>
          <textarea
            id={fieldId('description')}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </div>
      </AdminAccordionSection>

      <AdminAccordionSection title="Track Media" note="Upload files or switch to URL mode for hosted tracks." defaultOpen>
        <MediaUrlInput
          id={fieldId('audio-url')}
          label="Audio Source"
          value={form.audio_url}
          onChange={(value) => setForm((current) => ({ ...current, audio_url: value }))}
          folder="audio/tracks"
          replaceMode={isEdit}
          replaceKey={replaceAudioKey}
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.webm"
          showUrlInput={false}
          placeholder="https://... or /..."
          help="Upload directly here, or click 'Use URL Instead' to paste a hosted audio URL."
        />

        <MediaUrlInput
          id={fieldId('cover-image-url')}
          label="Cover Image URL"
          value={form.cover_image_url}
          onChange={(value) => setForm((current) => ({ ...current, cover_image_url: value }))}
          folder="images/posts"
          replaceMode={isEdit}
          replaceKey={replaceCoverKey}
          accept="image/*"
          placeholder="https://... or /..."
          help="Recommended 1:1 (1400x1400) for Hub art. Keep key subject centered for list crops."
        />
      </AdminAccordionSection>

      <AdminAccordionSection title="Release and Visibility" note="Sort, date and Hub player toggle." defaultOpen={false}>
        <div className="grid cols-3">
          <div className="form-row">
            <label htmlFor={fieldId('external-url')}>External Link (optional)</label>
            <input
              id={fieldId('external-url')}
              type="text"
              value={form.external_url}
              onChange={(event) => setForm((current) => ({ ...current, external_url: event.target.value }))}
              placeholder="https://spotify.com/... or https://bandcamp.com/..."
            />
          </div>
          <div className="form-row">
            <label htmlFor={fieldId('release-date')}>Release Date</label>
            <input
              id={fieldId('release-date')}
              type="date"
              value={form.release_date}
              onChange={(event) => setForm((current) => ({ ...current, release_date: event.target.value }))}
            />
          </div>
          <div className="form-row">
            <label htmlFor={fieldId('sort-order')}>Sort Order</label>
            <input
              id={fieldId('sort-order')}
              type="number"
              min="0"
              value={form.sort_order}
              onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
            />
          </div>
        </div>

        <div className="actions">
          <label htmlFor={fieldId('featured')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <input
              id={fieldId('featured')}
              type="checkbox"
              checked={form.is_featured}
              onChange={(event) => setForm((current) => ({ ...current, is_featured: event.target.checked }))}
            />
            <span className="meta">Show in XRKR Hub player</span>
          </label>
        </div>
      </AdminAccordionSection>
    </>
  );
}

export default function AdminTracksManager({ initialTracks = [] }) {
  const genreListId = 'admin-track-genre-options';
  const [tracks, setTracks] = useState(initialTracks.map((track) => normalizeTrack(track)));
  const [createForm, setCreateForm] = useState(emptyTrack());
  const [createStatus, setCreateStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [editForm, setEditForm] = useState(emptyTrack());
  const [editStatus, setEditStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const sortedTracks = useMemo(() => {
    const items = [...tracks];
    items.sort((a, b) => {
      const titleCompare = String(a.title || '').localeCompare(String(b.title || ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      if (titleCompare !== 0) {
        return titleCompare;
      }

      return String(a.artist_name || '').localeCompare(String(b.artist_name || ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
    return items;
  }, [tracks]);

  const genreOptions = useMemo(() => {
    const fromTracks = tracks
      .map((track) => String(track.genre || '').trim())
      .filter(Boolean);
    return Array.from(new Set([...COMMON_TRACK_GENRES, ...fromTracks])).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [tracks]);

  const resetCreateForm = () => setCreateForm(emptyTrack());

  const upsertTrack = (item) => {
    const normalized = normalizeTrack(item);
    setTracks((current) => {
      const existingIndex = current.findIndex((track) => Number(track.id) === Number(normalized.id));
      if (existingIndex < 0) {
        return [normalized, ...current];
      }

      const next = [...current];
      next[existingIndex] = normalized;
      return next;
    });
  };

  const reloadTracks = async () => {
    const response = await fetch('/api/admin/tracks', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to refresh tracks.');
    }
    setTracks((payload.items || []).map((track) => normalizeTrack(track)));
  };

  const startEdit = (track) => {
    const normalized = normalizeTrack(track);
    setEditingTrackId(normalized.id);
    setEditForm(normalized);
    setEditStatus(`Editing track: ${normalized.title}`);
  };

  const cancelEdit = () => {
    setEditingTrackId(null);
    setEditForm(emptyTrack());
    setEditStatus('');
  };

  return (
    <>
      <datalist id={genreListId}>
        {genreOptions.map((genre) => (
          <option key={genre} value={genre} />
        ))}
      </datalist>

      <form
        className="card section-space"
        onSubmit={async (event) => {
          event.preventDefault();
          setCreating(true);
          setCreateStatus('Creating track...');

          try {
            const response = await fetch('/api/admin/tracks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(buildTrackPayload(createForm)),
            });
            const body = await response.json().catch(() => ({}));

            if (!response.ok) {
              setCreateStatus(body.error || 'Save failed.');
              setCreating(false);
              return;
            }

            if (body?.item) {
              upsertTrack(body.item);
            } else {
              await reloadTracks();
            }

            setCreateStatus('Track created.');
            setCreating(false);
            resetCreateForm();
          } catch (error) {
            setCreateStatus(error instanceof Error ? error.message : 'Save failed due to network error.');
            setCreating(false);
          }
        }}
      >
        <h2 className="section-title">Add Track</h2>
        <p className="meta" style={{ marginBottom: '0.6rem' }}>
          Owner-only. Add XRKR tracks with audio, set order, and choose if they appear in the Hub player.
        </p>

        <TrackEditorSections form={createForm} setForm={setCreateForm} idPrefix="create-track" isEdit={false} genreListId={genreListId} />

        <div className="actions" style={{ marginTop: '0.95rem' }}>
          <button className="button primary" type="submit" disabled={creating}>
            {creating ? 'Saving...' : 'Create Track'}
          </button>
        </div>
        {createStatus ? <p className="meta">{createStatus}</p> : null}
      </form>

      <section className="card section-space">
        <AdminAccordionSection
          title={`Track Library (${sortedTracks.length})`}
          note="Alphabetized by track title. New uploads auto-slot in order."
          defaultOpen={false}
        >
          {sortedTracks.length ? (
            <div className="admin-track-library-stack">
              {sortedTracks.map((track) => (
                <article key={track.id} className="card admin-track-library-item">
                  <div className="admin-track-library-main">
                    {track.cover_image_url ? (
                      <img className="admin-track-thumb" src={track.cover_image_url} alt={`${track.title} cover art`} />
                    ) : (
                      <div className="admin-track-thumb-fallback">No cover</div>
                    )}

                    <div className="admin-track-library-copy">
                      <h4 className="admin-track-title">{track.title}</h4>
                      <p className="meta">
                        {track.artist_name || 'xrkr80hd'} | {track.genre || 'other'} | {formatReleaseDate(track.release_date)} | sort {track.sort_order}
                      </p>
                      <p className="meta">Hub player: {track.is_featured ? 'on' : 'off'}</p>
                    </div>
                  </div>

                  {track.audio_url ? <audio controls src={track.audio_url} className="admin-track-audio" /> : null}
                  <div className="actions">
                    <button
                      className="button primary"
                      type="button"
                      onClick={() => {
                        if (Number(editingTrackId) === Number(track.id)) {
                          cancelEdit();
                          return;
                        }
                        startEdit(track);
                      }}
                    >
                      {Number(editingTrackId) === Number(track.id) ? 'Close Editor' : 'Edit Here'}
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm(`Delete track "${track.title}"?`);
                        if (!confirmed) {
                          return;
                        }

                        setEditStatus(`Deleting "${track.title}"...`);
                        const response = await fetch(`/api/admin/tracks/${encodeURIComponent(track.id)}`, { method: 'DELETE' });
                        const body = await response.json().catch(() => ({}));
                        if (!response.ok) {
                          setEditStatus(body.error || 'Delete failed.');
                          return;
                        }

                        setTracks((current) => current.filter((item) => Number(item.id) !== Number(track.id)));
                        const warnings = Array.isArray(body?.storage_cleanup?.warnings) ? body.storage_cleanup.warnings : [];
                        setEditStatus(warnings.length ? `Deleted "${track.title}" with warning: ${warnings[0]}` : `Deleted "${track.title}".`);
                        if (Number(editingTrackId) === Number(track.id)) {
                          cancelEdit();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  {Number(editingTrackId) === Number(track.id) ? (
                    <form
                      className="admin-track-inline-editor section-space"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        setUpdating(true);
                        setEditStatus(`Updating "${editForm.title}"...`);

                        try {
                          const response = await fetch(`/api/admin/tracks/${encodeURIComponent(editForm.id)}`, {
                            method: 'PUT',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify(buildTrackPayload(editForm)),
                          });
                          const body = await response.json().catch(() => ({}));

                          if (!response.ok) {
                            setEditStatus(body.error || 'Update failed.');
                            setUpdating(false);
                            return;
                          }

                          if (body?.item) {
                            upsertTrack(body.item);
                            setEditForm(normalizeTrack(body.item));
                          } else {
                            await reloadTracks();
                          }

                          setEditStatus(`Updated "${editForm.title}".`);
                          setUpdating(false);
                        } catch (error) {
                          setEditStatus(error instanceof Error ? error.message : 'Update failed due to network error.');
                          setUpdating(false);
                        }
                      }}
                    >
                      <AdminAccordionSection
                        title={`Inline Editor: ${track.title}`}
                        note="Edit directly here without jumping to the top create form."
                        defaultOpen
                      >
                        <p className="meta">Cover art uploads update this card immediately after save.</p>
                      </AdminAccordionSection>

                      <TrackEditorSections
                        form={editForm}
                        setForm={setEditForm}
                        idPrefix={`edit-track-${String(track.id)}`}
                        isEdit
                        genreListId={genreListId}
                      />

                      <AdminAccordionSection title="Save Changes" note="Update this track only." defaultOpen>
                        <div className="actions">
                          <button className="button primary" type="submit" disabled={updating}>
                            {updating ? 'Saving...' : 'Update Track'}
                          </button>
                          <button className="button" type="button" onClick={cancelEdit} disabled={updating}>
                            Cancel
                          </button>
                        </div>
                        {editStatus ? <p className="meta">{editStatus}</p> : null}
                      </AdminAccordionSection>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="meta">No tracks yet.</p>
          )}
        </AdminAccordionSection>
      </section>
    </>
  );
}
