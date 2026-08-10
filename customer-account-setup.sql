-- DeshiGram Customer Account + Verified Reviews setup
-- Run once in Supabase > SQL Editor AFTER the earlier DeshiGram setup.

create extension if not exists pgcrypto;

-- 1) Customer profiles linked to Supabase Auth
create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

drop policy if exists "Customers can read own profile" on public.customer_profiles;
create policy "Customers can read own profile"
on public.customer_profiles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Customers can update own profile" on public.customer_profiles;
create policy "Customers can update own profile"
on public.customer_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Automatically create profile from signup metadata.
create or replace function public.handle_new_customer_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_profiles(user_id, full_name, phone)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone','')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_customer_auth_created on auth.users;
create trigger on_customer_auth_created
after insert on auth.users
for each row execute procedure public.handle_new_customer_user();

-- 2) Link orders to the logged-in customer.
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_id_idx on public.orders(user_id);

alter table public.orders enable row level security;
drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders"
on public.orders for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- 3) Stop anonymous review submission. Public can still READ approved reviews.
drop policy if exists "Public can submit reviews" on public.reviews;

-- 4) Replace the order RPC so only a logged-in customer can place an order.
drop function if exists public.place_order(text,text,text,text,integer,numeric,numeric,numeric,text,text,text,text,text);

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
returns table(order_number text, order_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order_number text;
  v_order_id uuid;
begin
  if v_user is null then
    raise exception 'Please login before placing an order';
  end if;
  if coalesce(trim(p_customer_name),'') = '' or coalesce(trim(p_phone),'') = '' then
    raise exception 'Name and phone are required';
  end if;
  if p_total_amount <= 0 or p_quantity <= 0 then
    raise exception 'Invalid order amount or quantity';
  end if;

  v_order_number := 'DG-' || to_char(now(),'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  v_order_id := gen_random_uuid();

  insert into public.orders(
    id, user_id, order_number, customer_name, phone, email, product_name, quantity,
    mrp, discount, delivery_fee, platform_fee, packaging_fee, payment_fee,
    total_amount, payment_method, payment_status, order_status, review_token,
    shipping_address, city, state, pincode, transaction_id
  ) values (
    v_order_id, v_user, v_order_number, left(trim(p_customer_name),120), left(trim(p_phone),30),
    nullif(left(trim(coalesce(p_email,'')),180),''), left(trim(p_product_name),400), least(greatest(p_quantity,1),50),
    p_mrp, p_discount, 55, 10, 5, 5, p_total_amount, 'UPI', 'pending', 'placed', gen_random_uuid(),
    left(trim(p_shipping_address),500), left(trim(p_city),120), left(trim(p_state),120),
    left(trim(p_pincode),12), left(trim(p_transaction_id),100)
  );

  return query select v_order_number, v_order_id;
end;
$$;

revoke all on function public.place_order(text,text,text,text,integer,numeric,numeric,numeric,text,text,text,text,text) from public;
grant execute on function public.place_order(text,text,text,text,integer,numeric,numeric,numeric,text,text,text,text,text) to authenticated;

-- Old token-based public verified-review RPC is no longer needed.
revoke all on function public.submit_verified_review(uuid,text,numeric,text) from anon, authenticated;

-- 5) Only the owner of an order can review it. One review per order.
create or replace function public.submit_order_review(
  p_order_id uuid,
  p_rating numeric,
  p_review text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_name text;
begin
  if v_user is null then raise exception 'Please login'; end if;
  if p_rating < 1 or p_rating > 5 or mod(p_rating,1) <> 0 then
    raise exception 'Rating must be a whole number from 1 to 5';
  end if;
  if not exists(select 1 from public.orders where id = p_order_id and user_id = v_user and order_status <> 'cancelled') then
    raise exception 'This order does not belong to your account';
  end if;
  if exists(select 1 from public.reviews where order_id = p_order_id) then
    raise exception 'You have already reviewed this order';
  end if;

  select coalesce(nullif(trim(full_name),''),'Customer') into v_name
  from public.customer_profiles where user_id = v_user;
  if v_name is null then v_name := 'Customer'; end if;

  insert into public.reviews(order_id,name,rating,review,verified,status)
  values(p_order_id,left(v_name,120),p_rating,left(trim(coalesce(p_review,'')),1200),true,'approved');
end;
$$;

revoke all on function public.submit_order_review(uuid,numeric,text) from public;
grant execute on function public.submit_order_review(uuid,numeric,text) to authenticated;
