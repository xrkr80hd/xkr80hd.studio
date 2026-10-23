-- Separate creative review state from upload/persistence state.
alter table public.xstudio_assets
  add column workflow_status text not null default 'draft'
  check (workflow_status in ('draft', 'locked', 'rejected'));
