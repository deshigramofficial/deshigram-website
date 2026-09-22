-- DeshiGram Admin Order History + Fulfilment setup
-- Run once in Supabase > SQL Editor after the previous DeshiGram SQL files.

alter table public.orders add column if not exists courier_name text;
alter table public.orders add column if not exists awb_code text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists shipment_id text;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_order_status_idx on public.orders(order_status);
create index if not exists orders_payment_status_idx on public.orders(payment_status);

create or replace function public.admin_orders_history(
  p_limit integer default 25,
  p_offset integer default 0,
  p_search text default '',
  p_status text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_limit integer := least(greatest(coalesce(p_limit,25),1),100);
  v_offset integer := greatest(coalesce(p_offset,0),0);
  v_search text := trim(coalesce(p_search,''));
  v_status text := lower(trim(coalesce(p_status,'')));
  v_total bigint;
  v_orders jsonb;
begin
  if v_email <> 'deshigramofficial@gmail.com' then
    raise exception 'Not authorized';
  end if;

  select count(*) into v_total
  from public.orders o
  where
    (v_status = '' or lower(o.order_status) = v_status)
    and (
      v_search = ''
      or o.order_number ilike '%'||v_search||'%'
      or o.customer_name ilike '%'||v_search||'%'
      or o.phone ilike '%'||v_search||'%'
      or o.product_name ilike '%'||v_search||'%'
      or coalesce(o.awb_code,'') ilike '%'||v_search||'%'
    );

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_orders
  from (
    select
      o.id, o.order_number, o.customer_name, o.phone, o.email, o.product_name,
      o.quantity, o.mrp, o.discount, o.delivery_fee, o.platform_fee,
      o.packaging_fee, o.payment_fee, o.total_amount, o.payment_method,
      o.payment_status, o.order_status, o.shipping_address, o.city, o.state,
      o.pincode, o.transaction_id, o.courier_name, o.awb_code, o.tracking_url,
      o.shipment_id, o.created_at, o.shipped_at, o.delivered_at
    from public.orders o
    where
      (v_status = '' or lower(o.order_status) = v_status)
      and (
        v_search = ''
        or o.order_number ilike '%'||v_search||'%'
        or o.customer_name ilike '%'||v_search||'%'
        or o.phone ilike '%'||v_search||'%'
        or o.product_name ilike '%'||v_search||'%'
        or coalesce(o.awb_code,'') ilike '%'||v_search||'%'
      )
    order by o.created_at desc
    limit v_limit offset v_offset
  ) x;

  return jsonb_build_object('total',v_total,'orders',v_orders);
end;
$$;

revoke all on function public.admin_orders_history(integer,integer,text,text) from public;
grant execute on function public.admin_orders_history(integer,integer,text,text) to authenticated;

create or replace function public.admin_update_order(
  p_order_id uuid,
  p_order_status text,
  p_payment_status text,
  p_courier_name text default '',
  p_awb_code text default '',
  p_tracking_url text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_order_status text := lower(trim(coalesce(p_order_status,'')));
  v_payment_status text := lower(trim(coalesce(p_payment_status,'')));
begin
  if v_email <> 'deshigramofficial@gmail.com' then
    raise exception 'Not authorized';
  end if;
  if v_order_status not in ('placed','confirmed','packed','shipped','delivered','cancelled') then
    raise exception 'Invalid order status';
  end if;
  if v_payment_status not in ('pending','paid','failed','refunded') then
    raise exception 'Invalid payment status';
  end if;

  update public.orders
  set order_status = v_order_status,
      payment_status = v_payment_status,
      courier_name = nullif(left(trim(coalesce(p_courier_name,'')),120),''),
      awb_code = nullif(left(trim(coalesce(p_awb_code,'')),120),''),
      tracking_url = nullif(left(trim(coalesce(p_tracking_url,'')),500),''),
      shipped_at = case when v_order_status='shipped' and shipped_at is null then now() else shipped_at end,
      delivered_at = case when v_order_status='delivered' and delivered_at is null then now() else delivered_at end
  where id = p_order_id;
end;
$$;

revoke all on function public.admin_update_order(uuid,text,text,text,text,text) from public;
grant execute on function public.admin_update_order(uuid,text,text,text,text,text) to authenticated;
