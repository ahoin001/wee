require('../load-env.cjs');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testTagsUpload() {
  console.log('🧪 Testing preset upload with tags...\n');
  
  try {
    // Test 1: Create a session first
    console.log('1️⃣ Creating test session...');
    const sessionId = uuidv4();
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        session_token: `test-token-${Date.now()}`,
        ip_address: '127.0.0.1',
        user_agent: 'test-agent'
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      return;
    }
    
    console.log('✅ Session created:', sessionData.id);
    
    // Test 2: Create test preset with tags
    console.log('\n2️⃣ Creating test preset with tags...');
    const testPresetData = {
      settings: {
        channels: [
          { name: 'Gaming Channel', url: 'https://example.com' },
          { name: 'Music Channel', url: 'https://example.com' }
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
      name: 'Gaming Setup Preset',
      description: 'A gaming-themed preset with dark colors',
      tags: ['gaming', 'dark theme', 'minimal'],
      creator_name: 'GameMaster'
    };
    
    console.log('✅ Test data created with tags:', testFormData.tags);
    
    // Test 3: Insert preset with tags into database
    console.log('\n3️⃣ Inserting preset with tags into database...');
    const presetRecord = {
      name: testFormData.name,
      description: testFormData.description,
      tags: testFormData.tags,
      settings_config: testPresetData.settings,
      wallpaper_url: 'test-wallpaper.jpg',
      display_image_url: 'test-display.jpg',
      created_by_session_id: sessionId
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('presets')
      .insert(presetRecord)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error inserting preset:', insertError);
      return;
    }
    
    console.log('✅ Preset inserted with ID:', insertData.id);
    console.log('✅ Tags saved:', insertData.tags);
    
    // Test 4: Query presets with tag filtering
    console.log('\n4️⃣ Testing tag filtering...');
    
    // Test filtering by specific tag
    const { data: gamingPresets, error: gamingError } = await supabase
      .from('presets')
      .select('*')
      .contains('tags', ['gaming']);
    
    if (gamingError) {
      console.error('❌ Error querying gaming presets:', gamingError);
    } else {
      console.log('✅ Gaming presets found:', gamingPresets.length);
      gamingPresets.forEach(preset => {
        console.log(`  - ${preset.name} (tags: ${preset.tags?.join(', ')})`);
      });
    }
    
    // Test filtering by dark theme tag
    const { data: darkPresets, error: darkError } = await supabase
      .from('presets')
      .select('*')
      .contains('tags', ['dark theme']);
    
    if (darkError) {
      console.error('❌ Error querying dark theme presets:', darkError);
    } else {
      console.log('✅ Dark theme presets found:', darkPresets.length);
      darkPresets.forEach(preset => {
        console.log(`  - ${preset.name} (tags: ${preset.tags?.join(', ')})`);
      });
    }
    
    // Test 5: Get all unique tags
    console.log('\n5️⃣ Getting all unique tags...');
    const { data: allPresets, error: allError } = await supabase
      .from('presets')
      .select('tags');
    
    if (allError) {
      console.error('❌ Error getting all presets:', allError);
    } else {
      const allTags = [...new Set(allPresets.flatMap(preset => preset.tags || []))].sort();
      console.log('✅ All unique tags:', allTags);
    }
    
    // Test 6: Clean up test data
    console.log('\n6️⃣ Cleaning up test data...');
    const { error: deletePresetError } = await supabase
      .from('presets')
      .delete()
      .eq('id', insertData.id);
    
    const { error: deleteSessionError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (deletePresetError) {
      console.error('❌ Error deleting test preset:', deletePresetError);
    } else {
      console.log('✅ Test preset cleaned up');
    }
    
    if (deleteSessionError) {
      console.error('❌ Error deleting test session:', deleteSessionError);
    } else {
      console.log('✅ Test session cleaned up');
    }
    
    console.log('\n🎉 Tags test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTagsUpload(); 