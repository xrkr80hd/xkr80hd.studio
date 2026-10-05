-- Isolated game data, accessed only by authenticated server routes.
create table if not exists public.game_night_hosts(username text primary key,display_name text,password_hash text not null,is_enabled boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.game_night_workspaces(username text primary key,snapshot jsonb not null,version integer not null default 1,updated_at timestamptz not null default now());
create table if not exists public.game_night_login_limits(key text primary key,window_start timestamptz not null default now(),attempts integer not null default 1);
alter table public.family_game_rooms add column if not exists owner_username text;
create index if not exists family_game_owner_idx on public.family_game_rooms(owner_username);
alter table public.game_night_hosts enable row level security;
alter table public.game_night_workspaces enable row level security;
alter table public.game_night_login_limits enable row level security;
revoke all on public.game_night_hosts,public.game_night_workspaces,public.game_night_login_limits from public,anon,authenticated;
grant all on public.game_night_hosts,public.game_night_workspaces,public.game_night_login_limits to service_role;
create or replace function public.game_night_login_attempt(attempt_key text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;begin
insert into public.game_night_login_limits as l(key) values(attempt_key) on conflict(key) do update set attempts=case when l.window_start<now()-interval '15 minutes' then 1 else l.attempts+1 end,window_start=case when l.window_start<now()-interval '15 minutes' then now() else l.window_start end returning attempts into n;
return n<=15;end;$$;
create or replace function public.game_night_save_workspace(p_username text,p_snapshot jsonb,p_version integer) returns integer language plpgsql security invoker set search_path='' as $$
declare n integer;begin
if p_version=0 then insert into public.game_night_workspaces(username,snapshot) values(p_username,p_snapshot) returning version into n;
else update public.game_night_workspaces set snapshot=p_snapshot,version=version+1,updated_at=now() where username=p_username and version=p_version returning version into n;if n is null then raise exception 'Save conflict';end if;end if;return n;end;$$;
revoke all on function public.game_night_login_attempt(text),public.game_night_save_workspace(text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.game_night_login_attempt(text),public.game_night_save_workspace(text,jsonb,integer) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('game-night-media','game-night-media',false,3000000,array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/mp4','video/mp4','video/webm']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
