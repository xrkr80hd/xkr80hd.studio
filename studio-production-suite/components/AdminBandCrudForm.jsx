'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import MediaUrlInput from './MediaUrlInput';
import AdminAccordionSection from './AdminAccordionSection';

const DEFAULT_GENRE_OPTIONS = [
  'Metal',
  'Metalcore',
  'Djent',
  'Deathcore',
  'Hardcore',
  'Rock',
  'Alternative Rock',
  'Indie',
  'Punk',
  'Pop',
  'Hip-Hop',
  'Phonk',
  'EDM',
  'Dubstep',
  'Electronic',
  'Orchestral',
  'Soundtrack',
  'Cinematic',
  'Ambient',
  'Acoustic',
  'Christian',
  'Worship',
  'Gospel',
  'Singer-Songwriter',
  'Country',
  'Blues',
  'R&B',
  'Jazz',
  'Instrumental',
  'Podcast / Talk',
];

const BAND_ROLE_OPTIONS = [
  'Lead Vocals',
  'Vocals',
  'Lead Guitar',
  'Rhythm Guitar',
  'Guitars',
  'Bass',
  'Drums',
  'Percussion',
  'DJ',
  'Keys',
  'Synth',
  'Other',
];

function normalizeBandRole(value) {
  const safe = String(value || '').trim();
  if (!safe) {
    return '';
  }

  if (/^guitar$/i.test(safe)) {
    return 'Guitars';
  }

  return safe;
}

function normalizeBandRoles(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => normalizeBandRole(item).slice(0, 80)).filter(Boolean)));
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function normalizeMembers(value) {
  if (!Array.isArray(value) || !value.length) {
    return [{ name: '', role: '', roles: [], image_url: '', status: 'current' }];
  }

  return value.map((item) => {
    const roleList = Array.isArray(item?.roles)
      ? item.roles
      : String(item?.role || '')
          .split(/[\/,]/)
          .map((part) => String(part || '').trim())
          .filter(Boolean);

    const roles = normalizeBandRoles(roleList);

    return {
      name: String(item?.name || ''),
      role: roles.join(' / '),
      roles,
      image_url: String(item?.image_url || ''),
      status: item?.status === 'past' || item?.is_past === true ? 'past' : 'current',
    };
  });
}

export default function AdminBandCrudForm({ mode = 'create', initialBand = null, genreOptions = [], initialEra = 'archive' }) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const [name, setName] = useState(String(initialBand?.name || ''));
  const [slug, setSlug] = useState(String(initialBand?.slug || ''));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialBand?.slug));
  const [era, setEra] = useState(initialBand?.era === 'scene' ? 'scene' : initialEra === 'scene' ? 'scene' : 'archive');
  const [yearsActive, setYearsActive] = useState(String(initialBand?.years_active || ''));
  const [genres, setGenres] = useState(() => {
    const fromBand = Array.isArray(initialBand?.genres) ? initialBand.genres : [];
    const fromJson = Array.isArray(initialBand?.genres_json) ? initialBand.genres_json : [];
    const fallback = String(initialBand?.genre || '').trim();
    return Array.from(new Set([...fromBand, ...fromJson, ...(fallback ? [fallback] : [])].map((item) => String(item || '').trim()).filter(Boolean))).slice(0, 12);
  });
  const [customGenre, setCustomGenre] = useState('');
  const [tagline, setTagline] = useState(String(initialBand?.tagline || ''));
  const [summary, setSummary] = useState(String(initialBand?.summary || ''));
  const [story, setStory] = useState(String(initialBand?.story || ''));
  const [imageUrl, setImageUrl] = useState(String(initialBand?.image_url || ''));
  const [bannerImageUrl, setBannerImageUrl] = useState(String(initialBand?.banner_image_url || ''));
  const [bandPhotoUrl, setBandPhotoUrl] = useState(String(initialBand?.band_photo_url || ''));
  const [isSoloArtist, setIsSoloArtist] = useState(Boolean(initialBand?.is_solo_artist));
  const [isPublished, setIsPublished] = useState(initialBand?.is_published === undefined ? true : Boolean(initialBand?.is_published));
  const [sortOrder, setSortOrder] = useState(String(initialBand?.sort_order ?? 0));
  const [members, setMembers] = useState(normalizeMembers(initialBand?.members));
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const genreDataList = useMemo(() => {
    const merged = Array.from(
      new Set([...DEFAULT_GENRE_OPTIONS, ...genreOptions, ...genres].map((value) => String(value || '').trim()).filter(Boolean))
    );
    return merged.sort((a, b) => a.localeCompare(b));
  }, [genreOptions, genres]);
  const workingSlug = slugify(slug || name) || slugify(initialBand?.slug || '') || 'band';
  const stableSlug = isEdit ? slugify(initialBand?.slug || '') || workingSlug : workingSlug;

  const setMemberValue = (index, key, value) => {
    setMembers((current) => current.map((member, idx) => (idx === index ? { ...member, [key]: value } : member)));
  };

  const toggleGenre = (value, enabled) => {
    const safe = String(value || '').trim();
    if (!safe) {
      return;
    }
    setGenres((current) => {
      if (enabled) {
        return Array.from(new Set([...current, safe])).slice(0, 12);
      }
      return current.filter((item) => item !== safe);
    });
  };
  const addGenre = (value) => toggleGenre(value, true);
  const removeGenre = (value) => toggleGenre(value, false);

  const toggleMemberRole = (index, role, enabled) => {
    const safeRole = normalizeBandRole(role);
    if (!safeRole) {
      return;
    }

    setMembers((current) =>
      current.map((member, idx) => {
        if (idx !== index) {
          return member;
        }
        const existing = normalizeBandRoles(Array.isArray(member.roles) ? member.roles : []);
        const nextRoles = enabled
          ? Array.from(new Set([...existing, safeRole]))
          : existing.filter((item) => item !== safeRole);
        return {
          ...member,
          roles: nextRoles,
          role: nextRoles.join(' / '),
        };
      })
    );
  };

  const createMember = (status = 'current') => ({ name: '', role: '', roles: [], image_url: '', status: status === 'past' ? 'past' : 'current' });
  const goToBandManager = () => {
    const next = `/admin/bands?refresh=${Date.now()}`;
    if (typeof window !== 'undefined') {
      window.location.assign(next);
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <form
      className="card section-space admin-band-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setStatus(isEdit ? 'Saving band...' : 'Creating band...');

        const resolvedSlug = slugify(slug || name);
        const resolvedGenres = Array.from(new Set(genres.map((item) => String(item || '').trim()).filter(Boolean))).slice(0, 12);
        const payload = {
          name,
          slug: resolvedSlug,
          era,
          years_active: yearsActive,
          genre: resolvedGenres[0] || '',
          genres: resolvedGenres,
          tagline,
          summary,
          story,
          image_url: imageUrl,
          banner_image_url: bannerImageUrl,
          band_photo_url: bandPhotoUrl,
          is_solo_artist: isSoloArtist,
          is_published: isPublished,
          sort_order: sortOrder,
          members,
        };

        const endpoint = isEdit ? `/api/admin/bands/${encodeURIComponent(initialBand.slug)}` : '/api/admin/bands';
        const method = isEdit ? 'PUT' : 'POST';

        try {
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

          setStatus(isEdit ? 'Band updated.' : 'Band created.');
          setSaving(false);
          goToBandManager();
        } catch {
          setStatus('Save failed due to network error.');
          setSaving(false);
        }
      }}
    >
      <h2 className="section-title">{isEdit ? 'Edit Band' : 'Create Band'}</h2>
      <p className="meta" style={{ marginBottom: '0.6rem' }}>
        {isEdit
          ? 'Update this band\'s info, images, and members. Changes save instantly.'
          : 'Fill in the basics, add images and members, then save. You can edit later.'}
      </p>

      <AdminAccordionSection title="Band Basics" note="Name, slug, page, genre and ordering." defaultOpen>
        <div className="grid cols-3">
          <div className="form-row">
            <label htmlFor="band-name">Band Name</label>
            <input
              id="band-name"
              type="text"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugTouched) {
                  setSlug(slugify(nextName));
                }
              }}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="band-slug">Slug</label>
            <input
              id="band-slug"
              type="text"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="band-era">Page</label>
            <select id="band-era" value={era} onChange={(event) => setEra(event.target.value)}>
              <option value="archive">YourLocal Legends (Archive)</option>
              <option value="scene">YourLocal Scene (Current)</option>
            </select>
          </div>
        </div>

        <div className="grid cols-3">
          <div className="form-row">
            <label htmlFor="band-years-active">Years Active</label>
            <input id="band-years-active" type="text" value={yearsActive} onChange={(event) => setYearsActive(event.target.value)} placeholder="2008 - 2013" />
          </div>
          <div className="form-row">
            <label htmlFor="band-genres-select">Genres (multi-select)</label>
            <select
              id="band-genres-select"
              value=""
              onChange={(event) => {
                const selected = String(event.target.value || '').trim();
                if (selected) {
                  addGenre(selected);
                }
              }}
            >
              <option value="">Select genre to add...</option>
              {genreDataList
                .filter((item) => !genres.includes(item))
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
            <div className="admin-selected-list" role="list" aria-label="Selected genres">
              {genres.length ? (
                genres.map((item) => (
                  <span key={item} className="admin-selected-pill" role="listitem">
                    <span>{item}</span>
                    <button
                      type="button"
                      className="admin-selected-pill-remove"
                      aria-label={`Remove ${item}`}
                      onClick={() => removeGenre(item)}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p className="meta">No genres selected yet.</p>
              )}
            </div>
            <div className="actions">
              <input
                id="band-custom-genre"
                type="text"
                value={customGenre}
                onChange={(event) => setCustomGenre(event.target.value)}
                placeholder="Add custom genre"
              />
              <button
                className="button"
                type="button"
                onClick={() => {
                  const safe = String(customGenre || '').trim();
                  if (!safe) {
                    return;
                  }
                  addGenre(safe);
                  setCustomGenre('');
                }}
              >
                Add Genre
              </button>
            </div>
            <p className="meta">Primary genre: {genres[0] || 'None selected yet.'}</p>
          </div>
          <div className="form-row">
            <label htmlFor="band-sort-order">Sort Order</label>
            <input id="band-sort-order" type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
          </div>
        </div>
      </AdminAccordionSection>

      <AdminAccordionSection title="Band Story" note="Tagline, summary and details." defaultOpen={false}>
        <div className="form-row">
          <label htmlFor="band-tagline">Tagline</label>
          <input id="band-tagline" type="text" value={tagline} onChange={(event) => setTagline(event.target.value)} />
        </div>

        <div className="form-row">
          <label htmlFor="band-summary">Summary</label>
          <textarea id="band-summary" value={summary} onChange={(event) => setSummary(event.target.value)} required />
        </div>

        <div className="form-row">
          <label htmlFor="band-story">Story</label>
          <textarea id="band-story" value={story} onChange={(event) => setStory(event.target.value)} />
        </div>
      </AdminAccordionSection>

      <AdminAccordionSection title="Band Images" note="Card, banner, and profile photo." defaultOpen={false}>
        <p className="meta">Quick sizes: Card 1200x1200 (1:1), Banner 2400x800 (3:1), Profile 1200x1600 (3:4).</p>
        <MediaUrlInput
          id="band-image-url"
          label="Card Image URL"
          value={imageUrl}
          onChange={setImageUrl}
          folder="images/bands"
          replaceMode={isEdit}
          replaceKey={isEdit ? `images/bands/${stableSlug}/card` : ''}
          accept="image/*"
          help="Recommended 1:1 at 1200x1200."
          compact
        />

        <MediaUrlInput
          id="band-banner-image-url"
          label="Banner Image URL"
          value={bannerImageUrl}
          onChange={setBannerImageUrl}
          folder="images/bands"
          replaceMode={isEdit}
          replaceKey={isEdit ? `images/bands/${stableSlug}/banner` : ''}
          accept="image/*"
          help="Recommended 3:1 at 2400x800."
          compact
        />

        <MediaUrlInput
          id="band-photo-url"
          label="Band Photo URL"
          value={bandPhotoUrl}
          onChange={setBandPhotoUrl}
          folder="images/bands"
          replaceMode={isEdit}
          replaceKey={isEdit ? `images/bands/${stableSlug}/profile` : ''}
          accept="image/*"
          help="Recommended 3:4 at 1200x1600."
          compact
        />
      </AdminAccordionSection>

      <AdminAccordionSection title={isSoloArtist ? 'Artist Team' : 'Band Members'} note="Create and manage members." defaultOpen={false}>
        <p className="meta">Use Lineup = Past for former members. Member image is optional.</p>
        <div className="grid">
          {members.map((member, index) => {
            const selectedRoles = normalizeBandRoles(Array.isArray(member.roles) ? member.roles : []);
            return (
            <article key={`member-${index}`} className="card">
              <div className="grid cols-2">
                <div className="form-row">
                  <label htmlFor={`member-name-${index}`}>Name</label>
                  <input
                    id={`member-name-${index}`}
                    type="text"
                    value={member.name}
                    onChange={(event) => setMemberValue(index, 'name', event.target.value)}
                    placeholder="Member name"
                  />
                </div>
                <div className="form-row">
                  <label htmlFor={`member-status-${index}`}>Lineup</label>
                  <select id={`member-status-${index}`} value={member.status || 'current'} onChange={(event) => setMemberValue(index, 'status', event.target.value)}>
                    <option value="current">Current</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                  <label htmlFor={`member-role-select-${index}`}>Roles (multi-select)</label>
                  <select
                    id={`member-role-select-${index}`}
                    value=""
                    onChange={(event) => {
                      const selected = String(event.target.value || '').trim();
                      if (selected) {
                        toggleMemberRole(index, selected, true);
                      }
                    }}
                  >
                    <option value="">Select role to add...</option>
                    {BAND_ROLE_OPTIONS.filter((role) => !selectedRoles.includes(role)).map((role) => (
                      <option key={`${role}-${index}`} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <div className="admin-selected-list" role="list" aria-label={`Selected roles for ${member.name || `member ${index + 1}`}`}>
                    {selectedRoles.length ? (
                      selectedRoles.map((role) => (
                        <span key={`${role}-${index}`} className="admin-selected-pill" role="listitem">
                          <span>{role}</span>
                          <button
                            type="button"
                            className="admin-selected-pill-remove"
                            aria-label={`Remove ${role}`}
                            onClick={() => toggleMemberRole(index, role, false)}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <p className="meta">No roles selected yet.</p>
                    )}
                  </div>
                  <p className="meta">{selectedRoles.length ? selectedRoles.join(' / ') : 'No roles selected yet.'}</p>
                </div>
              <MediaUrlInput
                id={`member-image-${index}`}
                label="Member Image URL (optional)"
                value={member.image_url}
                onChange={(nextValue) => setMemberValue(index, 'image_url', nextValue)}
                folder="images/artists"
                accept="image/*"
                help="Recommended 1:1 at 1000x1000."
                compact
              />
              <div className="actions">
                <button
                  className="button danger"
                  type="button"
                  onClick={() => setMembers((current) => current.filter((_, idx) => idx !== index))}
                >
                  Remove Member
                </button>
              </div>
            </article>
            );
          })}
        </div>
        <div className="actions">
          <button
            className="button"
            type="button"
            onClick={() => setMembers((current) => [...current, createMember('current')])}
          >
            Add Current Member
          </button>
          <button
            className="button"
            type="button"
            onClick={() => setMembers((current) => [...current, createMember('past')])}
          >
            Add Past Member
          </button>
        </div>
      </AdminAccordionSection>

      <AdminAccordionSection title="Publish and Save" note="Visibility and final actions." defaultOpen>
        <div className="actions">
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <input type="checkbox" checked={isSoloArtist} onChange={(event) => setIsSoloArtist(event.target.checked)} />
            <span className="meta">Solo Artist</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
            <span className="meta">Published</span>
          </label>
        </div>

        <div className="actions">
          <button className="button primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Band' : 'Create Band'}
          </button>
          {isEdit ? (
            <button
              className="button danger"
              type="button"
              onClick={async () => {
                const confirmed = window.confirm('Delete this band? This cannot be undone.');
                if (!confirmed) {
                  return;
                }

                const response = await fetch(`/api/admin/bands/${encodeURIComponent(initialBand.slug)}`, { method: 'DELETE' });
                const body = await response.json().catch(() => ({}));
                if (!response.ok) {
                  setStatus(body.error || 'Delete failed.');
                  return;
                }

                goToBandManager();
              }}
            >
              Delete Band
            </button>
          ) : null}
        </div>
        {status ? <p className="meta">{status}</p> : null}
      </AdminAccordionSection>
    </form>
  );
}
