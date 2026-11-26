-- Structural checks only. All 14 should be true after a successful migration.
select
 to_regclass('public.publishing_jobs') is not null as table_exists,
 coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.publishing_jobs')),false) as rls_enabled,
 has_table_privilege('authenticated','public.publishing_jobs','SELECT') as authenticated_read,
 not has_table_privilege('authenticated','public.publishing_jobs','INSERT,UPDATE,DELETE,TRUNCATE') as browser_write_blocked,
 not has_table_privilege('anon','public.publishing_jobs','SELECT,INSERT,UPDATE,DELETE') as anon_access_blocked,
 exists(select 1 from pg_policies where schemaname='public' and tablename='publishing_jobs' and policyname='Scoped publishing job reads' and cmd='SELECT') as scoped_read_policy,
 coalesce((select indisunique and indisvalid from pg_index where indexrelid=to_regclass('public.publishing_jobs_one_active_idx')),false) as one_active_index,
 exists(select 1 from pg_constraint where conrelid=to_regclass('public.publishing_jobs') and contype='u' and pg_get_constraintdef(oid)='UNIQUE (content_id, plan_revision)') as unique_revision,
 exists(select 1 from pg_trigger where tgrelid=to_regclass('public.post_schedule_plans') and tgname='phase4a_invalidate_jobs' and tgenabled in ('O','A') and not tgisinternal) as calendar_invalidation,
 has_function_privilege('authenticated','public.stage_publishing_jobs(uuid,uuid,jsonb)','EXECUTE') as stage_rpc,
 not has_function_privilege('anon','public.stage_publishing_jobs(uuid,uuid,jsonb)','EXECUTE') as anon_stage_blocked,
 has_function_privilege('authenticated','public.set_publishing_job_pause(uuid,uuid,jsonb,boolean)','EXECUTE') as pause_rpc,
 not has_function_privilege('anon','public.set_publishing_job_pause(uuid,uuid,jsonb,boolean)','EXECUTE') as anon_pause_blocked,
 not exists(select 1 from public.publishing_jobs where status not in ('held','paused','superseded','cancelled')) as no_executable_jobs;
