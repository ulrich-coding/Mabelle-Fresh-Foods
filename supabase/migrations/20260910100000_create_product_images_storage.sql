insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

revoke all on table storage.objects from anon, authenticated;

grant select on table storage.objects to anon, authenticated;
grant insert, update, delete on table storage.objects to authenticated;

create policy "Public read visible product images"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-images'
  and storage.allow_any_operation(array[
    'object.get_authenticated_info',
    'object.get_authenticated'
  ])
  and exists (
    select 1
    from public.product_photos
    join public.products
      on products.id = product_photos.product_id
    where product_photos.storage_bucket = storage.objects.bucket_id
      and product_photos.storage_path = storage.objects.name
      and products.is_active
      and products.is_available
  )
);

create policy "Administrators manage product images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_admin())
)
with check (
  bucket_id = 'product-images'
  and (select private.is_admin())
  and array_length(storage.foldername(name), 1) = 1
  and exists (
    select 1
    from public.products
    where products.id::text = (storage.foldername(storage.objects.name))[1]
  )
  and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|jpeg|png|webp)$'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
