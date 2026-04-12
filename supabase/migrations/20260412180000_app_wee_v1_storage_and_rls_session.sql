-- Storage buckets for Wee (hub spoke app)
insert into storage.buckets (id, name, public)
values
  ('media-library', 'media-library', true),
  ('preset-wallpapers', 'preset-wallpapers', true),
  ('preset-displays', 'preset-displays', true)
on conflict (id) do update
set public = excluded.public,
    name = excluded.name;

-- Consolidated storage policies (anon + authenticated) for app buckets
drop policy if exists "wee_public_storage_select" on storage.objects;
drop policy if exists "wee_public_storage_insert" on storage.objects;
drop policy if exists "wee_public_storage_update" on storage.objects;
drop policy if exists "wee_public_storage_delete" on storage.objects;

create policy "wee_public_storage_select"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('media-library', 'preset-wallpapers', 'preset-displays'));

create policy "wee_public_storage_insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id in ('media-library', 'preset-wallpapers', 'preset-displays'));

create policy "wee_public_storage_update"
on storage.objects for update
to anon, authenticated
using (bucket_id in ('media-library', 'preset-wallpapers', 'preset-displays'))
with check (bucket_id in ('media-library', 'preset-wallpapers', 'preset-displays'));

create policy "wee_public_storage_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id in ('media-library', 'preset-wallpapers', 'preset-displays'));

-- Anonymous community parity: allow update/delete when row has creator fields (matches legacy RLS intent)
drop policy if exists "Allow creators to update media" on app_wee_v1.media_library;
create policy "Allow creators to update media"
on app_wee_v1.media_library for update
to anon, authenticated
using (created_by_session_id is not null or created_by_user_id is not null)
with check (created_by_session_id is not null or created_by_user_id is not null);

drop policy if exists "Allow creators to delete media" on app_wee_v1.media_library;
create policy "Allow creators to delete media"
on app_wee_v1.media_library for delete
to anon, authenticated
using (created_by_session_id is not null or created_by_user_id is not null);

drop policy if exists "Allow creators to update presets" on app_wee_v1.presets;
create policy "Allow creators to update presets"
on app_wee_v1.presets for update
to anon, authenticated
using (created_by_session_id is not null or created_by_user_id is not null)
with check (created_by_session_id is not null or created_by_user_id is not null);

drop policy if exists "Allow creators to delete presets" on app_wee_v1.presets;
create policy "Allow creators to delete presets"
on app_wee_v1.presets for delete
to anon, authenticated
using (created_by_session_id is not null or created_by_user_id is not null);
