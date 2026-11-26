-- Schema and privilege checks only. This does not prove live authorization or tenant isolation.
select
 to_regclass('public.social_accounts') is not null as accounts_exists,
 to_regclass('public.meta_oauth_flows') is not null as flows_exists,
 (select relrowsecurity from pg_class where oid='public.social_accounts'::regclass) as accounts_rls,
 (select relrowsecurity from pg_class where oid='public.meta_oauth_flows'::regclass) as flows_rls,
 not (has_table_privilege('authenticated','public.social_accounts','SELECT') or has_table_privilege('authenticated','public.social_accounts','INSERT') or has_table_privilege('authenticated','public.social_accounts','UPDATE') or has_table_privilege('authenticated','public.social_accounts','DELETE')) as accounts_browser_denied,
 not (has_table_privilege('anon','public.social_accounts','SELECT') or has_table_privilege('anon','public.social_accounts','INSERT') or has_table_privilege('anon','public.social_accounts','UPDATE') or has_table_privilege('anon','public.social_accounts','DELETE')) as accounts_anon_denied,
 not (has_table_privilege('authenticated','public.meta_oauth_flows','SELECT') or has_table_privilege('authenticated','public.meta_oauth_flows','INSERT') or has_table_privilege('authenticated','public.meta_oauth_flows','UPDATE') or has_table_privilege('authenticated','public.meta_oauth_flows','DELETE')) as flows_browser_denied,
 not (has_table_privilege('anon','public.meta_oauth_flows','SELECT') or has_table_privilege('anon','public.meta_oauth_flows','INSERT') or has_table_privilege('anon','public.meta_oauth_flows','UPDATE') or has_table_privilege('anon','public.meta_oauth_flows','DELETE')) as flows_anon_denied;
