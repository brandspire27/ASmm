-- Read-only metadata smoke checks, run in SQL Editor after the new migration.
-- These do NOT replace authenticated multi-user integration tests.
select
  not has_table_privilege('authenticated', 'public.generated_content', 'UPDATE') as direct_update_blocked,
  has_function_privilege('authenticated', 'public.review_generated_content(uuid,uuid,text)', 'EXECUTE') as review_rpc_available,
  not has_function_privilege('anon', 'public.review_generated_content(uuid,uuid,text)', 'EXECUTE') as anonymous_review_blocked,
  not exists (select 1 from public.generated_content where status = 'published') as no_fake_published_flags,
  not exists (select 1 from public.generated_content where type = 'video' and meta->>'status' = 'rendered') as no_fake_render_flags,
  not exists (select 1 from public.role_permissions where role_key = 'content_creator' and permission_key = 'content.approve') as creators_cannot_approve,
  not exists (select 1 from public.role_permissions where role_key = 'content_approver' and permission_key = 'content.create') as approvers_cannot_create;
