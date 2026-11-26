-- Phase 3B: planning only. No external publishing, worker, or credentials required.
begin;
insert into public.permissions(permission_key,scope,description) values ('content.schedule','workspace','Plan, reschedule and cancel approved social posts.') on conflict(permission_key) do nothing;
insert into public.role_permissions(role_key,permission_key) values ('workspace_owner','content.schedule'),('workspace_admin','content.schedule'),('social_media_manager','content.schedule') on conflict do nothing;
-- Reuse a valid, non-partial, immediate unique index on the exact FK columns.
-- PostgreSQL foreign keys can reference such an index even if it is not a named constraint.
do $$
begin
 if not exists (
  select 1 from pg_catalog.pg_index i
  where i.indrelid = 'public.generated_content'::regclass
    and i.indisunique and i.indisvalid and i.indisready and i.indimmediate
    and i.indpred is null and i.indexprs is null
    and i.indnkeyatts = 3
    and (select array_agg(a.attname::text order by k.ord)
         from unnest(i.indkey) with ordinality as k(attnum, ord)
         join pg_catalog.pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.attnum
         where k.ord <= i.indnkeyatts)
        = array['workspace_id','client_id','id']::text[]
 ) then
  -- A name collision alone is not proof of the required uniqueness.
  -- Use a separate name without deleting any existing relation.
  alter table public.generated_content add constraint phase3b_generated_content_scope_key unique(workspace_id,client_id,id);
 end if;
end;
$$;
create table if not exists public.post_schedule_plans (
 content_id uuid primary key,
 workspace_id uuid not null,
 client_id uuid not null,
 planned_at timestamptz not null,
 timezone text not null,
 delivery_kind text not null check(delivery_kind in ('post','reel','video','short')),
 status text not null default 'planned' check(status in ('planned','cancelled')),
 revision integer not null default 1 check(revision>0),
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now(),
 foreign key(workspace_id,client_id,content_id) references public.generated_content(workspace_id,client_id,id) on delete restrict
);
-- IF NOT EXISTS does not validate an existing schema. Refuse incompatible tables.
do $$
begin
 if not exists (select 1 from pg_catalog.pg_class where oid='public.post_schedule_plans'::regclass and relkind='r') then
  raise exception 'Existing post_schedule_plans is not an ordinary table; inspect before migrating';
 end if;
 if exists (
  select 1 from (values
   ('content_id','uuid',true), ('workspace_id','uuid',true), ('client_id','uuid',true),
   ('planned_at','timestamp with time zone',true), ('timezone','text',true),
   ('delivery_kind','text',true), ('status','text',true), ('revision','integer',true),
   ('updated_by','uuid',false), ('updated_at','timestamp with time zone',true)
  ) as expected(col,typ,required)
  left join pg_catalog.pg_attribute a on a.attrelid='public.post_schedule_plans'::regclass
   and a.attname::text=expected.col and a.attnum>0 and not a.attisdropped
  where a.attnum is null or pg_catalog.format_type(a.atttypid,a.atttypmod)<>expected.typ
   or a.attnotnull<>expected.required
 ) then
  raise exception 'Existing post_schedule_plans has incompatible columns; inspect before migrating';
 end if;
 if not exists (
  select 1 from pg_catalog.pg_constraint c
  where c.conrelid='public.post_schedule_plans'::regclass and c.contype='p'
   and c.conkey=array[(select attnum from pg_catalog.pg_attribute where attrelid=c.conrelid and attname='content_id')]
 ) or not exists (
  select 1 from pg_catalog.pg_constraint c
  where c.conrelid='public.post_schedule_plans'::regclass and c.contype='f' and c.convalidated
   and c.confrelid='public.generated_content'::regclass and c.confdeltype='r'
   and (select array_agg(a.attname::text order by k.ord) from unnest(c.conkey) with ordinality k(attnum,ord) join pg_catalog.pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum)=array['workspace_id','client_id','content_id']::text[]
   and (select array_agg(a.attname::text order by k.ord) from unnest(c.confkey) with ordinality k(attnum,ord) join pg_catalog.pg_attribute a on a.attrelid=c.confrelid and a.attnum=k.attnum)=array['workspace_id','client_id','id']::text[]
 ) then
  raise exception 'Existing post_schedule_plans is missing the expected primary key or scoped foreign key; inspect before migrating';
 end if;
end;
$$;
create index if not exists post_schedule_plans_scope_time_idx on public.post_schedule_plans(workspace_id,client_id,planned_at);
alter table public.post_schedule_plans enable row level security;
revoke all on public.post_schedule_plans from public,anon,authenticated;
grant select on public.post_schedule_plans to authenticated;
drop policy if exists "Scoped schedule plan reads" on public.post_schedule_plans;
create policy "Scoped schedule plan reads" on public.post_schedule_plans for select to authenticated using ((select public.has_workspace_permission(workspace_id,'content.read')) and (select public.has_client_scope(workspace_id,client_id)));

create or replace function public.save_schedule_plans(p_workspace_id uuid,p_client_id uuid,p_items jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; cid uuid; at_time timestamptz; tz text; kind text; expected integer; g public.generated_content%rowtype; existing public.post_schedule_plans%rowtype; seen uuid[]:=array[]::uuid[];
begin
 if auth.uid() is null or not public.has_workspace_permission(p_workspace_id,'content.schedule') or not public.has_client_scope(p_workspace_id,p_client_id) then raise exception 'Scheduling permission required' using errcode='42501'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Invalid batch'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Select 1 to 100 approved variants'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('calendar:'||p_workspace_id::text||':'||p_client_id::text,0));
 for item in select value from jsonb_array_elements(p_items) loop
  cid:=(item->>'contentId')::uuid; tz:=item->>'timezone'; kind:=item->>'kind'; expected:=(item->>'revision')::integer;
  if cid is null or cid=any(seen) or expected is null or expected<0 then raise exception 'Invalid or duplicate content ID / revision'; end if;
  seen:=array_append(seen,cid);
  if coalesce(item->>'plannedAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$' then raise exception 'Expected UTC timestamp'; end if;
  at_time:=(item->>'plannedAt')::timestamptz;
  if tz is null or not exists(select 1 from pg_catalog.pg_timezone_names where name=tz) then raise exception 'Invalid IANA timezone'; end if;
  select * into g from public.generated_content where id=cid and workspace_id=p_workspace_id and client_id=p_client_id and type='manual_post' and status='approved' for update;
  if not found then raise exception 'Only approved manual posts for this client can be planned'; end if;
  if kind is null or not coalesce(case g.meta->>'platform'
   when 'facebook' then case when g.meta->>'format'='video' then kind in ('video','reel') else kind='post' and g.meta->>'format' in ('text','image') end
   when 'instagram' then case when g.meta->>'format'='video' then kind='reel' else kind='post' and g.meta->>'format'='image' end
   when 'youtube' then g.meta->>'format'='video' and kind in ('video','short')
   when 'google_business' then kind='post' and g.meta->>'format' in ('text','image')
   else false end,false) then raise exception 'Delivery format does not match draft'; end if;
  select * into existing from public.post_schedule_plans where content_id=cid for update;
  if found then
   -- Safe replay of an identical save, even after a lost response.
   if existing.status='planned' and existing.planned_at=at_time and existing.timezone=tz and existing.delivery_kind=kind then continue; end if;
   if existing.revision<>expected then raise exception 'Plan changed; refresh calendar before retrying' using errcode='40001'; end if;
  elsif expected<>0 then raise exception 'Plan changed; refresh calendar before retrying' using errcode='40001'; end if;
  if at_time<=now() then raise exception 'Choose a future time'; end if;
  insert into public.post_schedule_plans(content_id,workspace_id,client_id,planned_at,timezone,delivery_kind,updated_by)
  values(cid,p_workspace_id,p_client_id,at_time,tz,kind,auth.uid())
  on conflict(content_id) do update set planned_at=excluded.planned_at,timezone=excluded.timezone,delivery_kind=excluded.delivery_kind,status='planned',revision=post_schedule_plans.revision+1,updated_by=auth.uid(),updated_at=now();
 end loop;
 return cardinality(seen);
end; $$;
revoke all on function public.save_schedule_plans(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_schedule_plans(uuid,uuid,jsonb) to authenticated;

create or replace function public.cancel_schedule_plans(p_workspace_id uuid,p_client_id uuid,p_items jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; cid uuid; expected integer; existing public.post_schedule_plans%rowtype; seen uuid[]:=array[]::uuid[];
begin
 if auth.uid() is null or not public.has_workspace_permission(p_workspace_id,'content.schedule') or not public.has_client_scope(p_workspace_id,p_client_id) then raise exception 'Scheduling permission required' using errcode='42501'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Invalid batch'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Select 1 to 100 plans'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('calendar:'||p_workspace_id::text||':'||p_client_id::text,0));
 for item in select value from jsonb_array_elements(p_items) loop
  cid:=(item->>'contentId')::uuid; expected:=(item->>'revision')::integer;
  if cid is null or cid=any(seen) or expected is null then raise exception 'Invalid or duplicate cancellation'; end if;
  seen:=array_append(seen,cid);
  select * into existing from public.post_schedule_plans where content_id=cid and workspace_id=p_workspace_id and client_id=p_client_id for update;
  if not found then raise exception 'Plan not found'; end if;
  if existing.status='cancelled' and existing.revision=expected+1 then continue; end if;
  if existing.status<>'planned' or existing.revision<>expected then raise exception 'Plan changed; refresh calendar' using errcode='40001'; end if;
  update public.post_schedule_plans set status='cancelled',revision=revision+1,updated_by=auth.uid(),updated_at=now() where content_id=cid;
 end loop;
 return cardinality(seen);
end; $$;
revoke all on function public.cancel_schedule_plans(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.cancel_schedule_plans(uuid,uuid,jsonb) to authenticated;
commit;
