-- Server-only external tool credentials. Store SHA-256 of a random 256-bit
-- bearer token, never its plaintext. No token is seeded by this migration.
create table public.xstudio_api_tokens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.xstudio_owners (user_id) on delete restrict,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  label text not null check (length(btrim(label)) between 1 and 120),
  provider text not null check (provider ~ '^[a-z0-9][a-z0-9 _.-]{0,79}$'),
  scopes text[] not null check (
    cardinality(scopes) between 1 and 2
    and scopes <@ array['asset:read', 'asset:write']::text[]
  ),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index xstudio_api_tokens_owner_idx
  on public.xstudio_api_tokens (owner_id);

alter table public.xstudio_api_tokens enable row level security;
revoke all on public.xstudio_api_tokens from public, anon, authenticated;

-- No client RLS policy: only a trusted Edge Function using its server-only
-- service credential may look up token hashes and check the owner registry.
