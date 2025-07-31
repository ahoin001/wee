const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bmlcydwltfexgbsyunkf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbGN5ZHdsdGZleGdic3l1bmtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgxMzM0MCwiZXhwIjoyMDY5Mzg5MzQwfQ.bAAIvW06rnyPVdXTKL2BL790JczCaCJiMr8fAx8PhQY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkBucketNames() {
  console.log('🔍 Testing Supabase connection with SERVICE ROLE...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic database connection...');
    const { data: dbTest, error: dbError } = await supabase.from('presets').select('count').limit(1);
    
    if (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return;
    }
    console.log('✅ Database connection successful');
    
    // Test 2: Storage connection
    console.log('\n2️⃣ Testing storage connection...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage connection failed:', bucketError);
      console.error('Error details:', {
        message: bucketError.message,
        statusCode: bucketError.statusCode,
        details: bucketError.details
      });
      return;
    }
    
    console.log('✅ Storage connection successful');
    console.log('📦 Found buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Test 3: Check specific buckets
    console.log('\n3️⃣ Checking expected buckets...');
    const expectedBuckets = ['preset-wallpapers', 'preset-displays', 'media-library'];
    const existingBuckets = buckets.map(b => b.name);
    
    expectedBuckets.forEach(expected => {
      if (existingBuckets.includes(expected)) {
        console.log(`  ✅ ${expected} exists`);
      } else {
        console.log(`  ❌ ${expected} missing`);
      }
    });
    
    // Test 4: Try to access a bucket (test permissions)
    console.log('\n4️⃣ Testing bucket access permissions...');
    const testBucket = existingBuckets[0]; // Use first available bucket
    if (testBucket) {
      console.log(`Testing access to bucket: ${testBucket}`);
      
      try {
        const { data: files, error: listError } = await supabase.storage
          .from(testBucket)
          .list('', { limit: 1 });
        
        if (listError) {
          console.error(`❌ Cannot list files in ${testBucket}:`, listError);
        } else {
          console.log(`✅ Can access ${testBucket} (found ${files?.length || 0} files)`);
        }
      } catch (error) {
        console.error(`❌ Error accessing ${testBucket}:`, error);
      }
    }
    
    // Test 5: Check RLS policies
    console.log('\n5️⃣ Checking RLS policies...');
    try {
      const { data: policies, error: policyError } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('table_name', 'objects')
        .eq('table_schema', 'storage');
      
      if (policyError) {
        console.log('⚠️  Cannot check RLS policies:', policyError);
      } else {
        console.log(`✅ Found ${policies?.length || 0} storage policies`);
        policies?.forEach(policy => {
          console.log(`  - ${policy.policyname} (${policy.cmd})`);
        });
      }
    } catch (error) {
      console.log('⚠️  Cannot check RLS policies:', error.message);
    }
    
    // Test 6: Test upload permission (dry run)
    console.log('\n6️⃣ Testing upload permissions...');
    const testBucketForUpload = existingBuckets.find(b => b.includes('wallpaper') || b.includes('media'));
    if (testBucketForUpload) {
      console.log(`Testing upload to: ${testBucketForUpload}`);
      
      // Create a small test file
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(testBucketForUpload)
          .upload(`test-${Date.now()}.txt`, testFile, {
            upsert: false
          });
        
        if (uploadError) {
          console.error(`❌ Upload test failed:`, uploadError);
          console.error('Error details:', {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            details: uploadError.details
          });
        } else {
          console.log(`✅ Upload test successful to ${testBucketForUpload}`);
          
          // Clean up test file
          try {
            await supabase.storage
              .from(testBucketForUpload)
              .remove([uploadData.path]);
            console.log('✅ Test file cleaned up');
          } catch (cleanupError) {
            console.log('⚠️  Could not clean up test file (this is okay)');
          }
        }
      } catch (error) {
        console.error(`❌ Upload test exception:`, error);
      }
    } else {
      console.log('⚠️  No suitable bucket found for upload test');
    }
    
    console.log('\n🎉 Connection test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    console.error('Stack trace:', error.stack);
  }
}

checkBucketNames(); 