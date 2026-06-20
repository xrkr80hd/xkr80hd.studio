'use client';

import { useMemo, useState } from 'react';

const TYPES = [
  { key: 'band', label: 'Band' },
  { key: 'artist', label: 'Artist' },
  { key: 'podcast', label: 'Podcast' },
  { key: 'local_business', label: 'Business' },
  { key: 'legend', label: 'Legend' },
  { key: 'local_scene', label: 'Local Scene' },
  { key: 'blog', label: 'Blog' },
  { key: 'other', label: 'Other' },
];

const PLATFORM_PLACEHOLDER = 'Spotify, Apple Music, Main Website, Instagram, YouTube, TikTok, etc.';

function cleanLine(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SubmissionIntakeForm() {
  const [submitType, setSubmitType] = useState('band');
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [city, setCity] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [linksText, setLinksText] = useState('');
  const [uploads, setUploads] = useState([]);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeTypeLabel = useMemo(() => TYPES.find((item) => item.key === submitType)?.label || 'Project', [submitType]);

  async function uploadFile(file) {
    const formData = new FormData();
    formData.set('file', file);

    const response = await fetch('/api/public/upload', {
      method: 'POST',
      body: formData,
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || 'Upload failed.');
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      url: body.url,
    };
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) {
      return;
    }

    setUploading(true);
    setStatus(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`);

    try {
      const next = [];
      for (const file of files) {
        const uploaded = await uploadFile(file);
        next.push(uploaded);
      }

      setUploads((current) => [...current, ...next]);
      setStatus(`${next.length} file${next.length > 1 ? 's' : ''} uploaded.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="contact-submit-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setStatus(`Submitting ${activeTypeLabel} request...`);

        const payload = {
          submit_type: submitType,
          name,
          contact_name: contactName,
          contact_email: contactEmail,
          city,
          summary,
          details,
          links: cleanLine(linksText),
          files: uploads.map((item) => item.url),
        };

        try {
          const response = await fetch('/api/public/submissions', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            setStatus(body.error || 'Submission failed.');
            setSubmitting(false);
            return;
          }

          setStatus('Submission sent. We will review and follow up.');
          setSubmitting(false);
          setName('');
          setContactName('');
          setContactEmail('');
          setCity('');
          setSummary('');
          setDetails('');
          setLinksText('');
          setUploads([]);
        } catch {
          setStatus('Submission failed due to network error.');
          setSubmitting(false);
        }
      }}
    >
      <h3 className="section-title">Submit Your Project</h3>
      <p className="meta">Drop files, choose a content type, and send details for YourLocal review.</p>

      <div className="grid cols-3">
        <div className="form-row">
          <label htmlFor="submit-type">What are you submitting?</label>
          <select id="submit-type" value={submitType} onChange={(event) => setSubmitType(event.target.value)}>
            {TYPES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="project-name">Name</label>
          <input id="project-name" type="text" required value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="form-row">
          <label htmlFor="project-city">City</label>
          <input id="project-city" type="text" value={city} onChange={(event) => setCity(event.target.value)} />
        </div>
      </div>

      <div className="grid cols-2">
        <div className="form-row">
          <label htmlFor="contact-name">Contact Name</label>
          <input id="contact-name" type="text" required value={contactName} onChange={(event) => setContactName(event.target.value)} />
        </div>
        <div className="form-row">
          <label htmlFor="contact-email">Contact Email</label>
          <input id="contact-email" type="email" required value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="project-summary">Summary</label>
        <textarea id="project-summary" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Short one-paragraph summary" />
      </div>

      <div className="form-row">
        <label htmlFor="project-details">Details and Specs</label>
        <textarea id="project-details" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Tell us what you want listed and any specific requirements" />
      </div>

      <div className="form-row">
        <label htmlFor="project-links">Platform Links (one per line)</label>
        <textarea id="project-links" value={linksText} onChange={(event) => setLinksText(event.target.value)} placeholder={PLATFORM_PLACEHOLDER} />
      </div>

      <div
        className="dropzone"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer?.files || []);
        }}
      >
        <div className="dropzone-graphic" aria-hidden="true">
          <span className="dropzone-disc" />
          <span className="dropzone-wave" />
          <span className="dropzone-wave" />
        </div>
        <p>
          Drag and drop files here or use the picker.
          <br />
          Images, MP3/WAV/OGG/AAC, and PDFs up to 25MB each.
        </p>
        <input
          type="file"
          multiple
          disabled={uploading || submitting}
          onChange={(event) => {
            handleFiles(event.target.files || []);
            event.target.value = '';
          }}
        />
      </div>

      {uploads.length ? (
        <div className="upload-list">
          {uploads.map((item, index) => (
            <div key={`${item.url}-${index}`} className="upload-chip">
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.name}
              </a>
            </div>
          ))}
        </div>
      ) : null}

      <div className="actions">
        <button className="button primary" type="submit" disabled={uploading || submitting}>
          {submitting ? 'Submitting...' : `Submit ${activeTypeLabel}`}
        </button>
      </div>

      {status ? <p className="meta">{status}</p> : null}
    </form>
  );
}
