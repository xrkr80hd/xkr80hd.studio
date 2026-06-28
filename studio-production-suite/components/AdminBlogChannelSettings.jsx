'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import AdminLogoutButton from './AdminLogoutButton';
import BlogAvatarCropper from './BlogAvatarCropper';

async function createSignedUploadIntent({ file, folder, replaceMode, replaceKey, currentValue }) {
  const response = await fetch('/api/upload/signed', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
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
  if (!response.ok) throw new Error(payload.error || 'Failed to initialize upload.');
  const signedUrl = String(payload.signed_url || '').trim();
  if (!signedUrl) throw new Error('No upload URL returned.');
  return payload;
}

async function uploadViaSignedUrl({ file, folder, replaceMode, replaceKey, currentValue }) {
  const intent = await createSignedUploadIntent({ file, folder, replaceMode, replaceKey, currentValue });
  const signedUrl = String(intent.signed_url || '').trim();
  const contentType = String(intent.content_type || file.type || 'application/octet-stream');
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'content-type': contentType },
    body: file,
  });
  if (!uploadResponse.ok) {
    const failureText = await uploadResponse.text().catch(() => '');
    throw new Error(failureText || `Upload failed with status ${uploadResponse.status}.`);
  }
  return intent;
}

function withCacheBust(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  const separator = raw.includes('?') ? '&' : '?';
  return `${raw}${separator}v=${Date.now()}`;
}

const PROFILE_FALLBACK_CARD_IMAGE = '/assets/cards/local-blog.png';
const PROFILE_FALLBACK_CARD_ALIASES = ['/assets/cards/local-blog.png', '/assets/cards/local-blog-card.png'];

function isProfileFallbackCardImage(url) {
  const raw = String(url || '').trim();
  if (!raw) return false;
  const base = raw.split('?')[0];
  return PROFILE_FALLBACK_CARD_ALIASES.some((candidate) => base.endsWith(candidate));
}

export default function AdminBlogChannelSettings({ draftCount = 0, publishedCount = 0, profilePage = false }) {
  const [channelUsername, setChannelUsername] = useState('');
  const [channelName, setChannelName] = useState('');
  const [draftChannelName, setDraftChannelName] = useState('');
  const [channelBio, setChannelBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [cardImageUrl, setCardImageUrl] = useState('');
  const [channelSlug, setChannelSlug] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(profilePage);
  const [isBioOpen, setIsBioOpen] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [avatarCropFile, setAvatarCropFile] = useState(null);
  const profileFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const publicChannelHref = channelSlug ? `/blog/channel/${encodeURIComponent(channelSlug)}` : '/blog';
  const canEditProfile = profilePage || isEditingProfile;
  const profileSquareImageUrl = avatarPreviewUrl || avatarUrl || PROFILE_FALLBACK_CARD_IMAGE;
  const displayImageUrl = coverPreviewUrl || cardImageUrl;

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      const response = await fetch('/api/admin/blog/channel', { method: 'GET', cache: 'no-store' });
      const body = await response.json().catch(() => ({}));

      if (cancelled) return;

      if (!response.ok) {
        setStatus(body.error || 'Failed to load channel settings.');
        setLoading(false);
        return;
      }

      setChannelUsername(String(body?.item?.username || ''));
      setChannelName(String(body?.item?.channel_name || ''));
      setDraftChannelName(String(body?.item?.channel_name || ''));
      setChannelBio(String(body?.item?.blogger_bio || ''));
      setAvatarUrl(String(body?.item?.avatar_url || ''));
      setCardImageUrl(String(body?.item?.card_image_url || ''));
      setChannelSlug(String(body?.item?.channel_slug || ''));
      setAvatarPreviewUrl('');
      setCoverPreviewUrl('');
      setStatus('');
      setLoading(false);
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer?.files;
    if (files && files[0]) {
      if (!canEditProfile) {
        setIsEditingProfile(true);
      }
      await handleImageUpload(files[0], 'cover');
    }
  };

  const handleImageUpload = async (file, target = 'cover') => {
    if (!file.type.startsWith('image/')) {
      setStatus('Please upload an image file.');
      return false;
    }

    // Show local preview immediately so the image is visible right away
    const blobUrl = URL.createObjectURL(file);
    if (target === 'avatar') {
      setAvatarPreviewUrl(blobUrl);
    } else {
      setCoverPreviewUrl(blobUrl);
    }

    setUploading(true);
    setStatus(target === 'avatar' ? 'Uploading profile picture...' : 'Uploading cover image...');

    try {
      const payload = await uploadViaSignedUrl({
        file,
        folder: 'images/blog-channels',
        replaceMode: true,
        replaceKey: target === 'avatar' ? `blog-profile-${channelUsername || 'channel'}` : `blog-channel-${channelUsername || 'channel'}`,
        currentValue: target === 'avatar' ? avatarUrl : cardImageUrl,
      });

      const nextUrl = String(payload.url || payload.canonical_url || '');
      if (nextUrl) {
        const cacheBustedUrl = withCacheBust(nextUrl);
        if (target === 'avatar') {
          setAvatarUrl(cacheBustedUrl);
          setAvatarPreviewUrl('');
        } else {
          setCardImageUrl(cacheBustedUrl);
          setCoverPreviewUrl('');
        }
        URL.revokeObjectURL(blobUrl);
        setStatus(target === 'avatar' ? 'Profile image saved!' : 'Cover image saved!');
      } else {
        // Upload succeeded but no URL returned — keep local preview visible
        setStatus('Uploaded — save profile to persist.');
      }
      setUploading(false);
      return true;
    } catch (error) {
      // Keep local preview visible even if upload fails so user sees their image
      setStatus(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploading(false);
      return false;
    }
  };

  return (
    <>
      <form
      className="admin-blog-profile-hero"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setStatus('');
        setIsEditingProfile(false);

        const response = await fetch('/api/admin/blog/channel', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            channel_name: draftChannelName,
            avatar_url: avatarUrl,
            card_image_url: cardImageUrl,
          }),
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          setStatus(body.error || 'Hmm, something went wrong.');
          setSaving(false);
          return;
        }

        setChannelUsername(String(body?.item?.username || channelUsername));
        setChannelName(String(body?.item?.channel_name || draftChannelName));
        setDraftChannelName(String(body?.item?.channel_name || draftChannelName));
        setChannelBio(String(body?.item?.blogger_bio || channelBio));
        setAvatarUrl(String(body?.item?.avatar_url || avatarUrl));
        setCardImageUrl(String(body?.item?.card_image_url || cardImageUrl));
        setChannelSlug(String(body?.item?.channel_slug || channelSlug));
        setStatus('');
        setSaving(false);
      }}
    >
      <h2 className="section-title"><span className="brand-mylocal"><span className="brand-my">My</span><span className="brand-local">Local</span></span> <span className="brand-blog">Blog</span> Space</h2>
      {loading ? <p className="meta">Loading channel settings...</p> : null}
      {profilePage ? (
        <p className="meta" style={{ marginTop: '-0.45rem' }}>
          Edit your blog profile details and images, then save.
        </p>
      ) : null}

      <div className="admin-blog-profile-top">
        <div className="admin-blog-profile-left">
          <div
            className={`admin-blog-profile-square ${canEditProfile ? 'is-editable' : ''}`}
            onClick={() => {
              if (uploading) return;
              if (!canEditProfile) {
                setIsEditingProfile(true);
              }
              profileFileInputRef.current?.click();
            }}
          >
            {profileSquareImageUrl ? <img src={profileSquareImageUrl} alt="Profile" /> : <span>PROFILE PICTURE</span>}
          </div>
          <p className="admin-blog-profile-name">{channelName || 'Blog Name'}</p>

          <div className="admin-blog-profile-actions-box">
            <Link className="button primary" href="/admin/blog/new" prefetch={false}>
              New Blog
            </Link>
            <button className="button" type="button" onClick={() => setIsEditingProfile(true)}>
              Edit Profile
            </button>
            <Link className="button" href={publicChannelHref} prefetch={false}>
              View Blog
            </Link>
            <AdminLogoutButton />
          </div>
        </div>

        <div className="admin-blog-profile-media-wrap">
          <input
            ref={profileFileInputRef}
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!canEditProfile) {
                setIsEditingProfile(true);
              }
              setAvatarCropFile(file);
              e.target.value = '';
            }}
            style={{ display: 'none' }}
          />
          <div
            className={`admin-blog-drag-drop-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (uploading) return;
              if (!canEditProfile) {
                setIsEditingProfile(true);
              }
              coverFileInputRef.current?.click();
            }}
            style={{ cursor: !uploading ? 'pointer' : 'default' }}
          >
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!canEditProfile) {
                  setIsEditingProfile(true);
                }
                handleImageUpload(file, 'cover');
              }}
              style={{ display: 'none' }}
            />
            {displayImageUrl ? (
              <img src={displayImageUrl} alt="Blog cover" className="admin-blog-drop-preview" />
            ) : (
              <div className="admin-blog-cover-placeholder">Drop or click to upload 16:9 cover</div>
            )}
          </div>
          <p className="meta admin-blog-cover-help">
            {uploading ? 'Uploading...' : canEditProfile ? 'Drop cover photo here or click to upload' : 'Click Edit Profile to update photos'}
          </p>
        </div>
      </div>

      <p className="meta admin-blog-top-stats">Blog stats: Drafts {draftCount} · Published {publishedCount}</p>

      <section className="admin-blog-bio-accordion" aria-label="Blogger bio">
        <button
          className="button admin-blog-bio-toggle"
          type="button"
          onClick={() => setIsBioOpen((open) => !open)}
        >
          <span>Blogger Bio</span>
          <span aria-hidden="true">{isBioOpen ? '−' : '+'}</span>
        </button>
        {isBioOpen ? (
          <div className="admin-blog-bio-panel">
            <p>{channelBio || 'No bio available yet.'}</p>
          </div>
        ) : null}
      </section>

      {canEditProfile ? (
        <div className="admin-blog-profile-fields">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label htmlFor="channel-name">Blog Name</label>
            <input
              id="channel-name"
              type="text"
              value={draftChannelName}
              onChange={(event) => setDraftChannelName(event.target.value)}
              placeholder="Your Blog Name"
              required
            />
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="button primary" type="submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              className="button"
              type="button"
              disabled={saving || uploading}
              onClick={() => {
                setDraftChannelName(channelName);
                setStatus('');
                if (!profilePage) setIsEditingProfile(false);
              }}
            >
              {profilePage ? 'Reset' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : null}

      {status ? <p className={`meta ${status.includes('Error') || status.includes('wrong') ? 'error' : ''}`}>{status}</p> : null}
      </form>
      {avatarCropFile ? (
        <BlogAvatarCropper
          file={avatarCropFile}
          busy={uploading}
          onCancel={() => setAvatarCropFile(null)}
          onCrop={async (croppedFile) => {
            const uploaded = await handleImageUpload(croppedFile, 'avatar');
            if (uploaded) setAvatarCropFile(null);
          }}
        />
      ) : null}
    </>
  );
}
