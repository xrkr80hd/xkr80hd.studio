-- Shared Game Night category library: one row per category, visible to every Game Master.
-- Categories live outside any single game or workspace, so they are never lost when a game is edited or deleted.
create table if not exists public.game_night_categories(
  id text primary key,
  name text not null check (char_length(name) between 1 and 80),
  clues jsonb not null,
  media_paths text[] not null default '{}',
  signature text not null,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists game_night_categories_signature_idx on public.game_night_categories(signature);
create index if not exists game_night_categories_updated_idx on public.game_night_categories(updated_at desc);
create index if not exists game_night_categories_media_idx on public.game_night_categories using gin(media_paths);
alter table public.game_night_categories enable row level security;
revoke all on public.game_night_categories from public,anon,authenticated;
grant all on public.game_night_categories to service_role;
