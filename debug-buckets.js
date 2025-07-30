// Diagnostic script to check storage buckets
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBuckets() {
  console.log('🔍 Checking storage buckets...\n');

  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      return;
    }

    console.log('📦 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    console.log(`\n📊 Total buckets: ${buckets.length}`);

    // Check if our required buckets exist
    const bucketNames = buckets.map(b => b.name);
    const requiredBuckets = ['presets', 'thumbnails'];
    
    console.log('\n🎯 Required buckets:');
    requiredBuckets.forEach(name => {
      const exists = bucketNames.includes(name);
      console.log(`  - ${name}: ${exists ? '✅ Found' : '❌ Missing'}`);
    });

    // Test access to each bucket
    console.log('\n🔐 Testing bucket access:');
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1 });
        
        if (error) {
          console.log(`  - ${bucket.name}: ❌ Access denied (${error.message})`);
        } else {
          console.log(`  - ${bucket.name}: ✅ Access granted`);
        }
      } catch (err) {
        console.log(`  - ${bucket.name}: ❌ Error (${err.message})`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugBuckets(); 
 
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBuckets() {
  console.log('🔍 Checking storage buckets...\n');

  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      return;
    }

    console.log('📦 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    console.log(`\n📊 Total buckets: ${buckets.length}`);

    // Check if our required buckets exist
    const bucketNames = buckets.map(b => b.name);
    const requiredBuckets = ['presets', 'thumbnails'];
    
    console.log('\n🎯 Required buckets:');
    requiredBuckets.forEach(name => {
      const exists = bucketNames.includes(name);
      console.log(`  - ${name}: ${exists ? '✅ Found' : '❌ Missing'}`);
    });

    // Test access to each bucket
    console.log('\n🔐 Testing bucket access:');
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1 });
        
        if (error) {
          console.log(`  - ${bucket.name}: ❌ Access denied (${error.message})`);
        } else {
          console.log(`  - ${bucket.name}: ✅ Access granted`);
        }
      } catch (err) {
        console.log(`  - ${bucket.name}: ❌ Error (${err.message})`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugBuckets(); 