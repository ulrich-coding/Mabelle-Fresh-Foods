create extension if not exists pgcrypto;

create type public.product_unit as enum (
  'kilogram',
  'piece',
  'dozen',
  'other'
);

create type public.fulfillment_method as enum (
  'delivery',
  'pickup'
);

create type public.order_status as enum (
  'draft',
  'submitted',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'cancelled'
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order integer not null default 0 check (display_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null
    references public.categories(id) on delete restrict,

  name text not null,
  slug text not null unique,
  sku text unique,
  description text,

  price_amount numeric(12, 2) not null check (price_amount >= 0),
  currency_code text not null default 'USD'
    check (currency_code ~ '^[A-Z]{3}$'),

  unit public.product_unit not null,
  unit_label text,

  minimum_order_quantity numeric(12, 3) not null default 1
    check (minimum_order_quantity > 0),
  quantity_step numeric(12, 3) not null default 1
    check (quantity_step > 0),

  is_active boolean not null default true,
  is_available boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  constraint products_unit_label_check
    check (
      (unit = 'other' and nullif(trim(unit_label), '') is not null)
      or
      (unit <> 'other' and unit_label is null)
    )
);

create table public.product_photos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null
    references public.products(id) on delete cascade,

  storage_bucket text not null default 'product-images',
  storage_path text not null,
  alt_text text,
  position smallint not null default 0 check (position >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),

  constraint product_photos_storage_path_unique
    unique (storage_bucket, storage_path),

  constraint product_photos_position_unique
    unique (product_id, position)
);

create unique index product_photos_one_primary_per_product
  on public.product_photos (product_id)
  where is_primary;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_e164 text not null
    check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_phone_e164_idx
  on public.customers (phone_e164);

create index customers_email_idx
  on public.customers (lower(email))
  where email is not null;

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null
    references public.customers(id) on delete cascade,

  label text,
  recipient_name text not null,
  phone_e164 text not null
    check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),

  address_line_1 text not null,
  address_line_2 text,
  postal_code text not null,
  city text not null,
  country_code text not null default 'US'
    check (country_code ~ '^[A-Z]{2}$'),

  delivery_instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customer_addresses_id_customer_id_unique
    unique (id, customer_id)
);

create unique index customer_addresses_one_default_per_customer
  on public.customer_addresses (customer_id)
  where is_default;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,

  customer_id uuid not null
    references public.customers(id) on delete restrict,
  delivery_address_id uuid,

  status public.order_status not null default 'draft',
  fulfillment_method public.fulfillment_method not null,

  customer_name text not null,
  customer_phone_e164 text not null,
  customer_email text,

  delivery_recipient_name text,
  delivery_phone_e164 text,
  delivery_address_line_1 text,
  delivery_address_line_2 text,
  delivery_postal_code text,
  delivery_city text,
  delivery_country_code text,

  customer_note text,
  internal_note text,

  subtotal_amount numeric(12, 2) not null default 0
    check (subtotal_amount >= 0),
  delivery_fee_amount numeric(12, 2) not null default 0
    check (delivery_fee_amount >= 0),
  total_amount numeric(12, 2) not null default 0
    check (total_amount >= 0),
  currency_code text not null default 'USD'
    check (currency_code ~ '^[A-Z]{3}$'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_total_check
    check (total_amount = subtotal_amount + delivery_fee_amount),

  constraint orders_delivery_details_check
    check (
      fulfillment_method = 'pickup'
      or (
        fulfillment_method = 'delivery'
        and delivery_recipient_name is not null
        and delivery_phone_e164 is not null
        and delivery_address_line_1 is not null
        and delivery_postal_code is not null
        and delivery_city is not null
        and delivery_country_code is not null
      )
    ),

  constraint orders_delivery_address_belongs_to_customer_fkey
    foreign key (delivery_address_id, customer_id)
    references public.customer_addresses (id, customer_id)
    on delete set null (delivery_address_id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null
    references public.orders(id) on delete cascade,
  product_id uuid not null
    references public.products(id) on delete restrict,

  product_name text not null,
  product_sku text,
  unit public.product_unit not null,
  unit_label text,

  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price_amount numeric(12, 2) not null
    check (unit_price_amount >= 0),
  line_total_amount numeric(12, 2) not null
    check (line_total_amount >= 0),

  created_at timestamptz not null default now(),

  constraint order_items_unit_label_check
    check (
      (unit = 'other' and nullif(trim(unit_label), '') is not null)
      or
      (unit <> 'other' and unit_label is null)
    ),

  constraint order_items_line_total_check
    check (
      line_total_amount = round(quantity * unit_price_amount, 2)
    )
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null
    references public.orders(id) on delete cascade,

  previous_status public.order_status,
  new_status public.order_status not null,

  changed_by_user_id uuid
    references auth.users(id) on delete set null,

  note text,
  created_at timestamptz not null default now(),

  constraint order_status_history_transition_check
    check (
      previous_status is null
      or previous_status <> new_status
    )
);

create index products_catalog_idx
  on public.products (category_id, name)
  where is_active and is_available;

create index order_items_order_id_idx
  on public.order_items (order_id);

create index orders_customer_created_at_idx
  on public.orders (customer_id, created_at desc);

create index orders_status_created_at_idx
  on public.orders (status, created_at desc);

create index orders_fulfillment_created_at_idx
  on public.orders (fulfillment_method, created_at desc);

create index order_status_history_order_created_at_idx
  on public.order_status_history (order_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger customer_addresses_set_updated_at
before update on public.customer_addresses
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();
