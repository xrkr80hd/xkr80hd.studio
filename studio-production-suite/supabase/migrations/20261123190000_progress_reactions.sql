create table if not exists public.progress_reactions (
  post_id uuid not null references public.progress_posts (id) on delete cascade,
  member_email text not null references public.progress_members (email) on delete cascade,
  emoji text not null check (emoji in ('❤️', '🙏', '😊', '💪', '🎉', '👍')),
  created_at timestamptz not null default now(),
  primary key (post_id, member_email, emoji)
);
alter table public.progress_reactions enable row level security;
revoke all on public.progress_reactions from anon, authenticated;
grant select, insert, delete on public.progress_reactions to service_role;
