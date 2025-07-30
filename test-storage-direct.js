// Test script for direct storage access
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔑 API Key (first 20 chars):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageDirect() {
  console.log('\n🧪 Testing direct storage access...\n');

  try {
    // Test 1: Try to list buckets
    console.log('1. Testing bucket listing...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      console.error('Error details:', listError);
    } else {
      console.log('✅ Bucket listing successful');
      console.log('📦 Found buckets:', buckets?.length || 0);
      buckets?.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }

    // Test 2: Try to access presets bucket directly
    console.log('\n2. Testing direct presets bucket access...');
    const { data: presetsFiles, error: presetsError } = await supabase.storage
      .from('presets')
      .list('', { limit: 10 });
    
    if (presetsError) {
      console.error('❌ Error accessing presets bucket:', presetsError.message);
    } else {
      console.log('✅ Presets bucket accessible');
      console.log('📁 Files in presets:', presetsFiles?.length || 0);
    }

    // Test 3: Try to access thumbnails bucket directly
    console.log('\n3. Testing direct thumbnails bucket access...');
    const { data: thumbnailsFiles, error: thumbnailsError } = await supabase.storage
      .from('thumbnails')
      .list('', { limit: 10 });
    
    if (thumbnailsError) {
      console.error('❌ Error accessing thumbnails bucket:', thumbnailsError.message);
    } else {
      console.log('✅ Thumbnails bucket accessible');
      console.log('📁 Files in thumbnails:', thumbnailsFiles?.length || 0);
    }

    // Test 4: Try to upload a test file
    console.log('\n4. Testing file upload...');
    const testFile = new Blob(['{"test": "data"}'], { type: 'application/json' });
    const testFileName = `test-${Date.now()}.json`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('presets')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError.message);
    } else {
      console.log('✅ File upload successful');
      console.log('📁 Uploaded file:', uploadData.path);
      
      // Clean up
      await supabase.storage
        .from('presets')
        .remove([testFileName]);
      console.log('🧹 Test file cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testStorageDirect(); 
 
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔑 API Key (first 20 chars):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageDirect() {
  console.log('\n🧪 Testing direct storage access...\n');

  try {
    // Test 1: Try to list buckets
    console.log('1. Testing bucket listing...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      console.error('Error details:', listError);
    } else {
      console.log('✅ Bucket listing successful');
      console.log('📦 Found buckets:', buckets?.length || 0);
      buckets?.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }

    // Test 2: Try to access presets bucket directly
    console.log('\n2. Testing direct presets bucket access...');
    const { data: presetsFiles, error: presetsError } = await supabase.storage
      .from('presets')
      .list('', { limit: 10 });
    
    if (presetsError) {
      console.error('❌ Error accessing presets bucket:', presetsError.message);
    } else {
      console.log('✅ Presets bucket accessible');
      console.log('📁 Files in presets:', presetsFiles?.length || 0);
    }

    // Test 3: Try to access thumbnails bucket directly
    console.log('\n3. Testing direct thumbnails bucket access...');
    const { data: thumbnailsFiles, error: thumbnailsError } = await supabase.storage
      .from('thumbnails')
      .list('', { limit: 10 });
    
    if (thumbnailsError) {
      console.error('❌ Error accessing thumbnails bucket:', thumbnailsError.message);
    } else {
      console.log('✅ Thumbnails bucket accessible');
      console.log('📁 Files in thumbnails:', thumbnailsFiles?.length || 0);
    }

    // Test 4: Try to upload a test file
    console.log('\n4. Testing file upload...');
    const testFile = new Blob(['{"test": "data"}'], { type: 'application/json' });
    const testFileName = `test-${Date.now()}.json`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('presets')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError.message);
    } else {
      console.log('✅ File upload successful');
      console.log('📁 Uploaded file:', uploadData.path);
      
      // Clean up
      await supabase.storage
        .from('presets')
        .remove([testFileName]);
      console.log('🧹 Test file cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testStorageDirect(); 