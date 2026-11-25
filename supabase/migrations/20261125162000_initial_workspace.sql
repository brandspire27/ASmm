create table if not exists public.agency_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_description text not null,
  target_audience text not null,
  brand_colors text[] not null default '{}',
  logo_url text,
  logo_storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  type text not null check (type in ('logo', 'product', 'banner', 'other')),
  url text,
  storage_path text,
  uploaded_at timestamptz not null default now(),
  constraint brand_assets_source_check check (url is not null or storage_path is not null)
);

create table if not exists public.generated_content (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  client_name text not null,
  type text not null check (type in ('strategy', 'caption', 'hashtag', 'ad_script', 'thumbnail', 'video')),
  title text not null,
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'published')),
  provider_used text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_analytics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_name text not null,
  impressions bigint not null default 0 check (impressions >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  conversions bigint not null default 0 check (conversions >= 0),
  spend numeric(14, 2) not null default 0 check (spend >= 0),
  ctr numeric(8, 2) not null default 0,
  conversion_rate numeric(8, 2) not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now()
);

create table if not exists public.agency_settings (
  id integer primary key default 1 check (id = 1),
  providers jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.agency_settings (id, providers)
values (
  1,
  '{
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
  }'::jsonb
)
on conflict (id) do nothing;

alter table public.agency_members enable row level security;
alter table public.clients enable row level security;
alter table public.brand_assets enable row level security;
alter table public.generated_content enable row level security;
alter table public.campaign_analytics enable row level security;
alter table public.agency_settings enable row level security;

create or replace function public.is_agency_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.agency_members
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_agency_member() from public;
grant execute on function public.is_agency_member() to authenticated;
grant usage on schema public to authenticated;
grant select on public.agency_members to authenticated;
grant select, insert, update, delete on
  public.clients,
  public.brand_assets,
  public.generated_content,
  public.campaign_analytics,
  public.agency_settings
to authenticated;

create policy "Agency members can read their own membership"
  on public.agency_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Authenticated agency members can manage clients"
  on public.clients for all to authenticated
  using ((select public.is_agency_member()))
  with check ((select public.is_agency_member()));

create policy "Authenticated agency members can manage brand assets"
  on public.brand_assets for all to authenticated
  using ((select public.is_agency_member()))
  with check ((select public.is_agency_member()));

create policy "Authenticated agency members can manage generated content"
  on public.generated_content for all to authenticated
  using ((select public.is_agency_member()))
  with check ((select public.is_agency_member()));

create policy "Authenticated agency members can manage campaign analytics"
  on public.campaign_analytics for all to authenticated
  using ((select public.is_agency_member()))
  with check ((select public.is_agency_member()));

create policy "Authenticated agency members can manage agency settings"
  on public.agency_settings for all to authenticated
  using ((select public.is_agency_member()))
  with check ((select public.is_agency_member()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agency-assets',
  'agency-assets',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Authenticated agency members can read brand asset files"
  on storage.objects for select to authenticated
  using (bucket_id = 'agency-assets' and (select public.is_agency_member()));

create policy "Authenticated agency members can upload brand asset files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'agency-assets' and (select public.is_agency_member()));

create policy "Authenticated agency members can update brand asset files"
  on storage.objects for update to authenticated
  using (bucket_id = 'agency-assets' and (select public.is_agency_member()))
  with check (bucket_id = 'agency-assets' and (select public.is_agency_member()));

create policy "Authenticated agency members can delete brand asset files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'agency-assets' and (select public.is_agency_member()));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'agency_settings',
    'brand_assets',
    'campaign_analytics',
    'clients',
    'generated_content'
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
