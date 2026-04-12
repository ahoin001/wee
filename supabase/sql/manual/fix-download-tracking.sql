-- =====================================================
-- FIX DOWNLOAD TRACKING
-- =====================================================

-- Step 1: Check current policies
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

-- Step 2: Drop existing update policies
DROP POLICY IF EXISTS "Allow anonymous preset updates" ON shared_presets;
DROP POLICY IF EXISTS "Allow download count updates" ON shared_presets;
DROP POLICY IF EXISTS "Allow public update downloads" ON shared_presets;

-- Step 3: Create a simple, permissive update policy
CREATE POLICY "Allow download count updates" ON shared_presets
FOR UPDATE USING (true) WITH CHECK (true);

-- Step 4: Test the policy
-- This should work now:
-- UPDATE shared_presets SET downloads = downloads + 1 WHERE id = 1;

-- Step 5: Check if preset_downloads table exists and drop it if it does
DROP TABLE IF EXISTS preset_downloads;

-- Step 6: Verify the shared_presets table has the downloads column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'shared_presets' 
AND table_schema = 'public'
AND column_name = 'downloads';

-- Step 7: Test download count update manually
-- Replace '1' with an actual preset ID from your database
-- UPDATE shared_presets SET downloads = COALESCE(downloads, 0) + 1 WHERE id = 1; 