-- =====================================================
-- UPDATE PRESET SCHEMA FOR DISPLAY IMAGES
-- =====================================================
-- This script updates the presets table to support direct display image URLs
-- Run this in your Supabase SQL Editor

-- Add display image fields to presets table
ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS display_image_url TEXT,
ADD COLUMN IF NOT EXISTS display_image_size INTEGER,
ADD COLUMN IF NOT EXISTS display_image_mime_type TEXT;

-- Update the featured_presets view to include display image URLs
DROP VIEW IF EXISTS featured_presets;
CREATE VIEW featured_presets AS
SELECT 
  p.id, p.name, p.description, p.tags, p.settings_config,
  p.wallpaper_url, p.wallpaper_file_size, p.wallpaper_mime_type,
  p.display_image_url, p.display_image_size, p.display_image_mime_type,
  p.downloads, p.views, p.created_at, p.updated_at,
  m.file_url as media_display_image_url,
  m.thumbnail_url as media_display_thumbnail_url
FROM presets p
LEFT JOIN media_library m ON p.display_image_id = m.id
WHERE p.is_featured = true AND p.is_public = true AND p.is_approved = true
ORDER BY p.downloads DESC, p.created_at DESC;

-- Update the popular_presets view to include display image URLs
DROP VIEW IF EXISTS popular_presets;
CREATE VIEW popular_presets AS
SELECT 
  p.id, p.name, p.description, p.tags, p.settings_config,
  p.wallpaper_url, p.wallpaper_file_size, p.wallpaper_mime_type,
  p.display_image_url, p.display_image_size, p.display_image_mime_type,
  p.downloads, p.views, p.created_at, p.updated_at,
  m.file_url as media_display_image_url,
  m.thumbnail_url as media_display_thumbnail_url
FROM presets p
LEFT JOIN media_library m ON p.display_image_id = m.id
WHERE p.is_public = true AND p.is_approved = true
ORDER BY p.downloads DESC, p.views DESC
LIMIT 50;

-- Add comment to explain the display image fields
COMMENT ON COLUMN presets.display_image_url IS 'Direct URL to display image in preset-displays bucket';
COMMENT ON COLUMN presets.display_image_size IS 'Size of display image in bytes';
COMMENT ON COLUMN presets.display_image_mime_type IS 'MIME type of display image'; 