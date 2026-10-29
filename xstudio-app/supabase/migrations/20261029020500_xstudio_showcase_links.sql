-- Timed, read-only showcase links: one project, one secret link, auto-expiring.
-- Only the SHA-256 of the link token is stored; the plaintext exists only in
-- the URL handed to the owner. Like xstudio_api_tokens, this table has no
-- client RLS policy: only the xstudio-assets-api Edge Function reads or writes it.
create table public.xstudio_showcase_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.xstudio_owners (user_id) on delete restrict,
  project text not null check (project ~ '^[a-zA-Z0-9_-]{1,80}$'),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  -- Hard ceiling so a link can never be extended into a standing public page.
  check (expires_at <= created_at + interval '24 hours')
);

create index xstudio_showcase_links_owner_project_idx
  on public.xstudio_showcase_links (owner_id, project, expires_at desc);

alter table public.xstudio_showcase_links enable row level security;
revoke all on public.xstudio_showcase_links from public, anon, authenticated;
