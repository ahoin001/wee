-- Groundwork for lightweight community moderation.
-- This migration intentionally does not change current public behavior.

alter table app_wee_v1.presets
  add column if not exists moderation_status text not null default 'none'
    check (moderation_status in ('none', 'flagged', 'reviewed', 'removed')),
  add column if not exists moderation_notes text,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by_user_id uuid;

alter table app_wee_v1.media_library
  add column if not exists moderation_status text not null default 'none'
    check (moderation_status in ('none', 'flagged', 'reviewed', 'removed')),
  add column if not exists moderation_notes text,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by_user_id uuid;

create table if not exists app_wee_v1.community_reports (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('preset', 'media')),
  entity_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  created_by_session_id uuid,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid
);

create index if not exists idx_presets_moderation_status
  on app_wee_v1.presets(moderation_status);

create index if not exists idx_media_library_moderation_status
  on app_wee_v1.media_library(moderation_status);

create index if not exists idx_community_reports_entity
  on app_wee_v1.community_reports(entity_type, entity_id);

create index if not exists idx_community_reports_status
  on app_wee_v1.community_reports(status, created_at desc);

alter table app_wee_v1.community_reports enable row level security;

drop policy if exists "Service role manage community reports" on app_wee_v1.community_reports;
create policy "Service role manage community reports"
on app_wee_v1.community_reports
for all
to service_role
using (true)
with check (true);

grant all privileges on table app_wee_v1.community_reports to service_role;
