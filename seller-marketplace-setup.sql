-- DeshiGram Seller Marketplace MVP
-- Seller account, documents, product review, seller orders/payout overview.

create extension if not exists pgcrypto;

create table if not exists public.seller_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  business_name text,
  pickup_address text,
  city text,
  state text,
  pincode text,
  fssai_number text,
  fssai_expiry date,
  pan text,
  gstin text,
  bank_account_name text,
  bank_account_number text,
  bank_ifsc text,
  verification_status text not null default 'pending' check (verification_status in ('pending','approved','changes_required','rejected','suspended')),
  verification_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_documents (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(user_id) on delete cascade,
  document_type text not null check (document_type in ('fssai','pan','gst','bank','other')),
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','changes_required','rejected')),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, document_type)
);

create table if not exists public.seller_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(user_id) on delete cascade,
  name text not null,
  category text not null,
  description text not null default '',
  ingredients text not null default '',
  allergen_info text,
  net_quantity text not null,
  mrp numeric(10,2) not null check (mrp >= 0),
  selling_price numeric(10,2) not null check (selling_price >= 0),
  seller_payout numeric(10,2) check (seller_payout is null or seller_payout >= 0),
  shelf_life text not null,
  storage_instructions text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_paths text[] not null default '{}',
  status text not null default 'under_review' check (status in ('draft','under_review','changes_required','live','rejected','paused','out_of_stock')),
  review_note text,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(user_id) on delete cascade,
  period_start date,
  period_end date,
  gross_sales numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_payout numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','processing','paid','held')),
  reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists seller_id uuid references public.seller_profiles(user_id) on delete set null;
alter table public.orders add column if not exists seller_product_id uuid references public.seller_products(id) on delete set null;
alter table public.orders add column if not exists seller_payout numeric(10,2);
alter table public.orders add column if not exists pickup_status text not null default 'not_required';
alter table public.orders add column if not exists seller_ready_at timestamptz;

alter table public.seller_profiles enable row level security;
alter table public.seller_documents enable row level security;
alter table public.seller_products enable row level security;
alter table public.seller_payouts enable row level security;

-- Data API grants. RLS still controls rows.
grant select, insert, update on public.seller_profiles to authenticated;
grant select, insert, update, delete on public.seller_documents to authenticated;
grant select, insert, update, delete on public.seller_products to authenticated;
grant select on public.seller_payouts to authenticated;
grant select on public.seller_products to anon;

-- Seller profile policies.
drop policy if exists "Seller reads own profile" on public.seller_profiles;
create policy "Seller reads own profile" on public.seller_profiles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Seller creates own profile" on public.seller_profiles;
create policy "Seller creates own profile" on public.seller_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Seller updates own profile" on public.seller_profiles;
create policy "Seller updates own profile" on public.seller_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Documents: own rows only.
drop policy if exists "Seller reads own documents" on public.seller_documents;
create policy "Seller reads own documents" on public.seller_documents for select to authenticated
using ((select auth.uid()) = seller_id);

drop policy if exists "Seller inserts own documents" on public.seller_documents;
create policy "Seller inserts own documents" on public.seller_documents for insert to authenticated
with check ((select auth.uid()) = seller_id);

drop policy if exists "Seller updates own documents" on public.seller_documents;
create policy "Seller updates own documents" on public.seller_documents for update to authenticated
using ((select auth.uid()) = seller_id)
with check ((select auth.uid()) = seller_id);

drop policy if exists "Seller deletes own documents" on public.seller_documents;
create policy "Seller deletes own documents" on public.seller_documents for delete to authenticated
using ((select auth.uid()) = seller_id);

-- Products: sellers manage own products; public can read live products only.
drop policy if exists "Public reads live seller products" on public.seller_products;
create policy "Public reads live seller products" on public.seller_products for select to anon
using (status = 'live');

drop policy if exists "Seller reads own products" on public.seller_products;
create policy "Seller reads own products" on public.seller_products for select to authenticated
using ((select auth.uid()) = seller_id or status = 'live');

drop policy if exists "Seller creates own products" on public.seller_products;
create policy "Seller creates own products" on public.seller_products for insert to authenticated
with check ((select auth.uid()) = seller_id and status in ('draft','under_review'));

drop policy if exists "Seller updates own products" on public.seller_products;
create policy "Seller updates own products" on public.seller_products for update to authenticated
using ((select auth.uid()) = seller_id)
with check ((select auth.uid()) = seller_id);

drop policy if exists "Seller deletes own draft products" on public.seller_products;
create policy "Seller deletes own draft products" on public.seller_products for delete to authenticated
using ((select auth.uid()) = seller_id and status in ('draft','changes_required','rejected'));

-- Payouts: own rows only.
drop policy if exists "Seller reads own payouts" on public.seller_payouts;
create policy "Seller reads own payouts" on public.seller_payouts for select to authenticated
using ((select auth.uid()) = seller_id);

-- Seller can see only own marketplace orders.
drop policy if exists "Seller reads own marketplace orders" on public.orders;
create policy "Seller reads own marketplace orders" on public.orders for select to authenticated
using ((select auth.uid()) = seller_id or (select auth.uid()) = user_id);

-- Storage buckets. Product images are public; KYC docs stay private.
insert into storage.buckets (id,name,public) values ('seller-products','seller-products',true)
on conflict (id) do update set public=true;
insert into storage.buckets (id,name,public) values ('seller-documents','seller-documents',false)
on conflict (id) do update set public=false;

-- Product image storage policies: seller path must begin with own auth.uid().
drop policy if exists "Public reads seller product images" on storage.objects;
create policy "Public reads seller product images" on storage.objects for select to public
using (bucket_id='seller-products');

drop policy if exists "Seller uploads product images" on storage.objects;
create policy "Seller uploads product images" on storage.objects for insert to authenticated
with check (bucket_id='seller-products' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Seller updates product images" on storage.objects;
create policy "Seller updates product images" on storage.objects for update to authenticated
using (bucket_id='seller-products' and owner_id = (select auth.uid())::text)
with check (bucket_id='seller-products' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Seller deletes product images" on storage.objects;
create policy "Seller deletes product images" on storage.objects for delete to authenticated
using (bucket_id='seller-products' and owner_id = (select auth.uid())::text);

-- Private document storage.
drop policy if exists "Seller reads own documents files" on storage.objects;
create policy "Seller reads own documents files" on storage.objects for select to authenticated
using (bucket_id='seller-documents' and owner_id = (select auth.uid())::text);

drop policy if exists "Seller uploads own documents files" on storage.objects;
create policy "Seller uploads own documents files" on storage.objects for insert to authenticated
with check (bucket_id='seller-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Seller updates own documents files" on storage.objects;
create policy "Seller updates own documents files" on storage.objects for update to authenticated
using (bucket_id='seller-documents' and owner_id = (select auth.uid())::text)
with check (bucket_id='seller-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Seller deletes own documents files" on storage.objects;
create policy "Seller deletes own documents files" on storage.objects for delete to authenticated
using (bucket_id='seller-documents' and owner_id = (select auth.uid())::text);

-- Admin helper functions reuse the existing dashboard allowlist logic by email.
create or replace function public.is_deshigram_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select lower(coalesce(auth.jwt()->>'email','')) = 'deshigramofficial@gmail.com';
$$;
revoke all on function public.is_deshigram_admin() from public;
grant execute on function public.is_deshigram_admin() to authenticated;

create or replace function public.admin_marketplace_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_deshigram_admin() then raise exception 'Not authorized'; end if;
  select jsonb_build_object(
    'sellers_total',(select count(*) from seller_profiles),
    'sellers_pending',(select count(*) from seller_profiles where verification_status='pending'),
    'products_review',(select count(*) from seller_products where status='under_review'),
    'products_live',(select count(*) from seller_products where status='live'),
    'pending_payout',(select coalesce(sum(net_payout),0) from seller_payouts where status in ('pending','processing')),
    'sellers',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select user_id,full_name,phone,business_name,city,state,fssai_number,verification_status,verification_note,created_at from seller_profiles order by created_at desc limit 30)x),
    'products',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select p.id,p.seller_id,p.name,p.category,p.net_quantity,p.mrp,p.selling_price,p.seller_payout,p.status,p.review_note,p.created_at,s.business_name,s.full_name from seller_products p join seller_profiles s on s.user_id=p.seller_id where p.status in ('under_review','changes_required','rejected','live') order by case when p.status='under_review' then 0 else 1 end,p.created_at desc limit 50)x)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_marketplace_overview() from public;
grant execute on function public.admin_marketplace_overview() to authenticated;

create or replace function public.admin_review_seller(p_seller_id uuid,p_status text,p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_deshigram_admin() then raise exception 'Not authorized'; end if;
  if p_status not in ('approved','changes_required','rejected','suspended','pending') then raise exception 'Invalid status'; end if;
  update seller_profiles set verification_status=p_status,verification_note=nullif(trim(coalesce(p_note,'')),''),updated_at=now() where user_id=p_seller_id;
  if not found then raise exception 'Seller not found'; end if;
end;
$$;
revoke all on function public.admin_review_seller(uuid,text,text) from public;
grant execute on function public.admin_review_seller(uuid,text,text) to authenticated;

create or replace function public.admin_review_seller_product(p_product_id uuid,p_status text,p_note text default null,p_seller_payout numeric default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_deshigram_admin() then raise exception 'Not authorized'; end if;
  if p_status not in ('live','changes_required','rejected','paused','under_review') then raise exception 'Invalid status'; end if;
  update seller_products set status=p_status,review_note=nullif(trim(coalesce(p_note,'')),''),seller_payout=coalesce(p_seller_payout,seller_payout),approved_at=case when p_status='live' then now() else approved_at end,updated_at=now() where id=p_product_id;
  if not found then raise exception 'Product not found'; end if;
end;
$$;
revoke all on function public.admin_review_seller_product(uuid,text,text,numeric) from public;
grant execute on function public.admin_review_seller_product(uuid,text,text,numeric) to authenticated;

-- Harden seller-controlled fields.
revoke update on public.seller_profiles from authenticated;
grant update (full_name,business_name,pickup_address,city,state,pincode,fssai_number,fssai_expiry,pan,gstin,bank_account_name,bank_account_number,bank_ifsc,updated_at) on public.seller_profiles to authenticated;

-- Seller cannot self-approve a listing. Status may only be draft/under_review/changes_required from seller writes.
drop policy if exists "Seller updates own products" on public.seller_products;
create policy "Seller updates own products" on public.seller_products for update to authenticated
using ((select auth.uid()) = seller_id)
with check ((select auth.uid()) = seller_id and status in ('draft','under_review','changes_required'));
revoke update on public.seller_products from authenticated;
grant update (name,category,description,ingredients,allergen_info,net_quantity,mrp,selling_price,shelf_life,storage_instructions,stock_quantity,image_paths,status,submitted_at,updated_at) on public.seller_products to authenticated;

drop policy if exists "Seller inserts own documents" on public.seller_documents;
create policy "Seller inserts own documents" on public.seller_documents for insert to authenticated
with check ((select auth.uid()) = seller_id and status='pending');
revoke update on public.seller_documents from authenticated;
grant update (storage_path,updated_at) on public.seller_documents to authenticated;

create or replace function public.reset_seller_document_review()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.storage_path is distinct from old.storage_path then
    new.status := 'pending';
    new.review_note := null;
  end if;
  return new;
end;$$;
drop trigger if exists trg_reset_seller_document_review on public.seller_documents;
create trigger trg_reset_seller_document_review before update of storage_path on public.seller_documents for each row execute function public.reset_seller_document_review();

create or replace function public.seller_mark_order_ready(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Please login'; end if;
  update orders set pickup_status='ready',seller_ready_at=now(),order_status=case when order_status in ('placed','confirmed') then 'packed' else order_status end
  where id=p_order_id and seller_id=auth.uid() and order_status in ('placed','confirmed','packed');
  if not found then raise exception 'Order not found or cannot be updated'; end if;
end;$$;
revoke all on function public.seller_mark_order_ready(uuid) from public;
grant execute on function public.seller_mark_order_ready(uuid) to authenticated;
