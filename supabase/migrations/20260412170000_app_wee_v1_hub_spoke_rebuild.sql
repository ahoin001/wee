-- Hub-and-spoke schema migration for Wee app.
-- Hub resources stay in public/auth/shared schemas.
-- App resources live in app_wee_v1.

create schema if not exists app_wee_v1;

grant usage on schema app_wee_v1 to anon, authenticated, service_role;

-- -----------------------------------------------------
-- Optional legacy moves from public -> app_wee_v1
-- -----------------------------------------------------
do $$
begin
  if to_regclass('public.media_library') is not null and to_regclass('app_wee_v1.media_library') is null then
    execute 'alter table public.media_library set schema app_wee_v1';
  end if;

  if to_regclass('public.presets') is not null and to_regclass('app_wee_v1.presets') is null then
    execute 'alter table public.presets set schema app_wee_v1';
  end if;

  if to_regclass('public.user_sessions') is not null and to_regclass('app_wee_v1.user_sessions') is null then
    execute 'alter table public.user_sessions set schema app_wee_v1';
  end if;

  if to_regclass('public.preset_downloads') is not null and to_regclass('app_wee_v1.preset_downloads') is null then
    execute 'alter table public.preset_downloads set schema app_wee_v1';
  end if;

  if to_regclass('public.media_downloads') is not null and to_regclass('app_wee_v1.media_downloads') is null then
    execute 'alter table public.media_downloads set schema app_wee_v1';
  end if;
end $$;

-- -----------------------------------------------------
-- Tables
-- -----------------------------------------------------
create table if not exists app_wee_v1.media_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tags text[] not null default '{}',
  file_type text not null check (file_type in ('image', 'gif', 'video')),
  mime_type text not null,
  file_size integer not null check (file_size >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  file_url text not null,
  thumbnail_url text,
  preview_url text,
  downloads integer not null default 0 check (downloads >= 0),
  views integer not null default 0 check (views >= 0),
  is_featured boolean not null default false,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_session_id uuid,
  created_by_user_id uuid
);

create table if not exists app_wee_v1.presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  tags text[] not null default '{}',
  settings_config jsonb not null,
  wallpaper_url text,
  wallpaper_file_size integer check (wallpaper_file_size is null or wallpaper_file_size >= 0),
  wallpaper_mime_type text,
  display_image_id uuid references app_wee_v1.media_library(id),
  display_image_url text,
  display_image_size integer check (display_image_size is null or display_image_size >= 0),
  display_image_mime_type text,
  downloads integer not null default 0 check (downloads >= 0),
  views integer not null default 0 check (views >= 0),
  is_featured boolean not null default false,
  is_public boolean not null default true,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_session_id uuid,
  created_by_user_id uuid,
  version integer not null default 1 check (version > 0),
  parent_preset_id uuid references app_wee_v1.presets(id)
);

create table if not exists app_wee_v1.user_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  last_activity timestamptz not null default now(),
  is_active boolean not null default true,
  user_id uuid
);

create table if not exists app_wee_v1.preset_downloads (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references app_wee_v1.presets(id) on delete cascade,
  session_id uuid references app_wee_v1.user_sessions(id),
  user_id uuid,
  downloaded_at timestamptz not null default now(),
  ip_address inet
);

create table if not exists app_wee_v1.media_downloads (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references app_wee_v1.media_library(id) on delete cascade,
  session_id uuid references app_wee_v1.user_sessions(id),
  user_id uuid,
  downloaded_at timestamptz not null default now(),
  ip_address inet
);

-- -----------------------------------------------------
-- Indexes
-- -----------------------------------------------------
create index if not exists idx_media_library_file_type on app_wee_v1.media_library(file_type);
create index if not exists idx_media_library_tags on app_wee_v1.media_library using gin(tags);
create index if not exists idx_media_library_created_at on app_wee_v1.media_library(created_at desc);
create index if not exists idx_media_library_downloads on app_wee_v1.media_library(downloads desc);
create index if not exists idx_media_library_featured on app_wee_v1.media_library(is_featured) where is_featured = true;
create index if not exists idx_media_library_approved on app_wee_v1.media_library(is_approved) where is_approved = true;

create index if not exists idx_presets_public on app_wee_v1.presets(is_public) where is_public = true;
create index if not exists idx_presets_created_at on app_wee_v1.presets(created_at desc);
create index if not exists idx_presets_downloads on app_wee_v1.presets(downloads desc);
create index if not exists idx_presets_featured on app_wee_v1.presets(is_featured) where is_featured = true;
create index if not exists idx_presets_tags on app_wee_v1.presets using gin(tags);
create index if not exists idx_presets_session_id on app_wee_v1.presets(created_by_session_id);
create index if not exists idx_presets_user_id on app_wee_v1.presets(created_by_user_id);

create index if not exists idx_preset_downloads_preset_id on app_wee_v1.preset_downloads(preset_id);
create index if not exists idx_preset_downloads_session_id on app_wee_v1.preset_downloads(session_id);
create index if not exists idx_media_downloads_media_id on app_wee_v1.media_downloads(media_id);
create index if not exists idx_media_downloads_session_id on app_wee_v1.media_downloads(session_id);

-- Prevent duplicate download events per user/session pair.
create unique index if not exists uq_preset_downloads_preset_session
  on app_wee_v1.preset_downloads(preset_id, session_id)
  where session_id is not null;
create unique index if not exists uq_preset_downloads_preset_user
  on app_wee_v1.preset_downloads(preset_id, user_id)
  where user_id is not null;
create unique index if not exists uq_media_downloads_media_session
  on app_wee_v1.media_downloads(media_id, session_id)
  where session_id is not null;
create unique index if not exists uq_media_downloads_media_user
  on app_wee_v1.media_downloads(media_id, user_id)
  where user_id is not null;

-- -----------------------------------------------------
-- Functions / triggers
-- -----------------------------------------------------
create or replace function app_wee_v1.update_download_count()
returns trigger
language plpgsql
set search_path = app_wee_v1, public
as $$
begin
  if tg_table_name = 'preset_downloads' then
    update app_wee_v1.presets
    set downloads = downloads + 1
    where id = new.preset_id;
  elsif tg_table_name = 'media_downloads' then
    update app_wee_v1.media_library
    set downloads = downloads + 1
    where id = new.media_id;
  end if;

  return new;
end;
$$;

create or replace function app_wee_v1.update_updated_at_column()
returns trigger
language plpgsql
set search_path = app_wee_v1, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_preset_download_count on app_wee_v1.preset_downloads;
create trigger trigger_preset_download_count
after insert on app_wee_v1.preset_downloads
for each row execute function app_wee_v1.update_download_count();

drop trigger if exists trigger_media_download_count on app_wee_v1.media_downloads;
create trigger trigger_media_download_count
after insert on app_wee_v1.media_downloads
for each row execute function app_wee_v1.update_download_count();

drop trigger if exists trigger_update_media_updated_at on app_wee_v1.media_library;
create trigger trigger_update_media_updated_at
before update on app_wee_v1.media_library
for each row execute function app_wee_v1.update_updated_at_column();

drop trigger if exists trigger_update_presets_updated_at on app_wee_v1.presets;
create trigger trigger_update_presets_updated_at
before update on app_wee_v1.presets
for each row execute function app_wee_v1.update_updated_at_column();

-- -----------------------------------------------------
-- Views
-- -----------------------------------------------------
create or replace view app_wee_v1.featured_media as
select
  m.id, m.title, m.description, m.tags, m.file_type, m.mime_type,
  m.file_size, m.width, m.height, m.duration_ms, m.file_url,
  m.thumbnail_url, m.preview_url, m.downloads, m.views,
  m.created_at, m.updated_at
from app_wee_v1.media_library m
where m.is_featured = true and m.is_approved = true
order by m.downloads desc, m.created_at desc;

create or replace view app_wee_v1.featured_presets as
select
  p.id, p.name, p.description, p.tags, p.settings_config,
  p.wallpaper_url, p.wallpaper_file_size, p.wallpaper_mime_type,
  p.display_image_url, p.display_image_size, p.display_image_mime_type,
  p.downloads, p.views, p.created_at, p.updated_at,
  m.file_url as media_display_image_url,
  m.thumbnail_url as media_display_thumbnail_url
from app_wee_v1.presets p
left join app_wee_v1.media_library m on p.display_image_id = m.id
where p.is_featured = true and p.is_public = true and p.is_approved = true
order by p.downloads desc, p.created_at desc;

create or replace view app_wee_v1.popular_media as
select
  m.id, m.title, m.description, m.tags, m.file_type, m.mime_type,
  m.file_size, m.width, m.height, m.duration_ms, m.file_url,
  m.thumbnail_url, m.preview_url, m.downloads, m.views,
  m.created_at, m.updated_at
from app_wee_v1.media_library m
where m.is_approved = true
order by m.downloads desc, m.views desc
limit 50;

create or replace view app_wee_v1.popular_presets as
select
  p.id, p.name, p.description, p.tags, p.settings_config,
  p.wallpaper_url, p.wallpaper_file_size, p.wallpaper_mime_type,
  p.display_image_url, p.display_image_size, p.display_image_mime_type,
  p.downloads, p.views, p.created_at, p.updated_at,
  m.file_url as media_display_image_url,
  m.thumbnail_url as media_display_thumbnail_url
from app_wee_v1.presets p
left join app_wee_v1.media_library m on p.display_image_id = m.id
where p.is_public = true and p.is_approved = true
order by p.downloads desc, p.views desc
limit 50;

grant select on app_wee_v1.featured_media, app_wee_v1.featured_presets, app_wee_v1.popular_media, app_wee_v1.popular_presets to anon, authenticated, service_role;

-- -----------------------------------------------------
-- RLS policies
-- -----------------------------------------------------
alter table app_wee_v1.media_library enable row level security;
alter table app_wee_v1.presets enable row level security;
alter table app_wee_v1.user_sessions enable row level security;
alter table app_wee_v1.preset_downloads enable row level security;
alter table app_wee_v1.media_downloads enable row level security;

drop policy if exists "Allow public read access to approved media" on app_wee_v1.media_library;
create policy "Allow public read access to approved media"
on app_wee_v1.media_library for select
using (is_approved = true);

drop policy if exists "Allow anonymous media uploads" on app_wee_v1.media_library;
create policy "Allow anonymous media uploads"
on app_wee_v1.media_library for insert
with check (true);

drop policy if exists "Allow creators to update media" on app_wee_v1.media_library;
create policy "Allow creators to update media"
on app_wee_v1.media_library for update
using (created_by_user_id = auth.uid() or auth.role() = 'service_role')
with check (created_by_user_id = auth.uid() or auth.role() = 'service_role');

drop policy if exists "Allow creators to delete media" on app_wee_v1.media_library;
create policy "Allow creators to delete media"
on app_wee_v1.media_library for delete
using (created_by_user_id = auth.uid() or auth.role() = 'service_role');

drop policy if exists "Allow public read access to public presets" on app_wee_v1.presets;
create policy "Allow public read access to public presets"
on app_wee_v1.presets for select
using (is_public = true and is_approved = true);

drop policy if exists "Allow anonymous preset uploads" on app_wee_v1.presets;
create policy "Allow anonymous preset uploads"
on app_wee_v1.presets for insert
with check (true);

drop policy if exists "Allow creators to update presets" on app_wee_v1.presets;
create policy "Allow creators to update presets"
on app_wee_v1.presets for update
using (created_by_user_id = auth.uid() or auth.role() = 'service_role')
with check (created_by_user_id = auth.uid() or auth.role() = 'service_role');

drop policy if exists "Allow creators to delete presets" on app_wee_v1.presets;
create policy "Allow creators to delete presets"
on app_wee_v1.presets for delete
using (created_by_user_id = auth.uid() or auth.role() = 'service_role');

drop policy if exists "Allow session creation" on app_wee_v1.user_sessions;
create policy "Allow session creation"
on app_wee_v1.user_sessions for insert
with check (true);

drop policy if exists "Allow users to read own sessions" on app_wee_v1.user_sessions;
create policy "Allow users to read own sessions"
on app_wee_v1.user_sessions for select
using (user_id = auth.uid() or user_id is null or auth.role() = 'service_role');

drop policy if exists "Allow users to update own sessions" on app_wee_v1.user_sessions;
create policy "Allow users to update own sessions"
on app_wee_v1.user_sessions for update
using (user_id = auth.uid() or user_id is null or auth.role() = 'service_role')
with check (user_id = auth.uid() or user_id is null or auth.role() = 'service_role');

drop policy if exists "Allow anonymous download tracking" on app_wee_v1.preset_downloads;
create policy "Allow anonymous download tracking"
on app_wee_v1.preset_downloads for insert
with check (true);

drop policy if exists "Allow anonymous media download tracking" on app_wee_v1.media_downloads;
create policy "Allow anonymous media download tracking"
on app_wee_v1.media_downloads for insert
with check (true);

drop policy if exists "Allow public read access to download stats" on app_wee_v1.preset_downloads;
create policy "Allow public read access to download stats"
on app_wee_v1.preset_downloads for select
using (true);

drop policy if exists "Allow public read access to media download stats" on app_wee_v1.media_downloads;
create policy "Allow public read access to media download stats"
on app_wee_v1.media_downloads for select
using (true);

-- -----------------------------------------------------
-- Explicit grants
-- -----------------------------------------------------
grant select on all tables in schema app_wee_v1 to anon, authenticated;
grant insert on app_wee_v1.user_sessions, app_wee_v1.media_library, app_wee_v1.presets, app_wee_v1.preset_downloads, app_wee_v1.media_downloads to anon, authenticated;
grant update, delete on app_wee_v1.media_library, app_wee_v1.presets, app_wee_v1.user_sessions to authenticated;
grant all privileges on all tables in schema app_wee_v1 to service_role;
grant usage, select on all sequences in schema app_wee_v1 to anon, authenticated, service_role;
