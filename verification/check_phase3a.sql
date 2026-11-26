-- Structural checks only. All should be true after the migration.
select
 exists(select 1 from information_schema.columns where table_schema='public' and table_name='generated_content' and column_name='post_batch_id') as batch_column,
 exists(select 1 from information_schema.columns where table_schema='public' and table_name='generated_content' and column_name='post_asset_id') as asset_column,
 exists(select 1 from pg_constraint where conrelid='public.generated_content'::regclass and conname='manual_post_asset_fk') as scoped_asset_fk,
 to_regclass('public.manual_post_batch_platform_idx') is not null as unique_batch_platform,
 has_function_privilege('authenticated','public.create_manual_posts(uuid,uuid,uuid,jsonb)','EXECUTE') as authenticated_rpc,
 not has_function_privilege('anon','public.create_manual_posts(uuid,uuid,uuid,jsonb)','EXECUTE') as anonymous_denied,
 not has_table_privilege('authenticated','public.generated_content','UPDATE') as direct_updates_denied,
 exists(select 1 from pg_policies where schemaname='public' and tablename='generated_content' and policyname='Workspace creators can insert legacy drafts' and with_check like '%manual_post%') as manual_insert_restricted,
 exists(select 1 from pg_policies where schemaname='public' and tablename='brand_assets' and policyname='Reviewers read referenced manual post assets') as reviewer_asset_access,
 exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Reviewers read referenced manual post files') as reviewer_file_access;
