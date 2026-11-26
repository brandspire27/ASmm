-- Metadata-only smoke checks. Run after migration. All columns should be true.
select
  (select relrowsecurity from pg_class where oid = 'public.client_access_assignments'::regclass) as assignment_rls_enabled,
  not has_table_privilege('authenticated','public.client_access_assignments','SELECT') as direct_read_blocked,
  not has_table_privilege('authenticated','public.client_access_assignments','INSERT') as direct_insert_blocked,
  not has_table_privilege('authenticated','public.client_access_assignments','UPDATE') as direct_update_blocked,
  not has_table_privilege('authenticated','public.client_access_assignments','DELETE') as direct_delete_blocked,
  not has_function_privilege('anon','public.set_client_access(uuid,uuid,text,boolean)','EXECUTE') as anonymous_grants_blocked,
  has_function_privilege('authenticated','public.set_client_access(uuid,uuid,text,boolean)','EXECUTE') as grant_rpc_available,
  (select count(*) = 4 from pg_policies where schemaname = 'public' and policyname in ('Client scope on clients','Client scope on content','Client scope on analytics','Client scope on asset metadata') and permissive = 'RESTRICTIVE' and cmd = 'SELECT') as restrictive_policies_present,
  not exists (select 1 from public.role_permissions where role_key = 'client' and permission_key in ('brand_profiles.read','assets.read','assets.manage','clients.manage','content.create','content.approve','analytics.manage')) as client_role_read_only_scoped,
  exists (select 1 from pg_trigger where tgrelid = 'public.workspace_memberships'::regclass and tgname = 'clear_changed_client_access' and tgenabled <> 'D') as membership_cleanup_enabled;
