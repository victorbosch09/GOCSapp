-- GOCS platform — bucket de Storage para las imágenes de preview del
-- catálogo (armamento/equipo/accesorios/vehículos). Lectura pública,
-- escritura solo vía service role (Server Actions del panel de mando).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', true, 2097152, array['image/png'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/png'];

create policy "item_images_public_read"
  on storage.objects for select
  using (bucket_id = 'item-images');

-- Sin policies de insert/update/delete para authenticated/anon: las subidas
-- se hacen exclusivamente desde Server Actions con la service role key,
-- que bypassa RLS de storage.objects igual que en el resto de la app.
