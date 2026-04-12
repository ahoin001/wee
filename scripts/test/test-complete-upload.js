require('../load-env.cjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testCompleteUpload() {
  console.log('🧪 Testing complete preset upload flow...\n');
  
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
    
    // Test 2: Create test preset data
    console.log('\n2️⃣ Creating test preset data...');
    const testPresetData = {
      settings: {
        channels: [
          { name: 'Test Channel 1', url: 'https://example.com' },
          { name: 'Test Channel 2', url: 'https://example.com' }
        ],
        wallpaper: {
          url: 'userdata://wallpapers/test.jpg',
          mimeType: 'image/jpeg'
        }
      },
      wallpaper: new File(['test wallpaper'], 'test-wallpaper.jpg', { type: 'image/jpeg' }),
      customImage: new File(['test custom image'], 'test-custom.jpg', { type: 'image/jpeg' })
    };
    
    const testFormData = {
      name: 'Test Preset',
      description: 'A test preset with custom image',
      tags: ['test', 'demo'],
      creator_name: 'Test User'
    };
    
    console.log('✅ Test data created');
    
    // Test 3: Upload to preset-wallpapers
    console.log('\n3️⃣ Testing wallpaper upload...');
    const wallpaperFileName = `test-wallpaper-${Date.now()}.jpg`;
    const { data: wallpaperData, error: wallpaperError } = await supabase.storage
      .from('preset-wallpapers')
      .upload(wallpaperFileName, testPresetData.wallpaper, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (wallpaperError) {
      console.error('❌ Wallpaper upload failed:', wallpaperError);
    } else {
      console.log('✅ Wallpaper uploaded:', wallpaperData.path);
    }
    
    // Test 4: Upload to preset-displays
    console.log('\n4️⃣ Testing custom image upload...');
    const customImageFileName = `test-display-${Date.now()}.jpg`;
    const { data: customImageData, error: customImageError } = await supabase.storage
      .from('preset-displays')
      .upload(customImageFileName, testPresetData.customImage, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (customImageError) {
      console.error('❌ Custom image upload failed:', customImageError);
    } else {
      console.log('✅ Custom image uploaded:', customImageData.path);
    }
    
    // Test 5: List files in both buckets
    console.log('\n5️⃣ Listing files in buckets...');
    
    const { data: wallpaperFiles, error: wallpaperListError } = await supabase.storage
      .from('preset-wallpapers')
      .list('', { limit: 10 });
    
    if (wallpaperListError) {
      console.error('❌ Error listing wallpaper files:', wallpaperListError);
    } else {
      console.log('✅ Wallpaper files:');
      wallpaperFiles.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
      });
    }
    
    const { data: displayFiles, error: displayListError } = await supabase.storage
      .from('preset-displays')
      .list('', { limit: 10 });
    
    if (displayListError) {
      console.error('❌ Error listing display files:', displayListError);
    } else {
      console.log('✅ Display files:');
      displayFiles.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
      });
    }
    
    // Test 6: Clean up test files
    console.log('\n6️⃣ Cleaning up test files...');
    
    if (wallpaperData?.path) {
      const { error: removeWallpaperError } = await supabase.storage
        .from('preset-wallpapers')
        .remove([wallpaperData.path]);
      
      if (removeWallpaperError) {
        console.error('❌ Error removing wallpaper:', removeWallpaperError);
      } else {
        console.log('✅ Wallpaper cleaned up');
      }
    }
    
    if (customImageData?.path) {
      const { error: removeDisplayError } = await supabase.storage
        .from('preset-displays')
        .remove([customImageData.path]);
      
      if (removeDisplayError) {
        console.error('❌ Error removing display image:', removeDisplayError);
      } else {
        console.log('✅ Display image cleaned up');
      }
    }
    
    console.log('\n🎉 Complete upload test finished!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteUpload(); 