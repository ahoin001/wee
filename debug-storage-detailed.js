// Detailed storage diagnostic script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔑 API Key type:', supabaseKey?.startsWith('sb_publishable_') ? 'Publishable' : 'Service Role');

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStorageDetailed() {
  console.log('\n🧪 Detailed storage diagnostic...\n');

  try {
    // Test 1: Check if we can access storage at all
    console.log('1. Testing basic storage access...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    console.log('📊 Bucket listing result:');
    console.log('  - Data:', buckets);
    console.log('  - Error:', listError);
    console.log('  - Bucket count:', buckets?.length || 0);

    if (listError) {
      console.log('❌ Storage access failed:', listError.message);
      console.log('🔍 Error details:', JSON.stringify(listError, null, 2));
    }

    // Test 2: Try to access specific buckets directly
    console.log('\n2. Testing direct bucket access...');
    
    const bucketNames = ['presets', 'thumbnails'];
    for (const bucketName of bucketNames) {
      console.log(`\n   Testing bucket: ${bucketName}`);
      
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
        
        console.log(`   - Success: ${!error}`);
        console.log(`   - Data:`, data);
        console.log(`   - Error:`, error?.message || 'None');
      } catch (err) {
        console.log(`   - Exception:`, err.message);
      }
    }

    // Test 3: Try to upload a test file
    console.log('\n3. Testing file upload...');
    try {
      const testFile = new Blob(['{"test": "data"}'], { type: 'application/json' });
      const testFileName = `test-${Date.now()}.json`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('presets')
        .upload(testFileName, testFile);
      
      console.log('   - Upload success:', !uploadError);
      console.log('   - Upload data:', uploadData);
      console.log('   - Upload error:', uploadError?.message || 'None');
      
      if (uploadData) {
        // Clean up
        await supabase.storage
          .from('presets')
          .remove([testFileName]);
        console.log('   - Test file cleaned up');
      }
    } catch (err) {
      console.log('   - Upload exception:', err.message);
    }

    // Test 4: Check RLS policies
    console.log('\n4. Checking RLS status...');
    try {
      const { data: policies, error: policyError } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(1);
      
      console.log('   - RLS query success:', !policyError);
      console.log('   - Policy error:', policyError?.message || 'None');
    } catch (err) {
      console.log('   - RLS check exception:', err.message);
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Full error:', error);
  }
}

debugStorageDetailed(); 
 
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔑 API Key type:', supabaseKey?.startsWith('sb_publishable_') ? 'Publishable' : 'Service Role');

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStorageDetailed() {
  console.log('\n🧪 Detailed storage diagnostic...\n');

  try {
    // Test 1: Check if we can access storage at all
    console.log('1. Testing basic storage access...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    console.log('📊 Bucket listing result:');
    console.log('  - Data:', buckets);
    console.log('  - Error:', listError);
    console.log('  - Bucket count:', buckets?.length || 0);

    if (listError) {
      console.log('❌ Storage access failed:', listError.message);
      console.log('🔍 Error details:', JSON.stringify(listError, null, 2));
    }

    // Test 2: Try to access specific buckets directly
    console.log('\n2. Testing direct bucket access...');
    
    const bucketNames = ['presets', 'thumbnails'];
    for (const bucketName of bucketNames) {
      console.log(`\n   Testing bucket: ${bucketName}`);
      
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
        
        console.log(`   - Success: ${!error}`);
        console.log(`   - Data:`, data);
        console.log(`   - Error:`, error?.message || 'None');
      } catch (err) {
        console.log(`   - Exception:`, err.message);
      }
    }

    // Test 3: Try to upload a test file
    console.log('\n3. Testing file upload...');
    try {
      const testFile = new Blob(['{"test": "data"}'], { type: 'application/json' });
      const testFileName = `test-${Date.now()}.json`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('presets')
        .upload(testFileName, testFile);
      
      console.log('   - Upload success:', !uploadError);
      console.log('   - Upload data:', uploadData);
      console.log('   - Upload error:', uploadError?.message || 'None');
      
      if (uploadData) {
        // Clean up
        await supabase.storage
          .from('presets')
          .remove([testFileName]);
        console.log('   - Test file cleaned up');
      }
    } catch (err) {
      console.log('   - Upload exception:', err.message);
    }

    // Test 4: Check RLS policies
    console.log('\n4. Checking RLS status...');
    try {
      const { data: policies, error: policyError } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(1);
      
      console.log('   - RLS query success:', !policyError);
      console.log('   - Policy error:', policyError?.message || 'None');
    } catch (err) {
      console.log('   - RLS check exception:', err.message);
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Full error:', error);
  }
}

debugStorageDetailed(); 