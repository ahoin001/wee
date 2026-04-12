// Test script to verify Supabase setup
// Run: node scripts/test/test-supabase.js

require('../load-env.cjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  console.error('Copy .env.example to .env and set values.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseSetup() {
  console.log('🧪 Testing Supabase setup...\n');
  
  try {
    // Test 1: Database connection
    console.log('1. Testing database connection...');
    const { data: presets, error: dbError } = await supabase
      .from('shared_presets')
      .select('count')
      .limit(1);

      console.log('✅ Database presets: ', presets);
    
    if (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      return false;
    }
    console.log('✅ Database connection successful');

    // Test 2: Storage buckets
    console.log('\n2. Testing storage buckets...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    console.log('\n2. Logging buckets: ', buckets);
    if (storageError) {
      console.error('❌ Storage access failed:', storageError.message);
      return false;
    }

    const bucketNames = buckets.map(b => b.name);
    const requiredBuckets = ['presets', 'thumbnails'];
    const missingBuckets = requiredBuckets.filter(name => !bucketNames.includes(name));

    if (missingBuckets.length > 0) {
      console.error('❌ Missing storage buckets:', missingBuckets);
      return false;
    }
    console.log('✅ Storage buckets accessible');

    // Test 3: File upload (test)
    console.log('\n3. Testing file upload...');
    const testFile = new Blob(['{"test": "data"}'], { type: 'application/json' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('presets')
      .upload(`test-${Date.now()}.json`, testFile);

    if (uploadError) {
      console.error('❌ File upload failed:', uploadError.message);
      return false;
    }
    console.log('✅ File upload successful');

    // Clean up test file
    await supabase.storage
      .from('presets')
      .remove([uploadData.path]);

    console.log('\n🎉 All tests passed! Supabase is ready to use.');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testSupabaseSetup().then(success => {
  if (!success) {
    process.exit(1);
  }
}); 