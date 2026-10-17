-- XSTUDIO only. The owner row is intentionally NOT seeded here: the correct
-- auth.users.id must be independently verified before any account has access.
-- Server-side service credentials bypass RLS, so API routes must check the
-- configured owner UID against this table before reading or writing assets.

create table public.xstudio_owners (
  user_id uuid primary key references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.xstudio_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.xstudio_owners (user_id) on delete restrict,
  project_id uuid,
  kind text not null check (length(btrim(kind)) between 1 and 80),
  name text not null check (length(btrim(name)) between 1 and 512),
  mime_type text not null check (length(btrim(mime_type)) between 1 and 255),
  byte_size bigint not null check (byte_size >= 0),
  storage_path text not null unique
    check (storage_path like owner_id::text || '/%' and length(storage_path) <= 1024),
  source_provider text check (source_provider is null or length(btrim(source_provider)) between 1 and 80),
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'failed')),
  created_at timestamptz not null default now()
);

create index xstudio_assets_owner_created_idx
  on public.xstudio_assets (owner_id, created_at desc);
create index xstudio_assets_project_idx
  on public.xstudio_assets (project_id)
  where project_id is not null;

alter table public.xstudio_owners enable row level security;
alter table public.xstudio_assets enable row level security;

revoke all on public.xstudio_owners from public, anon, authenticated;
revoke all on public.xstudio_assets from public, anon, authenticated;
grant select on public.xstudio_owners to authenticated;
grant select, insert, update, delete on public.xstudio_assets to authenticated;

create policy xstudio_owners_read_self
  on public.xstudio_owners for select to authenticated
  using (user_id = (select auth.uid()));

create policy xstudio_assets_read_owner
  on public.xstudio_assets for select to authenticated
  using (owner_id = (select auth.uid()));

create policy xstudio_assets_insert_owner
  on public.xstudio_assets for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy xstudio_assets_update_owner
  on public.xstudio_assets for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy xstudio_assets_delete_owner
  on public.xstudio_assets for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Private bucket; never give XSTUDIO assets a public download URL.
insert into storage.buckets (id, name, public)
values ('xstudio-assets', 'xstudio-assets', false);

-- A storage object must live under <owner auth UID>/<asset path>. The owner
-- registry starts empty, so these policies allow nobody until owner seeding.
create policy xstudio_objects_read_owner
  on storage.objects for select to authenticated
  using (
    bucket_id = 'xstudio-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.xstudio_owners o
      where o.user_id = (select auth.uid())
    )
  );

create policy xstudio_objects_insert_owner
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'xstudio-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.xstudio_owners o
      where o.user_id = (select auth.uid())
    )
  );

create policy xstudio_objects_update_owner
  on storage.objects for update to authenticated
  using (
    bucket_id = 'xstudio-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.xstudio_owners o
      where o.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'xstudio-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.xstudio_owners o
      where o.user_id = (select auth.uid())
    )
  );

create policy xstudio_objects_delete_owner
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'xstudio-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.xstudio_owners o
      where o.user_id = (select auth.uid())
    )
  );
