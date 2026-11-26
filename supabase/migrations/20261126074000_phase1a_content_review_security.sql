-- Phase 1A: separate drafting from editorial review; no real publisher exists yet.
begin;

insert into public.permissions (permission_key, scope, description) values
  ('content.create', 'workspace', 'Create content drafts.'),
  ('content.approve', 'workspace', 'Approve or reject a draft.')
on conflict (permission_key) do update set description = excluded.description;

insert into public.role_permissions (role_key, permission_key) values
  ('workspace_owner', 'content.create'), ('workspace_owner', 'content.approve'),
  ('workspace_admin', 'content.create'), ('workspace_admin', 'content.approve'),
  ('social_media_manager', 'content.create'), ('social_media_manager', 'content.approve'),
  ('content_creator', 'content.create'), ('content_approver', 'content.approve')
on conflict do nothing;

delete from public.role_permissions where permission_key = 'content.manage';

-- All historical published flags came from the old manual status-only UI.
-- Preserve the rows, but never claim platform verification.
alter table public.generated_content drop constraint generated_content_status_check;
update public.generated_content set status = 'unverified' where status = 'published';
alter table public.generated_content add constraint generated_content_status_check
  check (status in ('draft', 'approved', 'rejected', 'unverified'));

update public.generated_content
set meta = jsonb_set(meta, '{status}', '"preview_only"'::jsonb)
where type = 'video' and meta ->> 'status' = 'rendered';

drop policy "Workspace members can create generated content" on public.generated_content;
drop policy "Workspace members can update generated content" on public.generated_content;
create policy "Workspace creators can insert drafts"
  on public.generated_content for insert to authenticated
  with check (status = 'draft' and (select public.has_workspace_permission(workspace_id, 'content.create')));

-- No direct client updates; even approved content cannot be silently modified.
revoke update on public.generated_content from public, anon, authenticated;

create or replace function public.review_generated_content(
  p_workspace_id uuid, p_content_id uuid, p_decision text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewed_status text;
begin
  if p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid review decision' using errcode = '22023';
  end if;
  if auth.uid() is null or not public.has_workspace_permission(p_workspace_id, 'content.approve') then
    raise exception 'Editorial approval permission required' using errcode = '42501';
  end if;
  update public.generated_content
  set status = p_decision
  where workspace_id = p_workspace_id and id = p_content_id and status = 'draft'
  returning status into reviewed_status;
  if not found then
    raise exception 'Draft is unavailable or has already been reviewed' using errcode = 'P0001';
  end if;
  return reviewed_status;
end;
$$;
revoke all on function public.review_generated_content(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.review_generated_content(uuid, uuid, text) to authenticated;
commit;
