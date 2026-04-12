require('../load-env.cjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('presets').select('count').limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test storage buckets
    console.log('\nTesting storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return false;
    }
    
    console.log('✅ Storage connection successful');
    console.log('Existing buckets:', buckets.map(b => b.name));
    
    // Check if required buckets exist
    const requiredBuckets = ['media-library', 'preset-wallpapers', 'preset-displays'];
    const existingBucketNames = buckets.map(b => b.name);
    
    console.log('\nChecking required buckets:');
    for (const bucketName of requiredBuckets) {
      if (existingBucketNames.includes(bucketName)) {
        console.log(`✅ ${bucketName} exists`);
      } else {
        console.log(`❌ ${bucketName} missing`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testSupabaseConnection().then(success => {
  if (success) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Tests failed!');
  }
  process.exit(success ? 0 : 1);
}); 