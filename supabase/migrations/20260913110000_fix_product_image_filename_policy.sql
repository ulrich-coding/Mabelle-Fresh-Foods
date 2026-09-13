alter policy "Administrators manage product images"
on storage.objects
with check (
  bucket_id = 'product-images'
  and (select private.is_admin())
  and array_length(storage.foldername(name), 1) = 1
  and exists (
    select 1
    from public.products
    where products.id::text = (storage.foldername(storage.objects.name))[1]
  )
  and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
