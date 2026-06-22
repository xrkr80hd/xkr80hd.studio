'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const SEEN_POST_STORAGE_KEY = 'xrkr80hd_seen_blog_post';
const NEW_POST_WINDOW_MS = 24 * 60 * 60 * 1000;

function toPostVersion(post) {
  const slug = String(post?.slug || '').trim();
  if (!slug) {
    return '';
  }

  const timestamp = String(post?.published_at || post?.created_at || '').trim();
  return `${slug}:${timestamp || 'published'}`;
}

function formatPublishedDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getPostTimestamp(post) {
  const raw = String(post?.published_at || post?.created_at || '').trim();
  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
}

export default function HomeBlogNotice({ latestPost = null, message = '' }) {
  const [visible, setVisible] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const postVersion = useMemo(() => toPostVersion(latestPost), [latestPost]);
  const postTimestamp = useMemo(() => getPostTimestamp(latestPost), [latestPost]);
  const isWithinNewWindow = useMemo(() => {
    if (!postTimestamp) {
      return false;
    }
    return Date.now() - postTimestamp <= NEW_POST_WINDOW_MS;
  }, [postTimestamp]);

  useEffect(() => {
    setHydrated(true);

    if (!postVersion) {
      setVisible(false);
      return;
    }

    if (!isWithinNewWindow) {
      setVisible(true);
      return;
    }

    try {
      const seen = window.localStorage.getItem(SEEN_POST_STORAGE_KEY);
      setVisible(seen !== postVersion);
    } catch {
      setVisible(true);
    }
  }, [isWithinNewWindow, postVersion]);

  const dismiss = () => {
    if (!postVersion) {
      setVisible(false);
      return;
    }

    if (isWithinNewWindow) {
      try {
        window.localStorage.setItem(SEEN_POST_STORAGE_KEY, postVersion);
      } catch {
        // Ignore storage write failures and just hide this session.
      }
    }

    setVisible(false);
  };

  if (!hydrated || !visible || !latestPost?.slug) {
    return null;
  }

  const safeMessage = isWithinNewWindow
    ? String(message || '').trim() || 'New blog post available.'
    : 'Latest blog post available.';
  const published = formatPublishedDate(latestPost?.published_at || latestPost?.created_at);

  return (
    <aside className="home-blog-notice card" role="status" aria-live="polite">
      <p className="home-blog-notice-kicker">{safeMessage}</p>
      <h3 className="section-title">{latestPost.title || 'Latest post'}</h3>
      {published ? <p className="meta">Published {published}</p> : null}
      <div className="actions">
        <Link className="button primary" href={`/your-local-blog/${latestPost.slug}`} onClick={dismiss}>
          Read New Post
        </Link>
        <button className="button" type="button" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    </aside>
  );
}
