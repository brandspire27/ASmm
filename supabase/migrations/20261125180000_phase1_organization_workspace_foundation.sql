create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  role_key text primary key,
  name text not null,
  scope text not null check (scope in ('organization', 'workspace')),
  description text not null default ''
);

create table if not exists public.permissions (
  permission_key text primary key,
  scope text not null check (scope in ('organization', 'workspace')),
  description text not null default ''
);

create table if not exists public.role_permissions (
  role_key text not null references public.roles(role_key) on delete cascade,
  permission_key text not null references public.permissions(permission_key) on delete cascade,
  primary key (role_key, permission_key)
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 100),
  slug text not null unique,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_key text not null references public.roles(role_key),
  status text not null default 'active' check (status in ('active', 'suspended')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 100),
  slug text not null,
  timezone text not null default 'UTC',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_key text not null references public.roles(role_key),
  status text not null default 'active' check (status in ('active', 'suspended')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 100),
  industry text not null default '',
  website_url text,
  company_description text not null default '',
  target_audience text not null default '',
  brand_voice text not null default '',
  brand_colors text[] not null default '{}',
  logo_storage_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  providers jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.roles (role_key, name, scope, description) values
  ('org_owner', 'Organization Owner', 'organization', 'Full control of the organization and its workspaces.'),
  ('org_admin', 'Organization Administrator', 'organization', 'Manage organization settings, members, and workspaces.'),
  ('org_member', 'Organization Member', 'organization', 'Read basic organization details.'),
  ('workspace_owner', 'Workspace Owner', 'workspace', 'Full control of a workspace.'),
  ('workspace_admin', 'Workspace Administrator', 'workspace', 'Manage workspace settings and members.'),
  ('social_media_manager', 'Social Media Manager', 'workspace', 'Manage content, assets, campaigns, and workspace settings.'),
  ('content_creator', 'Content Creator', 'workspace', 'Create and edit content using assigned workspace brands.'),
  ('designer', 'Designer', 'workspace', 'Manage brand profiles and media assets.'),
  ('content_approver', 'Content Approver', 'workspace', 'Review and approve workspace content.'),
  ('analyst', 'Analyst', 'workspace', 'Read content and campaign analytics.'),
  ('viewer', 'Viewer', 'workspace', 'Read workspace information.'),
  ('client', 'Client', 'workspace', 'View assigned brand, content, and analytics.')
on conflict (role_key) do update
set name = excluded.name,
    scope = excluded.scope,
    description = excluded.description;

insert into public.permissions (permission_key, scope, description) values
  ('organization.read', 'organization', 'Read organization details.'),
  ('organization.update', 'organization', 'Update organization details.'),
  ('organization.manage_members', 'organization', 'Manage organization membership.'),
  ('workspace.create', 'organization', 'Create workspaces in an organization.'),
  ('workspace.read', 'workspace', 'Read workspace data.'),
  ('workspace.manage', 'workspace', 'Update workspace settings.'),
  ('workspace.manage_members', 'workspace', 'Manage workspace membership.'),
  ('brand_profiles.read', 'workspace', 'Read workspace brand profiles.'),
  ('brand_profiles.manage', 'workspace', 'Create and update workspace brand profiles.'),
  ('clients.read', 'workspace', 'Read client records.'),
  ('clients.manage', 'workspace', 'Create and update client records.'),
  ('assets.read', 'workspace', 'Read media assets.'),
  ('assets.manage', 'workspace', 'Upload and delete media assets.'),
  ('content.read', 'workspace', 'Read generated content.'),
  ('content.manage', 'workspace', 'Create, edit, and approve content.'),
  ('campaigns.read', 'workspace', 'Read campaign records.'),
  ('campaigns.manage', 'workspace', 'Create and update campaign records.'),
  ('analytics.read', 'workspace', 'Read analytics.'),
  ('analytics.manage', 'workspace', 'Manage manually entered analytics.'),
  ('settings.read', 'workspace', 'Read workspace settings.'),
  ('settings.manage', 'workspace', 'Update workspace settings.')
on conflict (permission_key) do update
set scope = excluded.scope,
    description = excluded.description;

insert into public.role_permissions (role_key, permission_key)
select r.role_key, p.permission_key
from public.roles r
cross join public.permissions p
where r.role_key in ('org_owner', 'org_admin', 'workspace_owner', 'workspace_admin')
  and r.scope = p.scope
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
values ('org_member', 'organization.read')
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('social_media_manager', 'workspace.read'),
  ('social_media_manager', 'workspace.manage'),
  ('social_media_manager', 'brand_profiles.read'),
  ('social_media_manager', 'brand_profiles.manage'),
  ('social_media_manager', 'clients.read'),
  ('social_media_manager', 'clients.manage'),
  ('social_media_manager', 'assets.read'),
  ('social_media_manager', 'assets.manage'),
  ('social_media_manager', 'content.read'),
  ('social_media_manager', 'content.manage'),
  ('social_media_manager', 'campaigns.read'),
  ('social_media_manager', 'campaigns.manage'),
  ('social_media_manager', 'analytics.read'),
  ('social_media_manager', 'analytics.manage'),
  ('social_media_manager', 'settings.read'),
  ('social_media_manager', 'settings.manage'),
  ('content_creator', 'workspace.read'),
  ('content_creator', 'brand_profiles.read'),
  ('content_creator', 'clients.read'),
  ('content_creator', 'assets.read'),
  ('content_creator', 'content.read'),
  ('content_creator', 'content.manage'),
  ('content_creator', 'campaigns.read'),
  ('content_creator', 'analytics.read'),
  ('designer', 'workspace.read'),
  ('designer', 'brand_profiles.read'),
  ('designer', 'brand_profiles.manage'),
  ('designer', 'clients.read'),
  ('designer', 'assets.read'),
  ('designer', 'assets.manage'),
  ('designer', 'content.read'),
  ('content_approver', 'workspace.read'),
  ('content_approver', 'brand_profiles.read'),
  ('content_approver', 'clients.read'),
  ('content_approver', 'content.read'),
  ('content_approver', 'content.manage'),
  ('content_approver', 'campaigns.read'),
  ('content_approver', 'analytics.read'),
  ('analyst', 'workspace.read'),
  ('analyst', 'brand_profiles.read'),
  ('analyst', 'clients.read'),
  ('analyst', 'content.read'),
  ('analyst', 'campaigns.read'),
  ('analyst', 'analytics.read'),
  ('viewer', 'workspace.read'),
  ('viewer', 'brand_profiles.read'),
  ('viewer', 'clients.read'),
  ('viewer', 'assets.read'),
  ('viewer', 'content.read'),
  ('viewer', 'campaigns.read'),
  ('viewer', 'analytics.read'),
  ('viewer', 'settings.read'),
  ('client', 'workspace.read'),
  ('client', 'brand_profiles.read'),
  ('client', 'clients.read'),
  ('client', 'content.read'),
  ('client', 'analytics.read')
on conflict do nothing;

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role_key text not null references public.roles(role_key),
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

alter table public.clients add column if not exists workspace_id uuid;
alter table public.brand_assets add column if not exists workspace_id uuid;
alter table public.generated_content add column if not exists workspace_id uuid;
alter table public.campaign_analytics add column if not exists workspace_id uuid;

do $$
declare
  v_owner uuid;
  v_organization uuid;
  v_workspace uuid;
begin
  select am.user_id
  into v_owner
  from public.agency_members am
  order by am.created_at, am.user_id
  limit 1;

  insert into public.organizations (name, slug, owner_user_id)
  values ('BrandSpire Agency', 'brandspire-agency', v_owner)
  on conflict (slug) do update
    set owner_user_id = coalesce(public.organizations.owner_user_id, excluded.owner_user_id)
  returning id into v_organization;

  if v_organization is null then
    select id into v_organization
    from public.organizations
    where slug = 'brandspire-agency';
  end if;

  insert into public.workspaces (organization_id, name, slug, created_by)
  values (v_organization, 'Main Workspace', 'main-workspace', v_owner)
  on conflict (organization_id, slug) do nothing;

  select w.id into v_workspace
  from public.workspaces w
  where w.organization_id = v_organization
    and w.slug = 'main-workspace';

  insert into public.user_profiles (user_id, email, display_name)
  select au.id,
         coalesce(au.email, ''),
         coalesce(nullif(au.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(au.email, ''), '@', 1))
  from auth.users au
  join public.agency_members am on am.user_id = au.id
  on conflict (user_id) do nothing;

  insert into public.organization_memberships (organization_id, user_id, role_key)
  select v_organization,
         am.user_id,
         case when am.user_id = v_owner then 'org_owner' else 'org_admin' end
  from public.agency_members am
  on conflict (organization_id, user_id) do nothing;

  insert into public.workspace_memberships (workspace_id, user_id, role_key)
  select v_workspace,
         am.user_id,
         case when am.user_id = v_owner then 'workspace_owner' else 'workspace_admin' end
  from public.agency_members am
  on conflict (workspace_id, user_id) do nothing;

  update public.clients
  set workspace_id = v_workspace
  where workspace_id is null;

  update public.brand_assets asset
  set workspace_id = client.workspace_id
  from public.clients client
  where asset.client_id = client.id
    and asset.workspace_id is null;

  update public.generated_content content
  set workspace_id = client.workspace_id
  from public.clients client
  where content.client_id = client.id
    and content.workspace_id is null;

  update public.campaign_analytics campaign
  set workspace_id = client.workspace_id
  from public.clients client
  where campaign.client_id = client.id
    and campaign.workspace_id is null;

  insert into public.brand_profiles (
    workspace_id,
    name,
    company_description,
    created_by
  )
  values (
    v_workspace,
    'BrandSpire Social AI',
    'Default workspace brand profile. Update this information before using AI content features.',
    v_owner
  )
  on conflict do nothing;

  insert into public.workspace_settings (workspace_id, providers)
  select v_workspace, coalesce(
    (select settings.providers from public.agency_settings settings where settings.id = 1),
    '{}'::jsonb
  )
  on conflict (workspace_id) do nothing;
end
$$;

alter table public.clients alter column workspace_id set not null;
alter table public.brand_assets alter column workspace_id set not null;
alter table public.generated_content alter column workspace_id set not null;
alter table public.campaign_analytics alter column workspace_id set not null;

alter table public.clients
  add constraint clients_workspace_id_fkey
  foreign key (workspace_id) references public.workspaces(id) on delete cascade;

alter table public.clients
  add constraint clients_workspace_id_id_key unique (workspace_id, id);

alter table public.brand_assets drop constraint if exists brand_assets_client_id_fkey;
alter table public.brand_assets
  add constraint brand_assets_workspace_client_fkey
  foreign key (workspace_id, client_id)
  references public.clients(workspace_id, id) on delete cascade;

alter table public.generated_content drop constraint if exists generated_content_client_id_fkey;
alter table public.generated_content
  add constraint generated_content_workspace_client_fkey
  foreign key (workspace_id, client_id)
  references public.clients(workspace_id, id) on delete cascade;

alter table public.campaign_analytics drop constraint if exists campaign_analytics_client_id_fkey;
alter table public.campaign_analytics
  add constraint campaign_analytics_workspace_client_fkey
  foreign key (workspace_id, client_id)
  references public.clients(workspace_id, id) on delete cascade;

create index if not exists organization_memberships_user_idx
  on public.organization_memberships(user_id, status);
create index if not exists workspace_memberships_user_idx
  on public.workspace_memberships(user_id, status);
create index if not exists workspaces_organization_idx
  on public.workspaces(organization_id);
create index if not exists clients_workspace_created_idx
  on public.clients(workspace_id, created_at desc);
create index if not exists brand_assets_workspace_uploaded_idx
  on public.brand_assets(workspace_id, uploaded_at desc);
create index if not exists generated_content_workspace_created_idx
  on public.generated_content(workspace_id, created_at desc);
create index if not exists campaign_analytics_workspace_created_idx
  on public.campaign_analytics(workspace_id, created_at desc);
create index if not exists brand_profiles_workspace_idx
  on public.brand_profiles(workspace_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (user_id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists create_user_profile_after_auth_insert on auth.users;
create trigger create_user_profile_after_auth_insert
  after insert on auth.users
  for each row execute function public.create_user_profile();

drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at before update on public.user_profiles
  for each row execute function public.set_updated_at();
drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
drop trigger if exists workspaces_updated_at on public.workspaces;
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();
drop trigger if exists brand_profiles_updated_at on public.brand_profiles;
create trigger brand_profiles_updated_at before update on public.brand_profiles
  for each row execute function public.set_updated_at();
drop trigger if exists workspace_settings_updated_at on public.workspace_settings;
create trigger workspace_settings_updated_at before update on public.workspace_settings
  for each row execute function public.set_updated_at();

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

create or replace function public.has_organization_permission(
  target_organization_id uuid,
  required_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.role_permissions permission
      on permission.role_key = membership.role_key
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and permission.permission_key = required_permission
  );
$$;

create or replace function public.has_workspace_permission(
  target_workspace_id uuid,
  required_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_memberships membership
    join public.workspaces workspace on workspace.id = membership.workspace_id
    join public.organization_memberships organization_membership
      on organization_membership.organization_id = workspace.organization_id
     and organization_membership.user_id = membership.user_id
    join public.role_permissions permission
      on permission.role_key = membership.role_key
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and organization_membership.status = 'active'
      and permission.permission_key = required_permission
  );
$$;

create or replace function public.get_my_workspaces()
returns table (
  workspace_id uuid,
  organization_id uuid,
  organization_name text,
  workspace_name text,
  role_key text
)
language sql
stable
security definer
set search_path = ''
as $$
  select workspace.id,
         organization.id,
         organization.name,
         workspace.name,
         membership.role_key
  from public.workspace_memberships membership
  join public.workspaces workspace on workspace.id = membership.workspace_id
  join public.organizations organization on organization.id = workspace.organization_id
  join public.organization_memberships organization_membership
    on organization_membership.organization_id = workspace.organization_id
   and organization_membership.user_id = membership.user_id
  where membership.user_id = (select auth.uid())
    and membership.status = 'active'
    and organization_membership.status = 'active'
  order by organization.name, workspace.name;
$$;

create or replace function public.create_organization(
  p_organization_name text,
  p_workspace_name text default 'Main Workspace'
)
returns table (organization_id uuid, workspace_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_workspace_id uuid;
  v_organization_name text := trim(coalesce(p_organization_name, ''));
  v_workspace_name text := trim(coalesce(p_workspace_name, 'Main Workspace'));
  v_organization_slug text;
  v_workspace_slug text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to create an organization.' using errcode = '42501';
  end if;
  if length(v_organization_name) < 2 or length(v_organization_name) > 100 then
    raise exception 'Organization name must contain between 2 and 100 characters.' using errcode = '22023';
  end if;
  if length(v_workspace_name) < 2 or length(v_workspace_name) > 100 then
    raise exception 'Workspace name must contain between 2 and 100 characters.' using errcode = '22023';
  end if;

  v_organization_slug := regexp_replace(lower(v_organization_name), '[^a-z0-9]+', '-', 'g');
  v_organization_slug := coalesce(nullif(trim(both '-' from v_organization_slug), ''), 'organization')
    || '-' || left(gen_random_uuid()::text, 8);
  v_workspace_slug := regexp_replace(lower(v_workspace_name), '[^a-z0-9]+', '-', 'g');
  v_workspace_slug := coalesce(nullif(trim(both '-' from v_workspace_slug), ''), 'workspace')
    || '-' || left(gen_random_uuid()::text, 8);

  insert into public.organizations (name, slug, owner_user_id)
  values (v_organization_name, v_organization_slug, v_user_id)
  returning id into v_organization_id;

  insert into public.organization_memberships (organization_id, user_id, role_key)
  values (v_organization_id, v_user_id, 'org_owner');

  insert into public.workspaces (organization_id, name, slug, created_by)
  values (v_organization_id, v_workspace_name, v_workspace_slug, v_user_id)
  returning id into v_workspace_id;

  insert into public.workspace_memberships (workspace_id, user_id, role_key)
  values (v_workspace_id, v_user_id, 'workspace_owner');

  insert into public.brand_profiles (workspace_id, name, created_by)
  values (v_workspace_id, v_organization_name, v_user_id);

  insert into public.workspace_settings (workspace_id, providers, updated_by)
  values (v_workspace_id, '{}'::jsonb, v_user_id);

  return query select v_organization_id, v_workspace_id;
end;
$$;

create or replace function public.create_workspace(
  p_organization_id uuid,
  p_workspace_name text,
  p_timezone text default 'UTC'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_workspace_id uuid;
  v_workspace_name text := trim(coalesce(p_workspace_name, ''));
  v_timezone text := coalesce(nullif(trim(p_timezone), ''), 'UTC');
  v_workspace_slug text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to create a workspace.' using errcode = '42501';
  end if;
  if not public.has_organization_permission(p_organization_id, 'workspace.create') then
    raise exception 'You do not have permission to create workspaces in this organization.' using errcode = '42501';
  end if;
  if length(v_workspace_name) < 2 or length(v_workspace_name) > 100 then
    raise exception 'Workspace name must contain between 2 and 100 characters.' using errcode = '22023';
  end if;
  if not exists (select 1 from pg_timezone_names where name = v_timezone) then
    raise exception 'Timezone must be a valid IANA timezone.' using errcode = '22023';
  end if;

  v_workspace_slug := regexp_replace(lower(v_workspace_name), '[^a-z0-9]+', '-', 'g');
  v_workspace_slug := coalesce(nullif(trim(both '-' from v_workspace_slug), ''), 'workspace')
    || '-' || left(gen_random_uuid()::text, 8);

  insert into public.workspaces (organization_id, name, slug, timezone, created_by)
  values (p_organization_id, v_workspace_name, v_workspace_slug, v_timezone, v_user_id)
  returning id into v_workspace_id;

  insert into public.workspace_memberships (workspace_id, user_id, role_key)
  select v_workspace_id,
         membership.user_id,
         case membership.role_key
           when 'org_owner' then 'workspace_owner'
           else 'workspace_admin'
         end
  from public.organization_memberships membership
  where membership.organization_id = p_organization_id
    and membership.status = 'active'
    and membership.role_key in ('org_owner', 'org_admin')
  on conflict (workspace_id, user_id) do nothing;

  insert into public.brand_profiles (workspace_id, name, created_by)
  select v_workspace_id, organization.name, v_user_id
  from public.organizations organization
  where organization.id = p_organization_id;

  insert into public.workspace_settings (workspace_id, providers, updated_by)
  values (v_workspace_id, '{}'::jsonb, v_user_id);

  return v_workspace_id;
end;
$$;

create or replace function public.accept_my_workspace_invitations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_invitation record;
  v_accepted integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to accept an invitation.' using errcode = '42501';
  end if;

  select lower(auth_user.email)
  into v_email
  from auth.users auth_user
  where auth_user.id = v_user_id
    and auth_user.email_confirmed_at is not null;
  if v_email is null then
    raise exception 'Confirm your email before accepting workspace invitations.' using errcode = '42501';
  end if;

  for v_invitation in
    select invitation.id,
           invitation.workspace_id,
           invitation.role_key,
           workspace.organization_id
    from public.workspace_invitations invitation
    join public.workspaces workspace on workspace.id = invitation.workspace_id
    where lower(invitation.email) = v_email
      and invitation.status = 'pending'
      and invitation.expires_at > now()
    for update of invitation
  loop
    insert into public.organization_memberships (organization_id, user_id, role_key)
    values (v_invitation.organization_id, v_user_id, 'org_member')
    on conflict (organization_id, user_id) do nothing;

    insert into public.workspace_memberships (workspace_id, user_id, role_key)
    values (v_invitation.workspace_id, v_user_id, v_invitation.role_key)
    on conflict (workspace_id, user_id) do update
      set role_key = excluded.role_key,
          status = 'active';

    update public.workspace_invitations
    set status = 'accepted'
    where id = v_invitation.id;
    v_accepted := v_accepted + 1;
  end loop;

  return v_accepted;
end;
$$;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.has_organization_permission(uuid, text) from public;
revoke all on function public.has_workspace_permission(uuid, text) from public;
revoke all on function public.get_my_workspaces() from public;
revoke all on function public.create_organization(text, text) from public;
revoke all on function public.create_workspace(uuid, text, text) from public;
revoke all on function public.accept_my_workspace_invitations() from public;
revoke all on function public.create_user_profile() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.has_organization_permission(uuid, text) to authenticated;
grant execute on function public.has_workspace_permission(uuid, text) to authenticated;
grant execute on function public.get_my_workspaces() to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.create_workspace(uuid, text, text) to authenticated;
grant execute on function public.accept_my_workspace_invitations() to authenticated;

alter table public.user_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.workspace_settings enable row level security;

drop policy if exists "Authenticated agency members can manage clients" on public.clients;
drop policy if exists "Authenticated agency members can manage brand assets" on public.brand_assets;
drop policy if exists "Authenticated agency members can manage generated content" on public.generated_content;
drop policy if exists "Authenticated agency members can manage campaign analytics" on public.campaign_analytics;
drop policy if exists "Authenticated agency members can manage agency settings" on public.agency_settings;
drop policy if exists "Agency members can read their own membership" on public.agency_members;

drop policy if exists "Authenticated agency members can read brand asset files" on storage.objects;
drop policy if exists "Authenticated agency members can upload brand asset files" on storage.objects;
drop policy if exists "Authenticated agency members can update brand asset files" on storage.objects;
drop policy if exists "Authenticated agency members can delete brand asset files" on storage.objects;

drop function if exists public.is_agency_member();

create policy "Users can read their own profile"
  on public.user_profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can update their own profile"
  on public.user_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Organization members can read their organization"
  on public.organizations for select to authenticated
  using ((select public.is_organization_member(id)));
create policy "Organization administrators can update their organization"
  on public.organizations for update to authenticated
  using ((select public.has_organization_permission(id, 'organization.update')))
  with check ((select public.has_organization_permission(id, 'organization.update')));

create policy "Users can read their organization memberships"
  on public.organization_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_organization_permission(organization_id, 'organization.manage_members'))
  );

create policy "Workspace members can read their workspaces"
  on public.workspaces for select to authenticated
  using ((select public.has_workspace_permission(id, 'workspace.read')));
create policy "Workspace administrators can update workspaces"
  on public.workspaces for update to authenticated
  using ((select public.has_workspace_permission(id, 'workspace.manage')))
  with check ((select public.has_workspace_permission(id, 'workspace.manage')));

create policy "Users can read their workspace memberships"
  on public.workspace_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_workspace_permission(workspace_id, 'workspace.manage_members'))
  );

create policy "Workspace members can read brand profiles"
  on public.brand_profiles for select to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'brand_profiles.read')));
create policy "Workspace brand managers can create brand profiles"
  on public.brand_profiles for insert to authenticated
  with check ((select public.has_workspace_permission(workspace_id, 'brand_profiles.manage')));
create policy "Workspace brand managers can update brand profiles"
  on public.brand_profiles for update to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'brand_profiles.manage')))
  with check ((select public.has_workspace_permission(workspace_id, 'brand_profiles.manage')));
create policy "Workspace brand managers can delete brand profiles"
  on public.brand_profiles for delete to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'brand_profiles.manage')));

create policy "Workspace members can read workspace settings"
  on public.workspace_settings for select to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'settings.read')));
create policy "Workspace administrators can create workspace settings"
  on public.workspace_settings for insert to authenticated
  with check ((select public.has_workspace_permission(workspace_id, 'settings.manage')));
create policy "Workspace administrators can update workspace settings"
  on public.workspace_settings for update to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'settings.manage')))
  with check ((select public.has_workspace_permission(workspace_id, 'settings.manage')));

create policy "Authenticated users can read role definitions"
  on public.roles for select to authenticated using (true);
create policy "Authenticated users can read permission definitions"
  on public.permissions for select to authenticated using (true);
create policy "Authenticated users can read role permissions"
  on public.role_permissions for select to authenticated using (true);

create policy "Workspace members can read invitations"
  on public.workspace_invitations for select to authenticated
  using (
    (select public.has_workspace_permission(workspace_id, 'workspace.manage_members'))
    or lower(email) = lower((select auth.jwt() ->> 'email'))
  );

create policy "Workspace members can read clients"
  on public.clients for select to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'clients.read')));
create policy "Workspace managers can create clients"
  on public.clients for insert to authenticated
  with check ((select public.has_workspace_permission(workspace_id, 'clients.manage')));
create policy "Workspace managers can update clients"
  on public.clients for update to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'clients.manage')))
  with check ((select public.has_workspace_permission(workspace_id, 'clients.manage')));
create policy "Workspace managers can delete clients"
  on public.clients for delete to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'clients.manage')));

create policy "Workspace members can read brand assets"
  on public.brand_assets for select to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'assets.read')));
create policy "Workspace members can create brand assets"
  on public.brand_assets for insert to authenticated
  with check ((select public.has_workspace_permission(workspace_id, 'assets.manage')));
create policy "Workspace members can update brand assets"
  on public.brand_assets for update to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'assets.manage')))
  with check ((select public.has_workspace_permission(workspace_id, 'assets.manage')));
create policy "Workspace members can delete brand assets"
  on public.brand_assets for delete to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'assets.manage')));

create policy "Workspace members can read generated content"
  on public.generated_content for select to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'content.read')));
create policy "Workspace members can create generated content"
  on public.generated_content for insert to authenticated
  with check ((select public.has_workspace_permission(workspace_id, 'content.manage')));
create policy "Workspace members can update generated content"
  on public.generated_content for update to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'content.manage')))
  with check ((select public.has_workspace_permission(workspace_id, 'content.manage')));
create policy "Workspace managers can delete generated content"
  on public.generated_content for delete to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'workspace.manage')));

create policy "Workspace members can read campaign analytics"
  on public.campaign_analytics for select to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'analytics.read')));
create policy "Workspace managers can create campaign analytics"
  on public.campaign_analytics for insert to authenticated
  with check ((select public.has_workspace_permission(workspace_id, 'analytics.manage')));
create policy "Workspace managers can update campaign analytics"
  on public.campaign_analytics for update to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'analytics.manage')))
  with check ((select public.has_workspace_permission(workspace_id, 'analytics.manage')));
create policy "Workspace managers can delete campaign analytics"
  on public.campaign_analytics for delete to authenticated
  using ((select public.has_workspace_permission(workspace_id, 'analytics.manage')));

revoke all on public.agency_members from authenticated;
revoke all on public.agency_settings from authenticated;
grant select on public.user_profiles to authenticated;
grant update (display_name, avatar_url) on public.user_profiles to authenticated;
grant select on public.roles, public.permissions, public.role_permissions to authenticated;
grant select on public.organizations, public.organization_memberships, public.workspaces,
  public.workspace_memberships, public.workspace_invitations to authenticated;
grant all on public.workspace_invitations to service_role;
grant update on public.organizations, public.workspaces to authenticated;
grant select, insert, update, delete on public.brand_profiles, public.workspace_settings,
  public.clients, public.brand_assets, public.generated_content, public.campaign_analytics
to authenticated;

create policy "Workspace members can read brand asset files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'agency-assets'
    and (
      exists (
        select 1 from public.workspaces workspace
        where workspace.id::text = split_part(storage.objects.name, '/', 1)
          and (select public.has_workspace_permission(workspace.id, 'assets.read'))
      )
      or exists (
        select 1 from public.brand_assets asset
        where asset.storage_path = storage.objects.name
          and (select public.has_workspace_permission(asset.workspace_id, 'assets.read'))
      )
      or exists (
        select 1 from public.clients client
        where client.logo_storage_path = storage.objects.name
          and (select public.has_workspace_permission(client.workspace_id, 'assets.read'))
      )
      or exists (
        select 1 from public.brand_profiles profile
        where profile.logo_storage_path = storage.objects.name
          and (select public.has_workspace_permission(profile.workspace_id, 'brand_profiles.read'))
      )
    )
  );

create policy "Workspace members can upload brand asset files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'agency-assets'
    and exists (
      select 1 from public.workspaces workspace
      where workspace.id::text = split_part(storage.objects.name, '/', 1)
        and (select public.has_workspace_permission(workspace.id, 'assets.manage'))
    )
  );

create policy "Workspace members can update brand asset files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'agency-assets'
    and exists (
      select 1 from public.workspaces workspace
      where workspace.id::text = split_part(storage.objects.name, '/', 1)
        and (select public.has_workspace_permission(workspace.id, 'assets.manage'))
    )
  )
  with check (
    bucket_id = 'agency-assets'
    and exists (
      select 1 from public.workspaces workspace
      where workspace.id::text = split_part(storage.objects.name, '/', 1)
        and (select public.has_workspace_permission(workspace.id, 'assets.manage'))
    )
  );

create policy "Workspace members can delete brand asset files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'agency-assets'
    and (
      exists (
        select 1 from public.workspaces workspace
        where workspace.id::text = split_part(storage.objects.name, '/', 1)
          and (select public.has_workspace_permission(workspace.id, 'assets.manage'))
      )
      or (
        split_part(storage.objects.name, '/', 1) = (select auth.uid())::text
        and exists (
          select 1 from public.workspace_memberships membership
          where membership.user_id = (select auth.uid())
            and membership.status = 'active'
            and (select public.has_workspace_permission(membership.workspace_id, 'assets.manage'))
        )
      )
    )
  );

do $$
declare
  v_workspace_id uuid;
  v_default_providers jsonb := '{
    "text": {
      "sequence": ["Gemini", "Groq", "OpenRouter", "Cloudflare AI"],
      "active": "Gemini",
      "limitsReached": {"Gemini": false, "Groq": false, "OpenRouter": false, "Cloudflare AI": false}
    },
    "image": {
      "sequence": ["Clipdrop", "Pixian", "Cloudflare AI"],
      "active": "Clipdrop",
      "limitsReached": {"Clipdrop": false, "Pixian": false, "Cloudflare AI": false}
    },
    "video": {
      "sequence": ["Creatomate", "Shotstack", "JSON2Video"],
      "active": "Creatomate",
      "limitsReached": {"Creatomate": false, "Shotstack": false, "JSON2Video": false}
    }
  }'::jsonb;
begin
  select workspace.id into v_workspace_id
  from public.workspaces workspace
  join public.organizations organization on organization.id = workspace.organization_id
  where organization.slug = 'brandspire-agency'
    and workspace.slug = 'main-workspace';

  update public.brand_profiles
  set company_description = case
        when company_description = '' then 'Default workspace brand profile. Update this information before using AI content features.'
        else company_description
      end
  where workspace_id = v_workspace_id
    and name = 'BrandSpire Social AI';

  update public.workspace_settings
  set providers = case when providers = '{}'::jsonb then v_default_providers else providers end
  where workspace_id = v_workspace_id;

  insert into public.workspace_settings (workspace_id, providers)
  values (v_workspace_id, v_default_providers)
  on conflict (workspace_id) do nothing;
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations',
    'organization_memberships',
    'workspaces',
    'workspace_memberships',
    'brand_profiles',
    'workspace_settings',
    'clients',
    'brand_assets',
    'generated_content',
    'campaign_analytics'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;
