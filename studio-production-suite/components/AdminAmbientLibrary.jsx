'use client';

import { useEffect, useState } from 'react';
import MediaUrlInput from './MediaUrlInput';

const STORAGE_KEY = 'ambient_video_library';

export default function AdminAmbientLibrary() {
  const [library, setLibrary] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setLibrary(saved);
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const persist = (next) => {
    setLibrary(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const add = () => {
    const trimmed = newUrl.trim();
    if (!trimmed || library.includes(trimmed)) return;
    persist([...library, trimmed]);
    setNewUrl('');
  };

  const remove = (url) => persist(library.filter((v) => v !== url));

  if (!loaded) return null;

  return (
    <div className="ambient-library">
      <p className="meta" style={{ marginBottom: '1rem' }}>
        Videos added here cycle as a low-opacity ambient background while you write blog posts. Stored locally in this browser — not saved to any post.
      </p>

      <MediaUrlInput
        id="ambient-add-video"
        label="Add Video"
        value={newUrl}
        onChange={setNewUrl}
        folder="images/posts"
        accept="video/*"
        placeholder="Upload or paste a video URL..."
      />

      <div className="actions" style={{ marginTop: '0.6rem', marginBottom: '1rem' }}>
        <button className="button" type="button" onClick={add} disabled={!newUrl.trim()}>
          Add to Library
        </button>
      </div>

      {library.length > 0 ? (
        <ul className="ambient-library-list">
          {library.map((url) => (
            <li key={url} className="ambient-library-item">
              <video src={url} muted preload="metadata" className="ambient-library-thumb" />
              <span className="ambient-library-filename meta">{decodeURIComponent(url.split('/').pop().split('?')[0])}</span>
              <button className="button danger" type="button" onClick={() => remove(url)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta" style={{ opacity: 0.55 }}>No videos in library yet. Add one above.</p>
      )}
    </div>
  );
}
