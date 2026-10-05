-- DeshiGram Product System V3
-- Run ONCE in Supabase SQL Editor before managing the new detail fields.

create table if not exists public.product_details (
  product_key text primary key,
  brand text default 'DeshiGram',
  product_type text,
  dietary_preference text,
  spice_level text,
  flavour text,
  weight text,
  key_features text,
  unit text,
  ingredients text,
  allergen_information text,
  fssai_license text,
  nutrition_information text,
  cuisine_type text,
  packaging_type text,
  storage_instruction text,
  processing_type text,
  specialty text,
  disclaimer text,
  customer_care text,
  seller_details text,
  manufacturer_marketer text,
  country_of_origin text,
  shelf_life text,
  updated_at timestamptz not null default now()
);
alter table public.product_details enable row level security;
drop policy if exists product_details_public_read on public.product_details;
create policy product_details_public_read on public.product_details for select using (true);
drop policy if exists product_details_admin_write on public.product_details;
create policy product_details_admin_write on public.product_details for all
using (public.is_deshigram_admin()) with check (public.is_deshigram_admin());

-- Panch Poshan rows.
-- Prices intentionally start at 0 so no unverified price is invented.
-- The website displays "Price updating" and disables ADD until Admin sets MRP + Selling Price.
insert into public.deshigram_products
(name,slug,sku,category,net_quantity,mrp,selling_price,stock_quantity,status,sort_order,is_visible,featured,short_description,ingredients,features,image_paths)
values
('Panch Poshan Seed Powder','panch-poshan-100g','PP-100','DeshiGram','100 g',0,0,0,'live',20,true,true,'Panch Poshan Seed Powder — blend of five seeds.',array['Flax','Pumpkin','Watermelon','Chia','Sesame'],array['100% Veg','Blend of Five Seeds'],array['images/panch-poshan-100g.png','images/panch-poshan-pack-2.png','images/panch-poshan-pack-3.png']),
('Panch Poshan Seed Powder — Pack of 2','panch-poshan-pack-2','PP-2X100','DeshiGram','2 × 100 g',0,0,0,'live',21,true,false,'Panch Poshan Seed Powder — Pack of 2.',array['Flax','Pumpkin','Watermelon','Chia','Sesame'],array['100% Veg','Pack of 2'],array['images/panch-poshan-pack-2.png','images/panch-poshan-100g.png']),
('Panch Poshan Seed Powder — Pack of 3','panch-poshan-pack-3','PP-3X100','DeshiGram','3 × 100 g',0,0,0,'live',22,true,false,'Panch Poshan Seed Powder — Pack of 3.',array['Flax','Pumpkin','Watermelon','Chia','Sesame'],array['100% Veg','Pack of 3'],array['images/panch-poshan-pack-3.png','images/panch-poshan-100g.png'])
on conflict (slug) do update set
 name=excluded.name, category=excluded.category, net_quantity=excluded.net_quantity,
 image_paths=excluded.image_paths, ingredients=excluded.ingredients, features=excluded.features,
 is_visible=true;
