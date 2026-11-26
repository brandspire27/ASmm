-- Phase 4A: durable, explicitly staged publishing intents. No dispatch or API calls.
-- A later migration must introduce account binding and a verified worker state machine.
begin;
create table public.publishing_jobs (
 id uuid primary key default gen_random_uuid(),
 content_id uuid not null references public.post_schedule_plans(content_id) on delete restrict,
 workspace_id uuid not null,
 client_id uuid not null,
 plan_revision integer not null check (plan_revision > 0),
 planned_at timestamptz not null,
 timezone text not null,
 delivery_kind text not null check (delivery_kind in ('post','reel','video','short')),
 platform text not null check (platform in ('facebook','instagram','youtube','google_business')),
 status text not null default 'held' check (status in ('held','paused','superseded','cancelled')),
 staged_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(content_id,plan_revision),
 foreign key(workspace_id,client_id,content_id) references public.generated_content(workspace_id,client_id,id) on delete restrict
);
create index publishing_jobs_scope_time_idx on public.publishing_jobs(workspace_id,client_id,planned_at,id);
create unique index publishing_jobs_one_active_idx on public.publishing_jobs(content_id) where status in ('held','paused');
alter table public.publishing_jobs enable row level security;
revoke all on public.publishing_jobs from public,anon,authenticated;
grant select on public.publishing_jobs to authenticated;
create policy "Scoped publishing job reads" on public.publishing_jobs for select to authenticated using (
 (select public.has_workspace_permission(workspace_id,'content.read')) and
 (select public.has_client_scope(workspace_id,client_id))
);

-- Calendar changes invalidate the old intent. Never automatically stage a new revision.
create function public.invalidate_publishing_jobs_on_plan_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status='cancelled' or new.revision<>old.revision or new.planned_at<>old.planned_at or new.timezone<>old.timezone or new.delivery_kind<>old.delivery_kind then
  update public.publishing_jobs set status=case when new.status='cancelled' then 'cancelled' else 'superseded' end,updated_at=now()
   where content_id=old.content_id and status in ('held','paused');
 end if;
 return new;
end; $$;
revoke all on function public.invalidate_publishing_jobs_on_plan_change() from public,anon,authenticated;
create trigger phase4a_invalidate_jobs after update on public.post_schedule_plans for each row execute function public.invalidate_publishing_jobs_on_plan_change();

-- Atomic 1–100 item batch; same lock namespace as Phase 3B calendar writes.
create function public.stage_publishing_jobs(p_workspace_id uuid,p_client_id uuid,p_items jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; cid uuid; expected integer; p public.post_schedule_plans%rowtype; j public.publishing_jobs%rowtype; platform_name text; seen uuid[]:=array[]::uuid[];
begin
 if auth.uid() is null or not coalesce(public.has_workspace_permission(p_workspace_id,'content.schedule'),false) or not coalesce(public.has_client_scope(p_workspace_id,p_client_id),false) then raise exception 'Scheduling permission required' using errcode='42501'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Invalid batch'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Select 1 to 100 plans'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('calendar:'||p_workspace_id::text||':'||p_client_id::text,0));
 for item in select value from jsonb_array_elements(p_items) loop
  cid:=(item->>'contentId')::uuid; expected:=(item->>'revision')::integer;
  if cid is null or cid=any(seen) or expected is null or expected<1 then raise exception 'Invalid or duplicate plan'; end if;
  seen:=array_append(seen,cid);
  select * into p from public.post_schedule_plans where content_id=cid and workspace_id=p_workspace_id and client_id=p_client_id for update;
  if not found or p.status<>'planned' or p.revision<>expected then raise exception 'Plan changed or is unavailable; refresh first' using errcode='40001'; end if;
  select meta->>'platform' into platform_name from public.generated_content where id=cid and workspace_id=p_workspace_id and client_id=p_client_id and type='manual_post' and status='approved';
  if not found or platform_name is null or platform_name not in ('facebook','instagram','youtube','google_business') then raise exception 'Approved platform draft required'; end if;
  select * into j from public.publishing_jobs where content_id=cid and plan_revision=expected;
  if found then
   if j.status in ('held','paused') then continue; end if;
   raise exception 'Job is no longer active; reschedule the plan before staging again';
  end if;
  if p.planned_at<=now() then raise exception 'Past plan cannot be staged; reschedule it first'; end if;
  insert into public.publishing_jobs(content_id,workspace_id,client_id,plan_revision,planned_at,timezone,delivery_kind,platform,staged_by)
   values(cid,p_workspace_id,p_client_id,expected,p.planned_at,p.timezone,p.delivery_kind,platform_name,auth.uid());
 end loop;
 return cardinality(seen);
end; $$;
revoke all on function public.stage_publishing_jobs(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.stage_publishing_jobs(uuid,uuid,jsonb) to authenticated;

-- Held/paused are non-executable in this phase. Pausing never changes the calendar.
create function public.set_publishing_job_pause(p_workspace_id uuid,p_client_id uuid,p_items jsonb,p_paused boolean)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; jid uuid; expected text; desired text; j public.publishing_jobs%rowtype; seen uuid[]:=array[]::uuid[];
begin
 if auth.uid() is null or not coalesce(public.has_workspace_permission(p_workspace_id,'content.schedule'),false) or not coalesce(public.has_client_scope(p_workspace_id,p_client_id),false) then raise exception 'Scheduling permission required' using errcode='42501'; end if;
 if p_paused is null or p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Invalid batch'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Select 1 to 100 jobs'; end if;
 desired:=case when p_paused then 'paused' else 'held' end;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('calendar:'||p_workspace_id::text||':'||p_client_id::text,0));
 for item in select value from jsonb_array_elements(p_items) loop
  jid:=(item->>'jobId')::uuid; expected:=item->>'status';
  if jid is null or jid=any(seen) or expected is null or expected not in ('held','paused') then raise exception 'Invalid or duplicate job'; end if;
  seen:=array_append(seen,jid);
  select * into j from public.publishing_jobs where id=jid and workspace_id=p_workspace_id and client_id=p_client_id for update;
  if not found or j.status not in ('held','paused') then raise exception 'Job no longer active; refresh first'; end if;
  if j.status=desired then continue; end if;
  if j.status<>expected then raise exception 'Job changed; refresh first' using errcode='40001'; end if;
  if not p_paused and j.planned_at<=now() then raise exception 'Past job cannot be resumed; reschedule first'; end if;
  update public.publishing_jobs set status=desired,updated_at=now() where id=jid;
 end loop;
 return cardinality(seen);
end; $$;
revoke all on function public.set_publishing_job_pause(uuid,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.set_publishing_job_pause(uuid,uuid,jsonb,boolean) to authenticated;
commit;
