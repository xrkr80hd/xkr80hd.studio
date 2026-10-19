-- Called only by the authenticated engine service after the folder gate succeeds.
create or replace function public.xstudio_edit_project(
 p_owner uuid, p_project text, p_new_project text, p_revision integer, p_manifest text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare source public.xstudio_engine_projects%rowtype; payload jsonb;
begin
 if p_owner is null or p_project is null or p_new_project is null
    or p_project !~ '^[a-zA-Z0-9_-]{1,80}$' or p_new_project !~ '^[a-zA-Z0-9_-]{1,80}$'
    or p_project = 'xce-lost-assets' or p_new_project = 'xce-lost-assets' then
   raise exception 'Invalid project ID';
 end if;
 select * into source from public.xstudio_engine_projects
  where owner_id=p_owner and project=p_project for update;
 if not found then raise exception 'Project not found'; end if;
 if p_revision is null or source.revision<>p_revision then raise exception 'Project changed. Refresh and try again.'; end if;
 if (source.manifest::jsonb)->>'system_pool' is not null or (source.manifest::jsonb)->>'deleted_at' is not null then
  raise exception 'Choose an active project.';
 end if;
 if p_project<>p_new_project and exists(select 1 from public.xstudio_engine_projects where owner_id=p_owner and project=p_new_project) then
  raise exception 'That project ID is already in use.';
 end if;
 payload=p_manifest::jsonb;
 if p_manifest is null or length(p_manifest)>=1900000 or payload->>'project_id' is distinct from p_new_project
    or jsonb_typeof(payload)<>'object' then raise exception 'Invalid project edit'; end if;
 update public.xstudio_engine_projects set project=p_new_project,manifest=p_manifest,revision=revision+1
  where owner_id=p_owner and project=p_project;
 update public.xstudio_engine_codes set project=p_new_project where owner_id=p_owner and project=p_project;
 update public.xstudio_engine_context c set
  project=case when c.project=p_project then p_new_project else c.project end,
  project_order=coalesce((select jsonb_agg(case when e.value=to_jsonb(p_project) then to_jsonb(p_new_project) else e.value end order by e.position)
    from jsonb_array_elements(c.project_order) with ordinality e(value,position)),'[]'::jsonb)
  where c.owner_id=p_owner;
 return jsonb_build_object('project_id',p_new_project,'revision',source.revision+1);
end;
$$;
revoke all on function public.xstudio_edit_project(uuid,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.xstudio_edit_project(uuid,text,text,integer,text) to service_role;
