-- =====================================================
-- SUPABASE RLS POLICY SETUP FOR WEEDESKTOP LAUNCHER
-- =====================================================

-- STEP 1: DROP ALL EXISTING RLS POLICIES
-- =====================================================

-- Drop policies on shared_presets table
DROP POLICY IF EXISTS "Allow public read access" ON shared_presets;
DROP POLICY IF EXISTS "Allow anonymous uploads" ON shared_presets;
DROP POLICY IF EXISTS "Allow anonymous deletes" ON shared_presets;
DROP POLICY IF EXISTS "Enable read access for all users" ON shared_presets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON shared_presets;
DROP POLICY IF EXISTS "Enable update for users based on email" ON shared_presets;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON shared_presets;

-- Drop policies on storage.objects table
DROP POLICY IF EXISTS "Allow public read access to presets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to presets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to thumbnails bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to thumbnails bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- STEP 2: ENABLE RLS ON TABLES
-- =====================================================

-- Enable RLS on shared_presets table
ALTER TABLE shared_presets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- STEP 3: CREATE NEW RLS POLICIES
-- =====================================================

-- =====================================================
-- SHARED_PRESETS TABLE POLICIES
-- =====================================================

-- Policy 1: Allow anyone to read all presets (browse community)
CREATE POLICY "Allow public read access to presets" ON shared_presets
FOR SELECT USING (true);

-- Policy 2: Allow anyone to insert presets (upload anonymously)
CREATE POLICY "Allow anonymous preset uploads" ON shared_presets
FOR INSERT WITH CHECK (true);

-- Policy 3: Allow anyone to delete presets (anonymous deletion)
CREATE POLICY "Allow anonymous preset deletion" ON shared_presets
FOR DELETE USING (true);

-- Policy 4: Allow anyone to update presets (for download counts, etc.)
CREATE POLICY "Allow anonymous preset updates" ON shared_presets
FOR UPDATE USING (true);

-- Policy 5: Allow anyone to update download counts specifically
CREATE POLICY "Allow download count updates" ON shared_presets
FOR UPDATE USING (true) WITH CHECK (true);

-- =====================================================
-- STORAGE.OBJECTS TABLE POLICIES
-- =====================================================

-- Policy 1: Allow anyone to read preset files
CREATE POLICY "Allow public read access to preset files" ON storage.objects
FOR SELECT USING (bucket_id = 'presets');

-- Policy 2: Allow anyone to read thumbnail files
CREATE POLICY "Allow public read access to thumbnail files" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

-- Policy 3: Allow anyone to upload preset files
CREATE POLICY "Allow anonymous uploads to presets bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'presets');

-- Policy 4: Allow anyone to upload thumbnail files
CREATE POLICY "Allow anonymous uploads to thumbnails bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'thumbnails');

-- Policy 5: Allow anyone to delete preset files
CREATE POLICY "Allow anonymous deletion from presets bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'presets');

-- Policy 6: Allow anyone to delete thumbnail files
CREATE POLICY "Allow anonymous deletion from thumbnails bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'thumbnails');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('shared_presets', 'objects') 
AND schemaname IN ('public', 'storage');

-- List all policies on shared_presets table
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
WHERE tablename = 'shared_presets';

-- List all policies on storage.objects table
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
WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- TEST QUERIES (Run these to verify policies work)
-- =====================================================

-- Test 1: Try to read presets (should work)
-- SELECT * FROM shared_presets LIMIT 5;

-- Test 2: Try to read storage files (should work)
-- SELECT * FROM storage.objects WHERE bucket_id = 'presets' LIMIT 5;

-- Test 3: Try to insert a preset (should work)
-- INSERT INTO shared_presets (name, description, creator_name, preset_file_url, thumbnail_url, file_size, downloads)
-- VALUES ('Test Preset', 'Test Description', 'Anonymous', 'test.json', 'test.png', 1024, 0);

-- Test 4: Try to delete a preset (should work)
-- DELETE FROM shared_presets WHERE name = 'Test Preset';

-- =====================================================
-- NOTES
-- =====================================================

/*
WHAT USERS CAN DO:
✅ Browse all community presets
✅ Download any preset
✅ Upload presets anonymously
✅ Delete presets anonymously
✅ View thumbnails
✅ Upload thumbnails

WHAT USERS CANNOT DO:
❌ Access other tables (not shared_presets or storage.objects)
❌ Modify database structure
❌ Access admin functions
❌ Bypass RLS policies

SECURITY:
- All operations are controlled by RLS policies
- Users can only access what we explicitly allow
- No authentication required for community features
- Anonymous uploads and downloads work for all users
*/ 