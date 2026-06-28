'use client';

import { useState } from 'react';

function isAudioFile(file) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  return (
    type.startsWith('audio/') ||
    name.endsWith('.mp3') ||
    name.endsWith('.aac') ||
    name.endsWith('.wav') ||
    name.endsWith('.ogg') ||
    name.endsWith('.m4a') ||
    name.endsWith('.flac') ||
    name.endsWith('.webm')
  );
}

function withCacheBust(url) {
  const raw = String(url || '').trim();
  if (!raw) {
    return '';
  }

  const separator = raw.includes('?') ? '&' : '?';
  return `${raw}${separator}v=${Date.now()}`;
}

function cleanFieldLabel(value) {
  return String(value || '')
    .replace(/\s+URL\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function inferUploadHint({ id, accept }) {
  const key = String(id || '').toLowerCase();
  const acceptValue = String(accept || '').toLowerCase();

  if (acceptValue.includes('video')) {
    return 'Recommended 16:9 at 1920x1080.';
  }

  if (!acceptValue.includes('image')) {
    return '';
  }

  if (key.includes('band-banner')) return 'Recommended 3:1 at 2400x800.';
  if (key.includes('band-photo')) return 'Recommended 3:4 at 1200x1600.';
  if (key.includes('member-image')) return 'Recommended 1:1 at 1000x1000.';
  if (key.includes('home-profile')) return 'Recommended 4:3 at 1600x1200.';
  if (key.includes('home-') && key.includes('card-image')) return 'Recommended 4:3 at 1600x1200.';
  if (key.includes('band-image')) return 'Recommended 1:1 at 1200x1200.';
  if (key.includes('podcast') && key.includes('cover')) return 'Recommended 1:1 at 1200x1200.';
  if (key.includes('track-cover')) return 'Recommended 1:1 at 1400x1400.';
  if (key.includes('episode-cover')) return 'Recommended 16:9 at 1600x900.';
  if (key.includes('blog-cover')) return 'Recommended 16:9 at 1600x900.';
  if (key.includes('business') && key.includes('image')) return 'Recommended 1:1 at 1200x1200.';

  return 'Use the slot ratio from Admin Media Guide.';
}

async function createSignedUploadIntent({ file, folder, replaceMode, replaceKey, currentValue }) {
  const response = await fetch('/api/upload/signed', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      folder,
      replace: replaceMode ? '1' : '0',
      replace_key: replaceKey || '',
      replace_from_url: currentValue || '',
      content_type: file.type || '',
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Failed to initialize direct upload.');
  }

  const signedUrl = String(payload.signed_url || '').trim();
  if (!signedUrl) {
    throw new Error('Signed upload URL was not returned by server.');
  }

  return payload;
}

async function uploadViaSignedUrl({ file, folder, replaceMode, replaceKey, currentValue }) {
  const intent = await createSignedUploadIntent({ file, folder, replaceMode, replaceKey, currentValue });
  const signedUrl = String(intent.signed_url || '').trim();
  const contentType = String(intent.content_type || file.type || 'application/octet-stream');

  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'content-type': contentType,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const failureText = await uploadResponse.text().catch(() => '');
    throw new Error(failureText || `Direct upload failed with status ${uploadResponse.status}.`);
  }

  return intent;
}

export default function MediaUrlInput({
  id,
  label,
  value,
  onChange,
  folder,
  replaceMode = false,
  replaceKey = '',
  accept = '*/*',
  placeholder = '',
  help = '',
  showUrlInput = false,
  compact = false,
}) {
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [manualUrlMode, setManualUrlMode] = useState(Boolean(showUrlInput));
  const fieldLabel = cleanFieldLabel(label);
  const resolvedHelp = String(help || '').trim() || inferUploadHint({ id, accept });
  const showInlineUrlInput = showUrlInput || manualUrlMode;
  const urlPlaceholder = String(placeholder || '').trim() || 'https://... or /...';

  return (
    <div className={`form-row media-url-input ${compact ? 'compact' : ''}`.trim()}>
      <label htmlFor={showInlineUrlInput ? id : `${id}-file`}>{fieldLabel || label}</label>
      {showInlineUrlInput ? (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={urlPlaceholder}
        />
      ) : null}
      {resolvedHelp ? <p className="meta">{resolvedHelp}</p> : null}
      <div className={`upload-widget ${compact ? 'compact' : ''}`.trim()}>
        <input
          id={`${id}-file`}
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={async (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) {
              return;
            }

            const form = new FormData();
            form.set('file', file);
            form.set('folder', folder);
            if (replaceMode) {
              form.set('replace', '1');
              if (replaceKey) {
                form.set('replace_key', replaceKey);
              }
              if (value) {
                form.set('replace_from_url', value);
              }
            }

            setUploading(true);
            setStatus('Uploading...');

            try {
              const shouldUseSignedUpload = isAudioFile(file) || file.size > 4 * 1024 * 1024;
              let payload = {};

              if (shouldUseSignedUpload) {
                setStatus('Uploading directly to storage...');
                payload = await uploadViaSignedUrl({
                  file,
                  folder,
                  replaceMode,
                  replaceKey,
                  currentValue: value,
                });
              } else {
                const response = await fetch('/api/upload', {
                  method: 'POST',
                  body: form,
                });
                payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                  const shouldFallbackToSigned = response.status === 413 || /payload|too large|FUNCTION_PAYLOAD_TOO_LARGE/i.test(String(payload.error || ''));
                  if (shouldFallbackToSigned) {
                    setStatus('Switching to direct storage upload...');
                    payload = await uploadViaSignedUrl({
                      file,
                      folder,
                      replaceMode,
                      replaceKey,
                      currentValue: value,
                    });
                  } else {
                    throw new Error(String(payload.error || 'Upload failed.'));
                  }
                }
              }

              const nextUrl = String(payload.url || payload.canonical_url || '');
              const cacheBustedUrl = withCacheBust(nextUrl);
              if (nextUrl) {
                onChange(cacheBustedUrl);
              }
              setStatus(nextUrl ? (replaceMode ? 'Uploaded and replaced.' : 'Uploaded and linked.') : 'Upload complete.');
              setUploading(false);
            } catch (error) {
              setStatus(error instanceof Error ? error.message : 'Upload failed due to network error.');
              setUploading(false);
            }
          }}
        />
        {!showUrlInput ? (
          <button className="button" type="button" onClick={() => setManualUrlMode((current) => !current)}>
            {showInlineUrlInput ? 'Hide URL Field' : 'Use URL Instead'}
          </button>
        ) : null}
        {compact && value ? (
          <a className="button media-open-inline" href={value} target="_blank" rel="noreferrer">
            Open
          </a>
        ) : null}
        {status ? <span className="upload-status">{status}</span> : null}
      </div>
      {!compact && value ? (
        <p style={{ marginTop: '0.45rem' }}>
          <a className="button" href={value} target="_blank" rel="noreferrer">
            Open File
          </a>
        </p>
      ) : null}
    </div>
  );
}
