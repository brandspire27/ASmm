-- Phase 1A.2: external client users must be explicitly assigned to individual clients.
-- Internal staff retain their existing workspace permissions.
begin;

create table public.client_access_assignments (
  workspace_id uuid not null,
  client_id uuid not null,
  user_id uuid not null,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, client_id, user_id),
  foreign key (workspace_id, client_id) references public.clients(workspace_id, id) on delete cascade,
  foreign key (workspace_id, user_id) references public.workspace_memberships(workspace_id, user_id) on delete cascade
);
create index client_access_assignments_user_idx on public.client_access_assignments(workspace_id, user_id);
alter table public.client_access_assignments enable row level security;
-- No direct browser access. The owner/admin RPC below is the only application write path.
revoke all on public.client_access_assignments from public, anon, authenticated;

create function public.has_client_scope(p_workspace_id uuid, p_client_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_memberships m
    join public.workspaces w on w.id = m.workspace_id
    join public.organization_memberships om on om.organization_id = w.organization_id and om.user_id = m.user_id
    where m.workspace_id = p_workspace_id and m.user_id = (select auth.uid())
      and m.status = 'active' and om.status = 'active'
      and (m.role_key <> 'client' or exists (
        select 1 from public.client_access_assignments a
        where a.workspace_id = p_workspace_id and a.client_id = p_client_id and a.user_id = m.user_id
      ))
  );
$$;
revoke all on function public.has_client_scope(uuid,uuid) from public, anon, authenticated;
grant execute on function public.has_client_scope(uuid,uuid) to authenticated;

-- Restrictive policies AND with existing permissive role checks; they cannot grant new access.
create policy "Client scope on clients" on public.clients as restrictive for select to authenticated
  using ((select public.has_client_scope(workspace_id, id)));
create policy "Client scope on content" on public.generated_content as restrictive for select to authenticated
  using ((select public.has_client_scope(workspace_id, client_id)));
create policy "Client scope on analytics" on public.campaign_analytics as restrictive for select to authenticated
  using ((select public.has_client_scope(workspace_id, client_id)));
create policy "Client scope on asset metadata" on public.brand_assets as restrictive for select to authenticated
  using ((select public.has_client_scope(workspace_id, client_id)));
-- Brand profiles are workspace-wide, not linked to a client ID. Do not expose them to external clients.
delete from public.role_permissions where role_key = 'client' and permission_key = 'brand_profiles.read';

create function public.set_client_access(p_workspace_id uuid, p_client_id uuid, p_email text, p_granted boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare target_user uuid;
begin
  if auth.uid() is null or not public.has_workspace_permission(p_workspace_id, 'workspace.manage_members') then
    raise exception 'Workspace administrator permission required' using errcode = '42501';
  end if;
  if p_granted is null or p_email is null or length(trim(p_email)) not between 3 and 254 then
    raise exception 'Provide a valid member email and access action' using errcode = '22023';
  end if;
  if not exists (select 1 from public.clients where workspace_id = p_workspace_id and id = p_client_id) then
    raise exception 'Client not found in this workspace' using errcode = '22023';
  end if;
  select m.user_id into target_user from public.workspace_memberships m
    join auth.users u on u.id = m.user_id
    join public.workspaces w on w.id = m.workspace_id
    join public.organization_memberships om on om.organization_id = w.organization_id and om.user_id = m.user_id
    where m.workspace_id = p_workspace_id and m.role_key = 'client' and m.status = 'active'
      and om.status = 'active' and lower(u.email) = lower(trim(p_email)) and u.email_confirmed_at is not null
    for update of m;
  if target_user is null then
    raise exception 'No active, confirmed client-role member with that email in this workspace' using errcode = '22023';
  end if;
  if p_granted then
    insert into public.client_access_assignments(workspace_id, client_id, user_id, assigned_by)
    values(p_workspace_id, p_client_id, target_user, auth.uid()) on conflict do nothing;
  else
    delete from public.client_access_assignments where workspace_id = p_workspace_id and client_id = p_client_id and user_id = target_user;
  end if;
  return p_granted;
end;
$$;
revoke all on function public.set_client_access(uuid,uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.set_client_access(uuid,uuid,text,boolean) to authenticated;

-- Changing or suspending a membership invalidates its prior client grants.
create function public.clear_changed_client_access() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role_key is distinct from old.role_key or new.status is distinct from old.status then
    delete from public.client_access_assignments where workspace_id = old.workspace_id and user_id = old.user_id;
  end if;
  return new;
end;
$$;
revoke all on function public.clear_changed_client_access() from public, anon, authenticated;
create trigger clear_changed_client_access after update of role_key, status on public.workspace_memberships
for each row execute function public.clear_changed_client_access();
commit;
