create table public.gleaux_settings (
  id smallint primary key default 1 check (id = 1),
  title text not null default 'Lets Gleaux' check (char_length(title) between 1 and 100),
  description text not null default 'The track inspired by the Gleaux for the Girls event at Walker Automotive. For the fighters, the survivors, and everyone standing beside them.' check (char_length(description) <= 600),
  player_path text,
  download_path text,
  downloads_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  check (player_path is null or player_path ~ '^player/[a-zA-Z0-9._-]+$'),
  check (download_path is null or download_path ~ '^download/[a-zA-Z0-9._-]+$')
);
create table public.gleaux_download_events (
  request_id uuid primary key,
  fingerprint text not null unique,
  audio_path text not null,
  created_at timestamptz not null default now()
);
alter table public.gleaux_settings enable row level security;
alter table public.gleaux_download_events enable row level security;
revoke all on public.gleaux_settings, public.gleaux_download_events from anon, authenticated;
grant select, insert, update on public.gleaux_settings to service_role;
grant select, insert on public.gleaux_download_events to service_role;
insert into public.gleaux_settings (id) values (1);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gleaux-audio', 'gleaux-audio', false, 209715200, array['audio/mpeg','audio/wav','audio/mp4','audio/ogg','audio/flac']);
comment on table public.gleaux_download_events is 'Server-issued download handoffs, not completed file transfers. Retry UUID and one-minute HMAC fingerprint deduplicate requests; raw IPs are not stored.';
