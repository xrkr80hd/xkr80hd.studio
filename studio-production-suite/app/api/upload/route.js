import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername } from '../../../lib/admin-auth';
import { normalizeAdminUsername } from '../../../lib/admin-users';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';
import { STORAGE_FOLDER_PRESETS, isAllowedFolder, normalizeFolder } from '../../../lib/storage-folders';

export const runtime = 'nodejs';

const NON_OWNER_UPLOAD_FOLDERS = ['images/posts'];

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

function inferContentType(file) {
  const explicit = String(file?.type || '').trim();
  if (explicit) {
    return explicit;
  }

  const name = String(file?.name || '').toLowerCase();
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

  const requestContentType = request.headers.get('content-type') || '';

  if (!requestContentType.includes('multipart/form-data') && !requestContentType.includes('application/x-www-form-urlencoded')) {
    return NextResponse.json({ error: 'Content-Type must be multipart/form-data.' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const allowedFolders = (process.env.SUPABASE_ALLOWED_FOLDERS || '')
    .split(',')
    .map((value) => normalizeFolder(value, ''))
    .filter(Boolean);
  const baselineAllowedFolders = allowedFolders.length ? allowedFolders : STORAGE_FOLDER_PRESETS;
  const { actingUser, ownerMode } = getActingAdmin(request);
  const activeAllowedFolders = getRoleAwareAllowedFolders(baselineAllowedFolders, ownerMode);
  const folder = normalizeFolder(formData.get('folder') || 'misc');

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

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  if (!isAllowedFolder(folder, activeAllowedFolders)) {
    return NextResponse.json(
      {
        error: `Folder is not allowed. Use one of: ${activeAllowedFolders.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const configuredMax = Number.parseInt(String(process.env.UPLOAD_MAX_BYTES || ''), 10);
  const maxBytes = Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : 200 * 1024 * 1024;

  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File is larger than ${(maxBytes / (1024 * 1024)).toFixed(0)}MB.` }, { status: 400 });
  }

  const filename = cleanFilename(file.name || 'upload.bin');
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
  const replaceRequested = parseBoolean(formData.get('replace')) || String(formData.get('replace_key') || '').trim() !== '';
  const explicitReplaceKey = normalizeStorageKey(formData.get('replace_key'));
  const replaceFromUrlKey = getStorageKeyFromPublicUrl(formData.get('replace_from_url'), bucket);
  const replaceKey = explicitReplaceKey || replaceFromUrlKey;
  const key = replaceRequested
    ? replaceKey || `${folder}/${filename}`
    : `${folder}/${Date.now()}-${randomUUID()}-${filename}`;

  if (!isAllowedFolder(key, activeAllowedFolders)) {
    return NextResponse.json(
      {
        error: `Replace key is not allowed. Use one of: ${activeAllowedFolders.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const data = Buffer.from(await file.arrayBuffer());

  const uploadContentType = inferContentType(file);
  const upload = await supabase.storage.from(bucket).upload(key, data, {
    upsert: replaceRequested,
    contentType: uploadContentType,
  });

  if (upload.error) {
    const message = String(upload.error.message || 'Upload failed.');
    const hint = /mime|content[- ]?type/i.test(message)
      ? ' Check Supabase bucket MIME restrictions (include audio/mpeg for .mp3).'
      : /size|too large|payload/i.test(message)
        ? ` File exceeds allowed size. Current server max is ${(maxBytes / (1024 * 1024)).toFixed(0)}MB.`
        : /bucket|not found/i.test(message)
          ? ' Verify SUPABASE_STORAGE_BUCKET exists and is public.'
          : '';
    return NextResponse.json(
      {
        error: `${message}${hint}`,
        details: {
          bucket,
          folder,
          key,
          max_bytes: maxBytes,
          replace_mode: replaceRequested,
        },
      },
      { status: 500 }
    );
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(key);
  const canonicalUrl = publicData.publicUrl;
  const url = replaceRequested ? `${canonicalUrl}${canonicalUrl.includes('?') ? '&' : '?'}v=${Date.now()}` : canonicalUrl;

  return NextResponse.json({
    key,
    bucket,
    url,
    canonical_url: canonicalUrl,
    replaced: replaceRequested,
  });
}
