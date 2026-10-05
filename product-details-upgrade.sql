-- Run once in Supabase SQL Editor.
create table if not exists public.product_details (
  product_key text primary key,
  brand text default 'DeshiGram',
  product_type text,
  dietary_preference text,
  weight text,
  ingredients text,
  allergen_information text,
  fssai_license text,
  nutrition_information text,
  packaging_type text,
  storage_instruction text,
  shelf_life text,
  manufacturer_marketer text,
  updated_at timestamptz not null default now()
);
alter table public.product_details enable row level security;
drop policy if exists "product_details_public_read" on public.product_details;
create policy "product_details_public_read" on public.product_details for select using (true);
drop policy if exists "product_details_admin_write" on public.product_details;
create policy "product_details_admin_write" on public.product_details for all using (public.is_deshigram_admin()) with check (public.is_deshigram_admin());
