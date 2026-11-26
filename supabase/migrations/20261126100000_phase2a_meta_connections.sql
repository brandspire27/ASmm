-- Server-only OAuth state and credentials. No browser role may read or modify either table.
begin;
create table public.meta_oauth_flows (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 workspace_id uuid not null, client_id uuid not null,
 state_hash text not null unique, expires_at timestamptz not null,
 consumed_at timestamptz, candidates_ciphertext text,
 created_at timestamptz not null default now(),
 foreign key(workspace_id,client_id) references public.clients(workspace_id,id) on delete cascade
);
create index meta_flows_scope_idx on public.meta_oauth_flows(user_id,workspace_id,client_id,expires_at);
create table public.social_accounts (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null, client_id uuid not null,
 platform text not null check(platform in ('facebook','instagram')), external_id text not null,
 account_name text not null, facebook_page_id text not null,
 token_ciphertext text not null, granted_scopes text[] not null, connected_by uuid references auth.users(id) on delete set null,
 authorized_at timestamptz not null default now(),
 foreign key(workspace_id,client_id) references public.clients(workspace_id,id) on delete cascade,
 unique(workspace_id,platform,external_id), unique(workspace_id,client_id,platform,external_id)
);
alter table public.meta_oauth_flows enable row level security;
alter table public.social_accounts enable row level security;
revoke all on public.meta_oauth_flows, public.social_accounts from public, anon, authenticated;
grant select,insert,update,delete on public.meta_oauth_flows, public.social_accounts to service_role;
commit;
