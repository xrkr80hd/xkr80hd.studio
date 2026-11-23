-- Progress page (/progress): dated updates with photos, family sign-in by email link, and family notes.
-- Only the server (service role) reads or writes; pages render server-side.

create table if not exists public.progress_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '' check (char_length(title) <= 140),
  body text not null default '' check (char_length(body) <= 8000),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(title) > 0 or char_length(body) > 0 or cardinality(photo_paths) > 0)
);
create index if not exists progress_posts_created_at_idx on public.progress_posts (created_at desc);

-- Single-row page settings. Anyone with the link can read by default; require_signin = true limits reading to signed-in family.
create table if not exists public.progress_settings (
  id smallint primary key default 1 check (id = 1),
  require_signin boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.progress_settings (id) values (1) on conflict (id) do nothing;

-- Family members who asked for a sign-in link. Sessions are signed cookies (30 days); blocked members lose access.
create table if not exists public.progress_members (
  email text primary key check (email = lower(email) and char_length(email) between 3 and 254),
  name text not null default '' check (char_length(name) <= 80),
  verified_at timestamptz,
  last_link_sent_at timestamptz,
  last_seen_at timestamptz,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Notes of love and support left by signed-in family under an update.
create table if not exists public.progress_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.progress_posts (id) on delete cascade,
  member_email text not null references public.progress_members (email) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists progress_comments_post_idx on public.progress_comments (post_id, created_at);

alter table public.progress_posts enable row level security;
alter table public.progress_settings enable row level security;
alter table public.progress_members enable row level security;
alter table public.progress_comments enable row level security;
revoke all on public.progress_posts, public.progress_settings, public.progress_members, public.progress_comments from anon, authenticated;
grant select, insert, update, delete on public.progress_posts, public.progress_members, public.progress_comments to service_role;
grant select, update on public.progress_settings to service_role;

-- Private bucket: photos are shown through short-lived signed URLs made by the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 20971520, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
