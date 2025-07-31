const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bmlcydwltfexgbsyunkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbGN5ZHdsdGZleGdic3l1bmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTMzNDAsImV4cCI6MjA2OTM4OTM0MH0.m1kx74I5ytK0dLFPFAwD18Q907wvE56jvyQr3otp5A4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createStorageBuckets() {
  console.log('Creating Supabase storage buckets...');
  
  const requiredBuckets = [
    {
      name: 'media-library',
      description: 'For images, gifs, and videos used in channels and preset displays'
    },
    {
      name: 'preset-wallpapers', 
      description: 'For embedded wallpapers in presets'
    },
    {
      name: 'preset-displays',
      description: 'For display images used to represent presets'
    }
  ];
  
  for (const bucket of requiredBuckets) {
    try {
      console.log(`Creating bucket: ${bucket.name}...`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*'],
        fileSizeLimit: 52428800, // 50MB
        description: bucket.description
      });
      
      if (error) {
        console.error(`❌ Error creating bucket ${bucket.name}:`, error);
      } else {
        console.log(`✅ Successfully created bucket: ${bucket.name}`);
      }
    } catch (error) {
      console.error(`❌ Exception creating bucket ${bucket.name}:`, error);
    }
  }
  
  // Verify buckets were created
  console.log('\nVerifying buckets...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.error('❌ Error listing buckets:', bucketError);
  } else {
    console.log('✅ All buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
  }
}

createStorageBuckets().then(() => {
  console.log('\n✅ Bucket creation process completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Bucket creation failed:', error);
  process.exit(1);
}); 