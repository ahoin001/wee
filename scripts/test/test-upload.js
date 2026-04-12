require('../load-env.cjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testUpload() {
  console.log('🧪 Testing upload functionality...\n');
  
  try {
    // Test 1: List buckets
    console.log('1️⃣ Listing buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return;
    }
    
    console.log('✅ Found buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Test 2: Upload to preset-wallpapers
    console.log('\n2️⃣ Testing upload to preset-wallpapers...');
    const testBlob = new Blob(['test wallpaper content'], { type: 'image/jpeg' });
    const testFile = new File([testBlob], 'test-wallpaper.jpg', { type: 'image/jpeg' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('preset-wallpapers')
      .upload(`test-${Date.now()}.jpg`, testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return;
    }
    
    console.log('✅ Upload successful:', uploadData.path);
    
    // Test 3: List files in bucket
    console.log('\n3️⃣ Listing files in preset-wallpapers...');
    const { data: files, error: listError } = await supabase.storage
      .from('preset-wallpapers')
      .list('', { limit: 10 });
    
    if (listError) {
      console.error('❌ Error listing files:', listError);
    } else {
      console.log('✅ Files in bucket:');
      files.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
      });
    }
    
    // Test 4: Clean up test file
    console.log('\n4️⃣ Cleaning up test file...');
    const { error: removeError } = await supabase.storage
      .from('preset-wallpapers')
      .remove([uploadData.path]);
    
    if (removeError) {
      console.error('❌ Error removing file:', removeError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Upload test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUpload(); 