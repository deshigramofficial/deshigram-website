-- Run after the previous website-customization-setup.sql succeeded.
-- Preserves existing products, orders and customization rows.
alter table public.website_customization add column if not exists mobile_image_url text not null default '';
alter table public.website_customization add column if not exists festive_effects boolean not null default false;
alter table public.website_customization add column if not exists effect_until date;
-- Allow any numbered showcase slot, plus the original hero and featured sections.
alter table public.website_customization drop constraint if exists website_customization_slot_check;
alter table public.website_customization add constraint website_customization_slot_check check (slot ~ '^showcase_[1-9][0-9]*$' or slot in ('hero','featured'));
-- Only existing authenticated DeshiGram admins can remove a banner.
drop policy if exists "Admins can delete website customization" on public.website_customization;
create policy "Admins can delete website customization" on public.website_customization for delete to authenticated using ((select public.is_deshigram_admin()));
-- Seed three festival banners only if a slot has never been customized.
insert into public.website_customization(slot,image_url,title,visible,festive_effects)
values ('showcase_1','images/showcase-1-diwali.webp','Dry Fruits Energy Powder Diwali Offer',true,true),
       ('showcase_2','images/showcase-2-diwali.webp','Panch Poshan Diwali Offer',true,true),
       ('showcase_3','images/showcase-3-diwali.webp','Two Signature Blends',true,true)
on conflict (slot) do nothing;
