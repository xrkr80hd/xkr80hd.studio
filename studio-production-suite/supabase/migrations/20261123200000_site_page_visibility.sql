create table if not exists public.site_page_visibility (
  page_key text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.site_page_visibility enable row level security;
revoke all on public.site_page_visibility from anon, authenticated;
grant select, insert, update on public.site_page_visibility to service_role;
