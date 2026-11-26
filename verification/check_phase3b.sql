select
 to_regclass('public.post_schedule_plans') is not null as table_exists,
 (select relrowsecurity from pg_class where oid='public.post_schedule_plans'::regclass) as rls_enabled,
 has_table_privilege('authenticated','public.post_schedule_plans','SELECT') as authenticated_read,
 not has_table_privilege('authenticated','public.post_schedule_plans','INSERT') as direct_insert_blocked,
 not has_table_privilege('authenticated','public.post_schedule_plans','UPDATE') as direct_update_blocked,
 not has_table_privilege('authenticated','public.post_schedule_plans','DELETE') as direct_delete_blocked,
 not has_table_privilege('anon','public.post_schedule_plans','SELECT') as anon_read_blocked,
 has_function_privilege('authenticated','public.save_schedule_plans(uuid,uuid,jsonb)','EXECUTE') as save_rpc,
 has_function_privilege('authenticated','public.cancel_schedule_plans(uuid,uuid,jsonb)','EXECUTE') as cancel_rpc,
 not has_function_privilege('anon','public.save_schedule_plans(uuid,uuid,jsonb)','EXECUTE') as anon_save_blocked,
 not has_function_privilege('anon','public.cancel_schedule_plans(uuid,uuid,jsonb)','EXECUTE') as anon_cancel_blocked,
 (select count(*)=3 from public.role_permissions where permission_key='content.schedule' and role_key in ('workspace_owner','workspace_admin','social_media_manager')) and (select count(*)=3 from public.role_permissions where permission_key='content.schedule') as scheduling_roles;
