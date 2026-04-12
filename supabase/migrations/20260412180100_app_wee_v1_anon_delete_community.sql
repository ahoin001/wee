-- Match legacy community behavior: anyone can delete presets/media (anon)
drop policy if exists "Allow creators to delete presets" on app_wee_v1.presets;
create policy "Allow anonymous preset deletes"
on app_wee_v1.presets for delete
to anon, authenticated
using (true);

drop policy if exists "Allow creators to delete media" on app_wee_v1.media_library;
create policy "Allow anonymous media deletes"
on app_wee_v1.media_library for delete
to anon, authenticated
using (true);
