-- Run once in Supabase SQL Editor for the existing DeshiGram project.
create table if not exists public.website_customization (
 slot text primary key check (slot in ('showcase_1','showcase_2','showcase_3','hero','featured')),
 image_url text not null default '', title text not null default '', subtitle text not null default '',
 link_url text not null default '', new_tab boolean not null default false,
 visible boolean not null default true, updated_at timestamptz not null default now()
);
alter table public.website_customization enable row level security;
drop policy if exists "Public can view website customization" on public.website_customization;
create policy "Public can view website customization" on public.website_customization for select to anon,authenticated using (true);
drop policy if exists "Admins can insert website customization" on public.website_customization;
create policy "Admins can insert website customization" on public.website_customization for insert to authenticated with check ((select public.is_deshigram_admin()));
drop policy if exists "Admins can update website customization" on public.website_customization;
create policy "Admins can update website customization" on public.website_customization for update to authenticated using ((select public.is_deshigram_admin())) with check ((select public.is_deshigram_admin()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('website-images','website-images',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
 on conflict (id) do update set public=true;
drop policy if exists "Public can view website images" on storage.objects;
create policy "Public can view website images" on storage.objects for select to anon,authenticated using (bucket_id='website-images');
drop policy if exists "Admins can upload website images" on storage.objects;
create policy "Admins can upload website images" on storage.objects for insert to authenticated with check (bucket_id='website-images' and (select public.is_deshigram_admin()));
