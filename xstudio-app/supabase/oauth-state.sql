-- Durable OAuth metadata only. No projects, references, or image data are copied.
create table if not exists public.xstudio_oauth_state (
 owner_id uuid not null references public.xstudio_owners(user_id),
 state_key text not null check(length(state_key)<=300),
 value jsonb not null,
 expires_at timestamptz not null,
 primary key(owner_id,state_key)
);
alter table public.xstudio_oauth_state enable row level security;
revoke all on public.xstudio_oauth_state from public,anon,authenticated;
grant all on public.xstudio_oauth_state to service_role;
create index if not exists xstudio_oauth_state_expiry on public.xstudio_oauth_state(expires_at);
create or replace function public.xstudio_oauth_state_op(p_owner uuid,p_op text,p_key text,p_value jsonb default null,p_ttl integer default 0,p_extra text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v jsonb; n bigint; t timestamptz:=clock_timestamp();
begin
 if p_owner is null or length(p_key)>300 or p_key is null or p_ttl<0 or p_ttl>31622400 or octet_length(coalesce(p_value::text,''))>100000 then raise exception 'Invalid state operation'; end if;
 -- Serialize each owner/key, including missing-row inserts and token consumption.
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text||':'||p_key,0));
 delete from public.xstudio_oauth_state where owner_id=p_owner and state_key=p_key and expires_at<=t;
 -- Bounded expiry cleanup; never touches asset or identity tables.
 delete from public.xstudio_oauth_state where (owner_id,state_key) in (select owner_id,state_key from public.xstudio_oauth_state where expires_at<=t limit 100);
 if p_op='get' then
  select value into v from public.xstudio_oauth_state where owner_id=p_owner and state_key=p_key; return v;
 elsif p_op='put' then
  if p_ttl<1 then raise exception 'Expiry required'; end if;
  insert into public.xstudio_oauth_state values(p_owner,p_key,p_value,t+make_interval(secs=>p_ttl)) on conflict do nothing;
  get diagnostics n=row_count; return to_jsonb(n=1);
 elsif p_op='take' then
  delete from public.xstudio_oauth_state where owner_id=p_owner and state_key=p_key returning value into v; return v;
 elsif p_op='remove' then
  delete from public.xstudio_oauth_state where owner_id=p_owner and state_key=p_key; return 'true'::jsonb;
 elsif p_op='used' then
  return to_jsonb(exists(select 1 from public.xstudio_oauth_state where owner_id=p_owner and state_key=p_key));
 elsif p_op='rotate' then
  if p_ttl<1 or p_extra is null or length(p_extra)>300 then raise exception 'Invalid rotation'; end if;
  delete from public.xstudio_oauth_state where owner_id=p_owner and state_key=p_key and value=p_value returning value into v;
  if v is null then return 'false'::jsonb; end if;
  insert into public.xstudio_oauth_state values(p_owner,p_extra,'true'::jsonb,t+make_interval(secs=>p_ttl)) on conflict(owner_id,state_key) do update set value=excluded.value,expires_at=excluded.expires_at;
  return 'true'::jsonb;
 elsif p_op='limit' then
  insert into public.xstudio_oauth_state values(p_owner,p_key,'1'::jsonb,t+interval '120 seconds') on conflict(owner_id,state_key) do update set value=to_jsonb((public.xstudio_oauth_state.value #>> '{}')::bigint+1) returning (value #>> '{}')::bigint into n;
  return to_jsonb(n);
 end if;
 raise exception 'Unknown state operation';
end; $$;
revoke all on function public.xstudio_oauth_state_op(uuid,text,text,jsonb,integer,text) from public,anon,authenticated;
grant execute on function public.xstudio_oauth_state_op(uuid,text,text,jsonb,integer,text) to service_role;
