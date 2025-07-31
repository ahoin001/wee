const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bmlcydwltfexgbsyunkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbGN5ZHdsdGZleGdic3l1bmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTMzNDAsImV4cCI6MjA2OTM4OTM0MH0.m1kx74I5ytK0dLFPFAwD18Q907wvE56jvyQr3otp5A4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAnonKey() {
  console.log('🔍 Testing Supabase connection with ANON KEY...\n');
  
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
      return;
    }
    
    console.log('✅ Storage connection successful');
    console.log('📦 Found buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Test 3: Test upload with anon key
    console.log('\n3️⃣ Testing upload with anon key...');
    if (buckets.length > 0) {
      const testBucket = buckets[0].name;
      console.log(`Testing upload to: ${testBucket}`);
      
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(testBucket)
        .upload(`test-anon-${Date.now()}.txt`, testFile, {
          upsert: false
        });
      
      if (uploadError) {
        console.error(`❌ Upload test failed:`, uploadError);
      } else {
        console.log(`✅ Upload test successful to ${testBucket}`);
        
        // Clean up
        await supabase.storage
          .from(testBucket)
          .remove([uploadData.path]);
        console.log('✅ Test file cleaned up');
      }
    }
    
    console.log('\n🎉 Anon key test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAnonKey(); 