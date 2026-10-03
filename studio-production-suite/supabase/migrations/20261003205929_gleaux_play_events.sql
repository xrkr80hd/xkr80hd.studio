create table public.gleaux_play_events (request_id uuid primary key, audio_path text not null, created_at timestamptz not null default now());
alter table public.gleaux_play_events enable row level security;
revoke all on public.gleaux_play_events from anon, authenticated;
grant select, insert on public.gleaux_play_events to service_role;
