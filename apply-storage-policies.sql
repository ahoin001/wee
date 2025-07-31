-- =====================================================
-- APPLY STORAGE POLICIES FOR SUPABASE BUCKETS
-- =====================================================
-- This script applies the necessary RLS policies for storage buckets
-- Run this in your Supabase SQL Editor

-- First, enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to media files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to media library" ON storage.objects;
DROP POLICY IF EXISTS "Allow creators to update media files" ON storage.objects;
DROP POLICY IF EXISTS "Allow creators to delete media files" ON storage.objects;

DROP POLICY IF EXISTS "Allow public read access to preset wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to preset wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Allow creators to update preset wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Allow creators to delete preset wallpapers" ON storage.objects;

DROP POLICY IF EXISTS "Allow public read access to preset displays" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to preset displays" ON storage.objects;
DROP POLICY IF EXISTS "Allow creators to update preset displays" ON storage.objects;
DROP POLICY IF EXISTS "Allow creators to delete preset displays" ON storage.objects;

-- =====================================================
-- MEDIA LIBRARY BUCKET POLICIES
-- =====================================================

-- Allow public read access to media files
CREATE POLICY "Allow public read access to media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-library');

-- Allow anonymous uploads to media library
CREATE POLICY "Allow anonymous uploads to media library" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media-library');

-- Allow creators to update media files
CREATE POLICY "Allow creators to update media files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media-library');

-- Allow creators to delete media files
CREATE POLICY "Allow creators to delete media files" ON storage.objects
  FOR DELETE USING (bucket_id = 'media-library');

-- =====================================================
-- PRESET WALLPAPERS BUCKET POLICIES
-- =====================================================

-- Allow public read access to preset wallpapers
CREATE POLICY "Allow public read access to preset wallpapers" ON storage.objects
  FOR SELECT USING (bucket_id = 'preset-wallpapers');

-- Allow anonymous uploads to preset wallpapers
CREATE POLICY "Allow anonymous uploads to preset wallpapers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'preset-wallpapers');

-- Allow creators to update preset wallpapers
CREATE POLICY "Allow creators to update preset wallpapers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'preset-wallpapers');

-- Allow creators to delete preset wallpapers
CREATE POLICY "Allow creators to delete preset wallpapers" ON storage.objects
  FOR DELETE USING (bucket_id = 'preset-wallpapers');

-- =====================================================
-- PRESET DISPLAYS BUCKET POLICIES
-- =====================================================

-- Allow public read access to preset displays
CREATE POLICY "Allow public read access to preset displays" ON storage.objects
  FOR SELECT USING (bucket_id = 'preset-displays');

-- Allow anonymous uploads to preset displays
CREATE POLICY "Allow anonymous uploads to preset displays" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'preset-displays');

-- Allow creators to update preset displays
CREATE POLICY "Allow creators to update preset displays" ON storage.objects
  FOR UPDATE USING (bucket_id = 'preset-displays');

-- Allow creators to delete preset displays
CREATE POLICY "Allow creators to delete preset displays" ON storage.objects
  FOR DELETE USING (bucket_id = 'preset-displays');

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- You can run this to verify the policies were created:

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname; 