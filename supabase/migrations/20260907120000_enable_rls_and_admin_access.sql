create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create table private.admin_users (
  user_id uuid primary key
    references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table private.admin_users enable row level security;
revoke all on table private.admin_users from anon, authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_photos enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

grant usage on schema public to anon, authenticated;

revoke all on table
  public.categories,
  public.products,
  public.product_photos,
  public.customers,
  public.customer_addresses,
  public.orders,
  public.order_items,
  public.order_status_history
from anon, authenticated;

grant select on table
  public.categories,
  public.products,
  public.product_photos
to anon;

grant select, insert, update, delete on table
  public.categories,
  public.products,
  public.product_photos,
  public.customers,
  public.customer_addresses,
  public.orders,
  public.order_items,
  public.order_status_history
to authenticated;

create policy "Public read active categories"
on public.categories
for select
to anon, authenticated
using (is_active);

create policy "Public read visible products"
on public.products
for select
to anon, authenticated
using (is_active and is_available);

create policy "Public read photos for visible products"
on public.product_photos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_photos.product_id
      and products.is_active
      and products.is_available
  )
);

create policy "Administrators manage categories"
on public.categories
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators manage products"
on public.products
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators manage product photos"
on public.product_photos
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators manage customers"
on public.customers
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators manage customer addresses"
on public.customer_addresses
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators manage orders"
on public.orders
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators manage order items"
on public.order_items
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators manage order status history"
on public.order_status_history
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
