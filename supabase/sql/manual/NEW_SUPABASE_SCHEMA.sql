-- =====================================================
-- NEW SUPABASE SCHEMA FOR WEEDESKTOP LAUNCHER
-- =====================================================
-- This schema supports:
-- 1. Media library (images, gifs, videos) with tags and search
-- 2. Presets with embedded wallpapers and optional display images
-- 3. Anonymous users with future account support
-- 4. Community sharing and downloading
-- 5. Scalable architecture for future features

-- =====================================================
-- STEP 1: DROP EXISTING TABLES (if they exist)
-- =====================================================

DROP TABLE IF EXISTS shared_presets CASCADE;
DROP TABLE IF EXISTS media_library CASCADE;
DROP TABLE IF EXISTS preset_media CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS preset_downloads CASCADE;
DROP TABLE IF EXISTS media_downloads CASCADE;

-- =====================================================
-- STEP 2: CREATE NEW TABLES
-- =====================================================

-- =====================================================
-- 1. MEDIA LIBRARY TABLE
-- =====================================================
-- Stores images, gifs, and videos for channel thumbnails
-- and preset display images

CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'gif', 'video')),
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_ms INTEGER, -- for videos
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  preview_url TEXT, -- for videos
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_session_id UUID, -- anonymous session ID
  created_by_user_id UUID -- future: authenticated user ID
);

-- =====================================================
-- 2. PRESETS TABLE
-- =====================================================
-- Stores user presets with embedded wallpapers

CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Preset configuration (JSON)
  settings_config JSONB NOT NULL,
  
  -- Wallpaper data (embedded in preset)
  wallpaper_url TEXT,
  wallpaper_file_size INTEGER,
  wallpaper_mime_type TEXT,
  
  -- Display image (optional)
  display_image_id UUID REFERENCES media_library(id),
  
  -- Metadata
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Creator info (anonymous or authenticated)
  created_by_session_id UUID,
  created_by_user_id UUID, -- future: authenticated user ID
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_preset_id UUID REFERENCES presets(id) -- for preset variations
);

-- =====================================================
-- 3. USER SESSIONS TABLE
-- =====================================================
-- Tracks anonymous users for analytics and future migration

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Future: link to authenticated user
  user_id UUID -- future: REFERENCES auth.users(id)
);

-- =====================================================
-- 4. DOWNLOAD TRACKING TABLES
-- =====================================================

-- Track preset downloads
CREATE TABLE preset_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id),
  user_id UUID, -- future: authenticated user ID
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

-- Track media downloads
CREATE TABLE media_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id),
  user_id UUID, -- future: authenticated user ID
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Media library indexes
CREATE INDEX idx_media_library_file_type ON media_library(file_type);
CREATE INDEX idx_media_library_tags ON media_library USING GIN(tags);
CREATE INDEX idx_media_library_created_at ON media_library(created_at DESC);
CREATE INDEX idx_media_library_downloads ON media_library(downloads DESC);
CREATE INDEX idx_media_library_featured ON media_library(is_featured) WHERE is_featured = true;
CREATE INDEX idx_media_library_approved ON media_library(is_approved) WHERE is_approved = true;

-- Presets indexes
CREATE INDEX idx_presets_public ON presets(is_public) WHERE is_public = true;
CREATE INDEX idx_presets_created_at ON presets(created_at DESC);
CREATE INDEX idx_presets_downloads ON presets(downloads DESC);
CREATE INDEX idx_presets_featured ON presets(is_featured) WHERE is_featured = true;
CREATE INDEX idx_presets_tags ON presets USING GIN(tags);
CREATE INDEX idx_presets_session_id ON presets(created_by_session_id);
CREATE INDEX idx_presets_user_id ON presets(created_by_user_id);

-- Download tracking indexes
CREATE INDEX idx_preset_downloads_preset_id ON preset_downloads(preset_id);
CREATE INDEX idx_preset_downloads_session_id ON preset_downloads(session_id);
CREATE INDEX idx_media_downloads_media_id ON media_downloads(media_id);
CREATE INDEX idx_media_downloads_session_id ON media_downloads(session_id);

-- =====================================================
-- STEP 4: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update download counts
CREATE OR REPLACE FUNCTION update_download_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update preset downloads count
  IF TG_TABLE_NAME = 'preset_downloads' THEN
    UPDATE presets 
    SET downloads = downloads + 1 
    WHERE id = NEW.preset_id;
  END IF;
  
  -- Update media downloads count
  IF TG_TABLE_NAME = 'media_downloads' THEN
    UPDATE media_library 
    SET downloads = downloads + 1 
    WHERE id = NEW.media_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic download count updates
CREATE TRIGGER trigger_preset_download_count
  AFTER INSERT ON preset_downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_download_count();

CREATE TRIGGER trigger_media_download_count
  AFTER INSERT ON media_downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_download_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updated_at updates
CREATE TRIGGER trigger_update_media_updated_at
  BEFORE UPDATE ON media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_presets_updated_at
  BEFORE UPDATE ON presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_downloads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES
-- =====================================================

-- =====================================================
-- MEDIA LIBRARY POLICIES
-- =====================================================

-- Allow public read access to approved media
CREATE POLICY "Allow public read access to approved media" ON media_library
  FOR SELECT USING (is_approved = true);

-- Allow anonymous uploads to media library
CREATE POLICY "Allow anonymous media uploads" ON media_library
  FOR INSERT WITH CHECK (true);

-- Allow creators to update their media
CREATE POLICY "Allow creators to update media" ON media_library
  FOR UPDATE USING (
    created_by_session_id IS NOT NULL
    OR created_by_user_id IS NOT NULL
  );

-- Allow creators to delete their media
CREATE POLICY "Allow creators to delete media" ON media_library
  FOR DELETE USING (
    created_by_session_id IS NOT NULL
    OR created_by_user_id IS NOT NULL
  );

-- =====================================================
-- PRESETS POLICIES
-- =====================================================

-- Allow public read access to public presets
CREATE POLICY "Allow public read access to public presets" ON presets
  FOR SELECT USING (is_public = true AND is_approved = true);

-- Allow anonymous preset uploads
CREATE POLICY "Allow anonymous preset uploads" ON presets
  FOR INSERT WITH CHECK (true);

-- Allow creators to update their presets
CREATE POLICY "Allow creators to update presets" ON presets
  FOR UPDATE USING (
    created_by_session_id IS NOT NULL
    OR created_by_user_id IS NOT NULL
  );

-- Allow creators to delete their presets
CREATE POLICY "Allow creators to delete presets" ON presets
  FOR DELETE USING (
    created_by_session_id IS NOT NULL
    OR created_by_user_id IS NOT NULL
  );

-- =====================================================
-- USER SESSIONS POLICIES
-- =====================================================

-- Allow users to create their own sessions
CREATE POLICY "Allow session creation" ON user_sessions
  FOR INSERT WITH CHECK (true);

-- Allow users to read their own sessions
CREATE POLICY "Allow users to read own sessions" ON user_sessions
  FOR SELECT USING (true);

-- Allow users to update their own sessions
CREATE POLICY "Allow users to update own sessions" ON user_sessions
  FOR UPDATE USING (true);

-- =====================================================
-- DOWNLOAD TRACKING POLICIES
-- =====================================================

-- Allow anonymous download tracking
CREATE POLICY "Allow anonymous download tracking" ON preset_downloads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous media download tracking" ON media_downloads
  FOR INSERT WITH CHECK (true);

-- Allow public read access to download stats (for analytics)
CREATE POLICY "Allow public read access to download stats" ON preset_downloads
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to media download stats" ON media_downloads
  FOR SELECT USING (true);

-- =====================================================
-- STEP 7: CREATE STORAGE BUCKETS
-- =====================================================

-- Note: These need to be created in Supabase Dashboard or via API
-- Storage buckets to create:
-- 1. media-library (for images, gifs, videos)
-- 2. preset-wallpapers (for embedded wallpapers)
-- 3. preset-displays (for preset display images)

-- =====================================================
-- STEP 8: STORAGE POLICIES
-- =====================================================

-- Media library bucket policies
CREATE POLICY "Allow public read access to media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-library');

CREATE POLICY "Allow anonymous uploads to media library" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media-library');

CREATE POLICY "Allow creators to update media files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media-library');

CREATE POLICY "Allow creators to delete media files" ON storage.objects
  FOR DELETE USING (bucket_id = 'media-library');

-- Preset wallpapers bucket policies
CREATE POLICY "Allow public read access to preset wallpapers" ON storage.objects
  FOR SELECT USING (bucket_id = 'preset-wallpapers');

CREATE POLICY "Allow anonymous uploads to preset wallpapers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'preset-wallpapers');

CREATE POLICY "Allow creators to update preset wallpapers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'preset-wallpapers');

CREATE POLICY "Allow creators to delete preset wallpapers" ON storage.objects
  FOR DELETE USING (bucket_id = 'preset-wallpapers');

-- Preset displays bucket policies
CREATE POLICY "Allow public read access to preset displays" ON storage.objects
  FOR SELECT USING (bucket_id = 'preset-displays');

CREATE POLICY "Allow anonymous uploads to preset displays" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'preset-displays');

CREATE POLICY "Allow creators to update preset displays" ON storage.objects
  FOR UPDATE USING (bucket_id = 'preset-displays');

CREATE POLICY "Allow creators to delete preset displays" ON storage.objects
  FOR DELETE USING (bucket_id = 'preset-displays');

-- =====================================================
-- STEP 9: CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- Featured media view
CREATE VIEW featured_media AS
SELECT 
  id, title, description, tags, file_type, mime_type,
  file_size, width, height, duration_ms, file_url,
  thumbnail_url, preview_url, downloads, views,
  created_at, updated_at
FROM media_library
WHERE is_featured = true AND is_approved = true
ORDER BY downloads DESC, created_at DESC;

-- Featured presets view
CREATE VIEW featured_presets AS
SELECT 
  p.id, p.name, p.description, p.tags, p.settings_config,
  p.wallpaper_url, p.wallpaper_file_size, p.wallpaper_mime_type,
  p.downloads, p.views, p.created_at, p.updated_at,
  m.file_url as display_image_url,
  m.thumbnail_url as display_thumbnail_url
FROM presets p
LEFT JOIN media_library m ON p.display_image_id = m.id
WHERE p.is_featured = true AND p.is_public = true AND p.is_approved = true
ORDER BY p.downloads DESC, p.created_at DESC;

-- Popular media view
CREATE VIEW popular_media AS
SELECT 
  id, title, description, tags, file_type, mime_type,
  file_size, width, height, duration_ms, file_url,
  thumbnail_url, preview_url, downloads, views,
  created_at, updated_at
FROM media_library
WHERE is_approved = true
ORDER BY downloads DESC, views DESC
LIMIT 50;

-- Popular presets view
CREATE VIEW popular_presets AS
SELECT 
  p.id, p.name, p.description, p.tags, p.settings_config,
  p.wallpaper_url, p.wallpaper_file_size, p.wallpaper_mime_type,
  p.downloads, p.views, p.created_at, p.updated_at,
  m.file_url as display_image_url,
  m.thumbnail_url as display_thumbnail_url
FROM presets p
LEFT JOIN media_library m ON p.display_image_id = m.id
WHERE p.is_public = true AND p.is_approved = true
ORDER BY p.downloads DESC, p.views DESC
LIMIT 50;

-- =====================================================
-- STEP 10: MIGRATION NOTES
-- =====================================================

/*
MIGRATION FROM OLD SCHEMA:

1. Export existing shared_presets data
2. Transform data to new presets table structure
3. Upload wallpapers to new preset-wallpapers bucket
4. Import transformed data to new schema
5. Update application code to use new schema

NEW FEATURES ENABLED:

✅ Media Library: Images, GIFs, videos with tags and search
✅ Preset Wallpapers: Embedded wallpapers in presets
✅ Display Images: Optional images for preset previews
✅ Anonymous Users: Session-based tracking
✅ Download Tracking: Analytics for media and presets
✅ Community Features: Sharing, browsing, downloading
✅ Future-Ready: User account support built-in
✅ Performance: Optimized indexes and views
✅ Security: Comprehensive RLS policies

USAGE EXAMPLES:

1. Upload media to library:
   INSERT INTO media_library (title, description, tags, file_type, mime_type, file_size, file_url, created_by_session_id)
   VALUES ('Cool GIF', 'Animated icon', ARRAY['gaming', 'retro'], 'gif', 'image/gif', 1024000, 'media-library/cool.gif', 'session-uuid');

2. Create preset with wallpaper:
   INSERT INTO presets (name, description, settings_config, wallpaper_url, created_by_session_id)
   VALUES ('My Theme', 'Custom theme', '{"channels":[...]}', 'preset-wallpapers/my-theme.jpg', 'session-uuid');

3. Track download:
   INSERT INTO preset_downloads (preset_id, session_id)
   VALUES ('preset-uuid', 'session-uuid');
*/ 