alter table public.customer_addresses
  add column if not exists state_code text;
