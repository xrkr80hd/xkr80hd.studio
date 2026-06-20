'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import MediaUrlInput from './MediaUrlInput';

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function toDateTimeLocal(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatContent(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function isVideoMediaUrl(value) {
  const raw = String(value || '').trim().split('?')[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv)$/i.test(raw);
}

export default function AdminBlogCrudForm({ mode = 'create', initialPost = null }) {
  const router = useRouter();
  const contentRef = useRef(null);
  const isEdit = mode === 'edit';
  const goToBlogManager = () => {
    const next = `/admin/blog?refresh=${Date.now()}`;
    if (typeof window !== 'undefined') {
      window.location.assign(next);
      return;
    }
    router.replace(next);
    router.refresh();
  };

  const [title, setTitle] = useState(String(initialPost?.title || ''));
  const [slug, setSlug] = useState(String(initialPost?.slug || ''));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost?.slug));
  const [excerpt, setExcerpt] = useState(String(initialPost?.excerpt || ''));
  const [content, setContent] = useState(String(initialPost?.content || ''));
  const [coverImageUrl, setCoverImageUrl] = useState(String(initialPost?.cover_image_url || ''));
  const [publishedAt, setPublishedAt] = useState(toDateTimeLocal(initialPost?.published_at));
  const [isPublished, setIsPublished] = useState(isEdit ? Boolean(initialPost?.is_published) : true);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  // Ambient video library — loaded from localStorage, cycles with crossfade
  const [ambientLibrary, setAmbientLibrary] = useState([]);
  const [ambientIdx, setAmbientIdx] = useState(0);
  const [ambientFading, setAmbientFading] = useState(false);
  const ambientIdxRef = useRef(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ambient_video_library') || '[]');
      if (Array.isArray(saved) && saved.length > 0) {
        setAmbientLibrary(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (ambientLibrary.length < 2) return;
    const timer = setInterval(() => {
      setAmbientFading(true);
      setTimeout(() => {
        ambientIdxRef.current = (ambientIdxRef.current + 1) % ambientLibrary.length;
        setAmbientIdx(ambientIdxRef.current);
        setAmbientFading(false);
      }, 1400);
    }, 14000);
    return () => clearInterval(timer);
  }, [ambientLibrary]);

  const insertAtSelection = (before, after = '') => {
    const element = contentRef.current;
    if (!element) {
      setContent((current) => `${current}${current ? '\n\n' : ''}${before}${after}`);
      return;
    }

    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const currentValue = content;
    const selected = currentValue.slice(start, end);
    const nextValue = `${currentValue.slice(0, start)}${before}${selected}${after}${currentValue.slice(end)}`;
    setContent(nextValue);

    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + before.length + selected.length + after.length;
      element.setSelectionRange(cursor, cursor);
    });
  };

  const previewParagraphs = formatContent(content);
  const coverMediaIsVideo = isVideoMediaUrl(coverImageUrl);
  const hasAmbient = ambientLibrary.length > 0;
  const currentAmbientSrc = ambientLibrary[ambientIdx] || '';

  return (
    <form
      className="card section-space blog-composer"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setStatus(isEdit ? 'Saving post...' : 'Creating post...');

        const payload = {
          title,
          slug: slugify(slug || title),
          excerpt,
          content,
          cover_image_url: coverImageUrl,
          published_at: publishedAt,
          is_published: isPublished,
        };

        const endpoint = isEdit ? `/api/admin/blog/${encodeURIComponent(initialPost.slug)}` : '/api/admin/blog';
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

          setStatus(isEdit ? 'Post updated.' : 'Post created.');
          setSaving(false);
          goToBlogManager();
        } catch {
          setStatus('Save failed due to network error.');
          setSaving(false);
        }
      }}
    >
      <div className="blog-composer-head">
        <div>
          <h2 className="section-title">{isEdit ? 'Edit Blog Post' : 'Create Blog Post'}</h2>
          <p className="meta">Long-form writing mode with browser spell check, autocorrect, and live preview.</p>
        </div>
      </div>

      <div className="blog-composer-layout">
        <section className="blog-composer-main">
          <div className="form-row blog-title-row">
            <label htmlFor="blog-title">Title</label>
            <input
              id="blog-title"
              className="blog-title-input"
              type="text"
              value={title}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              placeholder="Write your headline..."
              onChange={(event) => {
                const next = event.target.value;
                setTitle(next);
                if (!slugTouched) {
                  setSlug(slugify(next));
                }
              }}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="blog-excerpt">Excerpt / deck</label>
            <textarea
              id="blog-excerpt"
              className="blog-excerpt-input"
              value={excerpt}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              placeholder="Short summary shown in listings and previews..."
              onChange={(event) => setExcerpt(event.target.value)}
            />
          </div>

          <div className="blog-composer-toolbar" role="toolbar" aria-label="Writing shortcuts">
            <button className="button" type="button" onClick={() => insertAtSelection('## Section Title\n\n', '')}>
              Section
            </button>
            <button className="button" type="button" onClick={() => insertAtSelection('> Quote\n\n', '')}>
              Quote
            </button>
            <button className="button" type="button" onClick={() => insertAtSelection('- List item\n- List item\n\n', '')}>
              List
            </button>
            <button className="button" type="button" onClick={() => insertAtSelection('---\n\n', '')}>
              Divider
            </button>
          </div>

          <div className="form-row">
            <label htmlFor="blog-content">Content</label>
            <div className={`blog-editor-shell ${hasAmbient ? 'has-ambient-media' : ''}`.trim()}>
              {hasAmbient ? (
                <div className="blog-editor-ambient" aria-hidden="true">
                  <video
                    key={currentAmbientSrc}
                    className={`blog-editor-ambient-video${ambientFading ? ' fading' : ''}`}
                    src={currentAmbientSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                </div>
              ) : null}
              {hasAmbient ? <div className="blog-editor-scrim" aria-hidden="true" /> : null}
              <textarea
                id="blog-content"
                ref={contentRef}
                className={`blog-content-editor ${hasAmbient ? 'is-ambient' : ''}`.trim()}
                value={content}
                spellCheck
                autoCorrect="on"
                autoCapitalize="sentences"
                placeholder="Start writing here. Use blank lines between paragraphs for clean post spacing."
                onChange={(event) => setContent(event.target.value)}
                required
              />
            </div>
            <p className="meta">Browser spell check is enabled here. Separate paragraphs with blank lines.</p>
          </div>
        </section>

        <aside className="blog-composer-side">
          <div className="card blog-composer-panel">
            <h3 className="section-title">Post Settings</h3>

            <div className="form-row">
              <label htmlFor="blog-slug">Slug</label>
              <input
                id="blog-slug"
                type="text"
                value={slug}
                spellCheck={false}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
                required
              />
            </div>

            <MediaUrlInput
              id="blog-cover-image"
              label="Cover Media URL"
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              folder="images/posts"
              accept="image/*,video/*"
              placeholder="https://... or /..."
              help="Upload an image or video for the public post."
            />

            {hasAmbient ? (
              <p className="meta" style={{ marginTop: '0.5rem', opacity: 0.6 }}>
                Ambient library active · {ambientLibrary.length} video{ambientLibrary.length !== 1 ? 's' : ''} cycling behind the editor.
              </p>
            ) : (
              <p className="meta" style={{ marginTop: '0.5rem', opacity: 0.45 }}>
                No ambient videos. Add them in the Admin Dashboard → Ambient Video Library.
              </p>
            )}

            <div className="form-row">
              <label htmlFor="blog-published-at">Published At</label>
              <input
                id="blog-published-at"
                type="datetime-local"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
              />
            </div>

            <div className="actions">
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
                <span className="meta">Published</span>
              </label>
            </div>
          </div>

          <div className="card blog-composer-panel blog-preview-panel">
            <h3 className="section-title">Live Preview</h3>
            <article className="blog-post-card blog-preview-card">
              <h1 className="section-title">{title || 'Your post title'}</h1>
              <p className="meta">{publishedAt ? new Date(publishedAt).toLocaleString() : 'Draft preview'}</p>
              {excerpt ? <p className="blog-preview-excerpt">{excerpt}</p> : null}
              {coverImageUrl ? (
                coverMediaIsVideo ? (
                  <video className="blog-cover-image blog-cover-video" src={coverImageUrl} autoPlay muted loop playsInline controls preload="metadata" />
                ) : (
                  <img className="blog-cover-image" src={coverImageUrl} alt={title || 'Cover preview'} />
                )
              ) : null}
              {previewParagraphs.length ? previewParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className="meta">Your paragraphs will preview here as you write.</p>}
            </article>
          </div>
        </aside>
      </div>

      <div className="actions">
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}
        </button>
        {isEdit ? (
          <button
            className="button danger"
            type="button"
            onClick={async () => {
              const confirmed = window.confirm('Delete this post?');
              if (!confirmed) {
                return;
              }

              const response = await fetch(`/api/admin/blog/${encodeURIComponent(initialPost.slug)}`, { method: 'DELETE' });
              const body = await response.json().catch(() => ({}));
              if (!response.ok) {
                setStatus(body.error || 'Delete failed.');
                return;
              }

              goToBlogManager();
            }}
          >
            Delete Post
          </button>
        ) : null}
      </div>

      {status ? <p className="meta">{status}</p> : null}
    </form>
  );
}
