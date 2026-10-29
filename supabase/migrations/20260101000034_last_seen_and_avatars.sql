-- GOCS platform — last_seen_at tracking + avatar storage bucket

-- ============================================================
-- PROFILES: last_seen_at
-- ============================================================
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

comment on column public.profiles.last_seen_at is 'Último timestamp en que el operador cargó cualquier página de la app.';

-- Allow operators to update their own last_seen_at via the admin client
-- (no RLS needed — admin client bypasses it; this is just documentation)

-- ============================================================
-- STORAGE: avatars bucket
-- ============================================================
-- Create a public bucket for operator avatars (images < 2 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- RLS: operators can upload/replace only their own avatar (path = avatars/<profile_id>.*)
create policy if not exists "operators can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'avatars'
    and split_part(storage.filename(name), '.', 1) = auth.uid()::text
  );

create policy if not exists "operators can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(storage.filename(name), '.', 1) = auth.uid()::text
  );

-- Public read for everyone (bucket is public)
create policy if not exists "avatars are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');
