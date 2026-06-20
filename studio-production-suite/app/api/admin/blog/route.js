import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername } from '../../../../lib/admin-auth';
import { clampText, isValidMediaUrl, slugify, toBoolean } from '../../../../lib/admin-crud-utils';
import { normalizeAdminUsername } from '../../../../lib/admin-users';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

function isMissingAuthorColumnError(error) {
  return String(error?.message || '').toLowerCase().includes('author_username');
}

function getActingAdmin(request) {
  const actingUser = normalizeAdminUsername(request.cookies.get(ADMIN_SESSION_USER_COOKIE)?.value || '');
  return {
    actingUser,
    ownerMode: isOwnerUsername(actingUser),
  };
}

function formatDateTimeForDb(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function buildPostPayload(raw) {
  const title = clampText(raw?.title, 255);
  const slugInput = clampText(raw?.slug, 255);
  const excerpt = clampText(raw?.excerpt, 300);
  const content = String(raw?.content || '').trim();
  const coverImageUrl = String(raw?.cover_image_url || '').trim();
  const publishedAt = formatDateTimeForDb(raw?.published_at);
  const isPublished = toBoolean(raw?.is_published);

  if (!title) {
    return { ok: false, error: 'Post title is required.' };
  }
  if (!content) {
    return { ok: false, error: 'Post content is required.' };
  }
  if (!isValidMediaUrl(coverImageUrl)) {
    return { ok: false, error: 'Cover image URL must start with https:// or /' };
  }

  const generatedSlug = slugify(slugInput || title);
  if (!generatedSlug) {
    return { ok: false, error: 'A valid slug is required.' };
  }

  return {
    ok: true,
    slug: generatedSlug,
    payload: {
      title,
      excerpt: excerpt || null,
      content,
      cover_image_url: coverImageUrl || null,
      published_at: isPublished ? publishedAt || new Date().toISOString() : null,
      is_published: isPublished,
    },
  };
}

async function ensureUniqueSlug(supabase, baseSlug) {
  let counter = 1;
  let candidate = baseSlug;

  while (counter < 200) {
    const existing = await supabase.from('blog_posts').select('id').eq('slug', candidate).limit(1).maybeSingle();
    if (existing.error) {
      return { ok: false, error: existing.error.message };
    }
    if (!existing.data) {
      return { ok: true, slug: candidate };
    }

    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }

  return { ok: false, error: 'Could not generate a unique slug.' };
}

export async function GET(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const { actingUser, ownerMode } = getActingAdmin(request);
  if (!actingUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase.from('blog_posts').select('*');
  if (!ownerMode) {
    query = query.eq('author_username', actingUser);
  }

  const response = await query.order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });

  if (response.error) {
    if (!ownerMode && isMissingAuthorColumnError(response.error)) {
      return NextResponse.json(
        { error: 'Blog ownership is not configured yet. Add blog_posts.author_username in Supabase schema before using non-owner blog managers.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: response.error.message }, { status: 500 });
  }

  return NextResponse.json({ items: response.data || [] });
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Missing Supabase server credentials.' }, { status: 500 });
  }

  const { actingUser, ownerMode } = getActingAdmin(request);
  if (!actingUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = buildPostPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const slugResult = await ensureUniqueSlug(supabase, parsed.slug);
  if (!slugResult.ok) {
    return NextResponse.json({ error: slugResult.error }, { status: 500 });
  }

  const insert = await supabase
    .from('blog_posts')
    .insert({
      ...parsed.payload,
      slug: slugResult.slug,
      author_username: ownerMode ? null : actingUser,
    })
    .select('id, slug')
    .limit(1)
    .maybeSingle();

  if (insert.error) {
    if (!ownerMode && isMissingAuthorColumnError(insert.error)) {
      return NextResponse.json(
        { error: 'Blog ownership is not configured yet. Add blog_posts.author_username in Supabase schema before using non-owner blog managers.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: insert.data });
}
