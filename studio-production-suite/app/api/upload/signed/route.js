import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername } from '../../../../lib/admin-auth';
import { normalizeAdminUsername } from '../../../../lib/admin-users';
import { STORAGE_FOLDER_PRESETS, isAllowedFolder, normalizeFolder } from '../../../../lib/storage-folders';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

const NON_OWNER_UPLOAD_FOLDERS = ['images/posts', 'images/blog-channels'];

function cleanFilename(value) {
  return String(value || 'file')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-');
}

function normalizeStorageKey(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._/-]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

function parseBoolean(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function getStorageKeyFromPublicUrl(value, bucket) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const withoutQuery = raw.split('?')[0];
  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIndex = withoutQuery.indexOf(marker);
  if (markerIndex < 0) {
    return '';
  }

  const encodedKey = withoutQuery.slice(markerIndex + marker.length);
  try {
    return normalizeStorageKey(decodeURIComponent(encodedKey));
  } catch {
    return normalizeStorageKey(encodedKey);
  }
}

function inferContentType(filename, explicitType) {
  const explicit = String(explicitType || '').trim();
  if (explicit) {
    return explicit;
  }

  const name = String(filename || '').toLowerCase();
  if (name.endsWith('.mp3')) {
    return 'audio/mpeg';
  }
  if (name.endsWith('.wav')) {
    return 'audio/wav';
  }
  if (name.endsWith('.ogg')) {
    return 'audio/ogg';
  }
  if (name.endsWith('.m4a')) {
    return 'audio/mp4';
  }
  if (name.endsWith('.flac')) {
    return 'audio/flac';
  }
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (name.endsWith('.png')) {
    return 'image/png';
  }
  if (name.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'application/octet-stream';
}

function getActingAdmin(request) {
  const actingUser = normalizeAdminUsername(request.cookies.get(ADMIN_SESSION_USER_COOKIE)?.value || '');
  return {
    actingUser,
    ownerMode: isOwnerUsername(actingUser),
  };
}

function getRoleAwareAllowedFolders(allowedFolders, ownerMode) {
  if (ownerMode) {
    return allowedFolders;
  }

  return NON_OWNER_UPLOAD_FOLDERS.filter((folder) => isAllowedFolder(folder, allowedFolders));
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const allowedFolders = (process.env.SUPABASE_ALLOWED_FOLDERS || '')
    .split(',')
    .map((value) => normalizeFolder(value, ''))
    .filter(Boolean);
  const baselineAllowedFolders = allowedFolders.length ? allowedFolders : STORAGE_FOLDER_PRESETS;
  const { actingUser, ownerMode } = getActingAdmin(request);
  const activeAllowedFolders = getRoleAwareAllowedFolders(baselineAllowedFolders, ownerMode);

  const filename = cleanFilename(body.filename || 'upload.bin');
  const folder = normalizeFolder(body.folder || 'misc');
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
  const replaceRequested = parseBoolean(body.replace) || String(body.replace_key || '').trim() !== '';
  const explicitReplaceKey = normalizeStorageKey(body.replace_key);
  const replaceFromUrlKey = getStorageKeyFromPublicUrl(body.replace_from_url, bucket);
  const replaceKey = explicitReplaceKey || replaceFromUrlKey;
  const contentType = inferContentType(filename, body.content_type);

  if (!ownerMode && !actingUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!activeAllowedFolders.length) {
    return NextResponse.json(
      {
        error: 'No upload folders are available for this admin account.',
      },
      { status: 403 }
    );
  }

  if (!isAllowedFolder(folder, activeAllowedFolders)) {
    return NextResponse.json(
      {
        error: `Folder is not allowed. Use one of: ${activeAllowedFolders.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const key = replaceRequested
    ? replaceKey || `${folder}/${filename}`
    : `${folder}/${Date.now()}-${randomUUID()}-${filename}`;

  if (!isAllowedFolder(key, activeAllowedFolders)) {
    return NextResponse.json(
      {
        error: `Upload key is not allowed. Use one of: ${activeAllowedFolders.join(', ')}`,
      },
      { status: 400 }
    );
  }

  // Keep replace behavior deterministic when possible by removing existing object first.
  if (replaceRequested) {
    const cleanupTargets = Array.from(new Set([key, replaceFromUrlKey].filter(Boolean)));
    if (cleanupTargets.length) {
      await supabase.storage.from(bucket).remove(cleanupTargets);
    }
  }

  const signed = await supabase.storage.from(bucket).createSignedUploadUrl(key);
  if (signed.error || !signed.data) {
    return NextResponse.json(
      {
        error: signed.error?.message || 'Failed to create signed upload URL.',
        details: { key, bucket, folder, replace_mode: replaceRequested },
      },
      { status: 500 }
    );
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(key);
  const canonicalUrl = publicData.publicUrl;
  const url = replaceRequested ? `${canonicalUrl}${canonicalUrl.includes('?') ? '&' : '?'}v=${Date.now()}` : canonicalUrl;

  return NextResponse.json({
    ok: true,
    key,
    bucket,
    url,
    canonical_url: canonicalUrl,
    content_type: contentType,
    signed_url: signed.data.signedUrl || '',
    token: signed.data.token || '',
    path: signed.data.path || key,
    replaced: replaceRequested,
  });
}

