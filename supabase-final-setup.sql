-- DeshiGram: final free Orders + Verified Reviews backend setup
-- Run once in Supabase > SQL Editor > New query > Run.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  phone text not null,
  email text,
  product_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  mrp numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 55,
  platform_fee numeric(10,2) not null default 10,
  packaging_fee numeric(10,2) not null default 5,
  payment_fee numeric(10,2) not null default 5,
  total_amount numeric(10,2) not null,
  payment_method text default 'UPI',
  payment_status text not null default 'pending',
  order_status text not null default 'placed',
  review_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists shipping_address text;
alter table public.orders add column if not exists city text;
alter table public.orders add column if not exists state text;
alter table public.orders add column if not exists pincode text;
alter table public.orders add column if not exists transaction_id text;
alter table public.orders enable row level security;

-- Existing reviews table from the earlier setup is kept intact.
alter table public.reviews add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table public.reviews enable row level security;

-- Keep public read limited to approved reviews.
drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
on public.reviews for select to anon, authenticated
using (status = 'approved');

-- Normal public reviews auto-publish but cannot self-mark as verified.
drop policy if exists "Public can submit reviews" on public.reviews;
create policy "Public can submit reviews"
on public.reviews for insert to anon, authenticated
with check (status = 'approved' and verified = false and order_id is null);

-- No public order SELECT policy is created: private customer/order data stays unreadable from the website.

create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_product_name text,
  p_quantity integer,
  p_mrp numeric,
  p_discount numeric,
  p_total_amount numeric,
  p_shipping_address text,
  p_city text,
  p_state text,
  p_pincode text,
  p_transaction_id text
)
returns table(order_number text, review_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_number text;
  v_review_token uuid;
begin
  if coalesce(trim(p_customer_name),'') = '' or coalesce(trim(p_phone),'') = '' then
    raise exception 'Name and phone are required';
  end if;
  if p_total_amount <= 0 or p_quantity <= 0 then
    raise exception 'Invalid order amount or quantity';
  end if;
  v_order_number := 'DG-' || to_char(now(),'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  v_review_token := gen_random_uuid();
  insert into public.orders(
    order_number, customer_name, phone, email, product_name, quantity,
    mrp, discount, delivery_fee, platform_fee, packaging_fee, payment_fee,
    total_amount, payment_method, payment_status, order_status, review_token,
    shipping_address, city, state, pincode, transaction_id
  ) values (
    v_order_number, left(trim(p_customer_name),120), left(trim(p_phone),30), nullif(left(trim(coalesce(p_email,'')),180),''),
    left(trim(p_product_name),400), least(greatest(p_quantity,1),50), p_mrp, p_discount, 55, 10, 5, 5,
    p_total_amount, 'UPI', 'pending', 'placed', v_review_token,
    left(trim(p_shipping_address),500), left(trim(p_city),120), left(trim(p_state),120), left(trim(p_pincode),12), left(trim(p_transaction_id),100)
  );
  return query select v_order_number, v_review_token;
end;
$$;

revoke all on function public.place_order(text,text,text,text,integer,numeric,numeric,numeric,text,text,text,text,text) from public;
grant execute on function public.place_order(text,text,text,text,integer,numeric,numeric,numeric,text,text,text,text,text) to anon, authenticated;

create or replace function public.submit_verified_review(
  p_token uuid,
  p_name text,
  p_rating numeric,
  p_review text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  select id into v_order_id from public.orders where review_token = p_token limit 1;
  if v_order_id is null then raise exception 'Invalid review link'; end if;
  if exists(select 1 from public.reviews where order_id = v_order_id) then raise exception 'A review has already been submitted for this order'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  insert into public.reviews(order_id,name,rating,review,verified,status)
  values(v_order_id,left(trim(p_name),120),p_rating,left(trim(coalesce(p_review,'')),1200),true,'approved');
end;
$$;

revoke all on function public.submit_verified_review(uuid,text,numeric,text) from public;
grant execute on function public.submit_verified_review(uuid,text,numeric,text) to anon, authenticated;
