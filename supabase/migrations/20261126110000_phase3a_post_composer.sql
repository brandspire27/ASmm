-- Manual social drafts: atomic batch creation and existing editorial review.
begin;
alter table public.generated_content drop constraint generated_content_type_check;
alter table public.generated_content add constraint generated_content_type_check
 check (type in ('strategy','caption','hashtag','ad_script','thumbnail','video','manual_post'));
alter table public.brand_assets add constraint brand_assets_workspace_client_id_key unique(workspace_id,client_id,id);
alter table public.generated_content
 add column post_batch_id uuid,
 add column post_asset_id uuid,
 add column post_created_by uuid references auth.users(id) on delete set null,
 add constraint manual_post_batch_check check ((type='manual_post' and post_batch_id is not null) or (type<>'manual_post' and post_batch_id is null and post_asset_id is null and post_created_by is null)),
 add constraint manual_post_asset_fk foreign key(workspace_id,client_id,post_asset_id) references public.brand_assets(workspace_id,client_id,id) deferrable initially deferred;
create unique index manual_post_batch_platform_idx on public.generated_content(workspace_id,post_batch_id,(meta->>'platform')) where type='manual_post';
create index manual_post_asset_idx on public.generated_content(workspace_id,client_id,post_asset_id) where post_asset_id is not null;
-- Legacy template drafts keep their existing permissions. Manual drafts MUST use the validated RPC.
drop policy "Workspace creators can insert drafts" on public.generated_content;
create policy "Workspace creators can insert legacy drafts" on public.generated_content for insert to authenticated
 with check (status='draft' and type<>'manual_post' and (select public.has_workspace_permission(workspace_id,'content.create')));

create function public.create_manual_posts(p_workspace_id uuid,p_client_id uuid,p_batch_id uuid,p_variants jsonb)
returns setof public.generated_content language plpgsql security definer set search_path='' as $$
declare v jsonb; platform text; fmt text; headline text; caption text; asset_id uuid; asset_name text; mime text; client_label text; seen text[] := array[]::text[]; existing_count integer;
begin
 if auth.uid() is null or not public.has_workspace_permission(p_workspace_id,'content.create') or not public.has_client_scope(p_workspace_id,p_client_id) then
  raise exception 'Content creation permission required' using errcode='42501';
 end if;
 if p_batch_id is null or p_variants is null or jsonb_typeof(p_variants) <> 'array' then raise exception 'Invalid draft batch'; end if;
 if jsonb_array_length(p_variants) not between 1 and 4 then raise exception 'Select one to four platforms'; end if;
 select name into client_label from public.clients where workspace_id=p_workspace_id and id=p_client_id;
 if not found then raise exception 'Client not found in workspace'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_workspace_id::text || ':' || p_batch_id::text,0));
 select count(*) into existing_count from public.generated_content where workspace_id=p_workspace_id and post_batch_id=p_batch_id;
 if existing_count>0 then
  if existing_count<>jsonb_array_length(p_variants) or exists(select 1 from public.generated_content where workspace_id=p_workspace_id and post_batch_id=p_batch_id and (client_id<>p_client_id or post_created_by is distinct from auth.uid())) then raise exception 'Draft batch already exists; refresh before creating another'; end if;
  -- Confirm retries match the saved content exactly. A reused batch cannot modify reviewed drafts.
  for v in select value from jsonb_array_elements(p_variants) loop
   if not exists(select 1 from public.generated_content g where g.workspace_id=p_workspace_id and g.post_batch_id=p_batch_id and g.meta->>'platform'=v->>'platform' and g.meta->>'format'=v->>'format' and g.title=trim(v->>'title') and g.content=trim(v->>'caption') and g.post_asset_id is not distinct from nullif(v->>'assetId','')::uuid) then raise exception 'Draft batch already exists with different content'; end if;
   if (v->>'platform')=any(seen) then raise exception 'Duplicate platform'; end if;
   seen:=array_append(seen,v->>'platform');
  end loop;
  return query select g.* from public.generated_content g where g.workspace_id=p_workspace_id and g.post_batch_id=p_batch_id order by g.created_at,g.id;
  return;
 end if;
 for v in select value from jsonb_array_elements(p_variants) loop
  if jsonb_typeof(v)<>'object' then raise exception 'Invalid variant'; end if;
  platform:=v->>'platform'; fmt:=v->>'format'; headline:=trim(v->>'title'); caption:=trim(v->>'caption');
  asset_id:=nullif(v->>'assetId','')::uuid; asset_name:=null; mime:=null;
  if platform is null or platform not in ('facebook','instagram','youtube','google_business') or platform=any(seen) then raise exception 'Invalid or duplicate platform'; end if;
  seen:=array_append(seen,platform);
  if fmt is null or fmt not in ('text','image','video') or (platform='instagram' and fmt='text') or (platform='youtube' and fmt<>'video') or (platform='google_business' and fmt='video') then raise exception 'Invalid format for %',platform; end if;
  if headline is null or char_length(headline) not between 1 and 100 or caption is null or char_length(caption) not between 1 and (case platform when 'instagram' then 2000 when 'google_business' then 1500 else 5000 end) then raise exception 'Title or caption exceeds composer limits for %',platform; end if;
  if fmt='text' then
   if asset_id is not null then raise exception 'Text drafts cannot have a media attachment'; end if;
  else
   if asset_id is null or not public.has_workspace_permission(p_workspace_id,'assets.read') then raise exception 'Select an accessible uploaded media asset'; end if;
   select a.name,o.metadata->>'mimetype' into asset_name,mime from public.brand_assets a join storage.objects o on o.bucket_id='agency-assets' and o.name=a.storage_path where a.workspace_id=p_workspace_id and a.client_id=p_client_id and a.id=asset_id and split_part(a.storage_path,'/',1)=p_workspace_id::text;
   if not found or mime is null or (fmt='image' and mime not in ('image/jpeg','image/png','image/webp')) or (fmt='video' and mime<>'video/mp4') then raise exception 'Select an uploaded JPEG, PNG, WebP or MP4 matching the selected format'; end if;
  end if;
  insert into public.generated_content(workspace_id,client_id,client_name,type,title,content,meta,status,provider_used,post_batch_id,post_asset_id,post_created_by)
  values(p_workspace_id,p_client_id,client_label,'manual_post',headline,caption,jsonb_build_object('platform',platform,'format',fmt,'assetId',asset_id,'assetName',asset_name),'draft','Manual composer',p_batch_id,asset_id,auth.uid());
 end loop;
 return query select g.* from public.generated_content g where g.workspace_id=p_workspace_id and g.post_batch_id=p_batch_id order by g.created_at,g.id;
end;
$$;
revoke all on function public.create_manual_posts(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_manual_posts(uuid,uuid,uuid,jsonb) to authenticated;

-- Editorial reviewers get only assets referenced by visible manual drafts, not broad asset permissions.
create policy "Reviewers read referenced manual post assets" on public.brand_assets for select to authenticated using (
 (select public.has_workspace_permission(workspace_id,'content.approve')) and exists(
 select 1 from public.generated_content g where g.workspace_id=brand_assets.workspace_id and g.client_id=brand_assets.client_id and g.post_asset_id=brand_assets.id and g.type='manual_post'));
create policy "Reviewers read referenced manual post files" on storage.objects for select to authenticated using (
 bucket_id='agency-assets' and exists(select 1 from public.brand_assets a join public.generated_content g on g.workspace_id=a.workspace_id and g.client_id=a.client_id and g.post_asset_id=a.id where a.storage_path=storage.objects.name and g.type='manual_post' and (select public.has_workspace_permission(a.workspace_id,'content.approve'))));
commit;
