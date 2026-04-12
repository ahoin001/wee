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

async function testMediaLibrary() {
  console.log('🧪 Testing Media Library functionality...\n');
  
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
    
    // Test 2: Upload test media
    console.log('\n2️⃣ Uploading test media...');
    const testFile = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
    const testMetadata = {
      title: 'Test Gaming Image',
      description: 'A test image for gaming channels',
      tags: ['gaming', 'test', 'image']
    };
    
    const fileName = `${Date.now()}-test-image.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-library')
      .upload(fileName, testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return;
    }
    
    console.log('✅ File uploaded:', uploadData.path);
    
    // Test 3: Create media record
    console.log('\n3️⃣ Creating media record...');
    const { data: mediaData, error: insertError } = await supabase
      .from('media_library')
      .insert({
        title: testMetadata.title,
        description: testMetadata.description,
        tags: testMetadata.tags,
        file_type: 'image',
        mime_type: 'image/jpeg',
        file_size: testFile.size,
        file_url: uploadData.path,
        created_by_session_id: sessionId
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return;
    }
    
    console.log('✅ Media record created:', mediaData.id);
    console.log('✅ Tags saved:', mediaData.tags);
    
    // Test 4: Search media
    console.log('\n4️⃣ Testing media search...');
    
    // Search by title
    const { data: searchResults, error: searchError } = await supabase
      .from('media_library')
      .select('*')
      .ilike('title', '%gaming%')
      .eq('is_approved', true);
    
    if (searchError) {
      console.error('❌ Search error:', searchError);
    } else {
      console.log('✅ Search results:', searchResults.length);
      searchResults.forEach(item => {
        console.log(`  - ${item.title} (${item.file_type})`);
      });
    }
    
    // Test 5: Filter by file type
    console.log('\n5️⃣ Testing file type filtering...');
    const { data: imageResults, error: imageError } = await supabase
      .from('media_library')
      .select('*')
      .eq('file_type', 'image')
      .eq('is_approved', true);
    
    if (imageError) {
      console.error('❌ Image filter error:', imageError);
    } else {
      console.log('✅ Image files found:', imageResults.length);
    }
    
    // Test 6: Filter by tags
    console.log('\n6️⃣ Testing tag filtering...');
    const { data: gamingResults, error: gamingError } = await supabase
      .from('media_library')
      .select('*')
      .contains('tags', ['gaming'])
      .eq('is_approved', true);
    
    if (gamingError) {
      console.error('❌ Tag filter error:', gamingError);
    } else {
      console.log('✅ Gaming tagged media found:', gamingResults.length);
    }
    
    // Test 7: Download tracking
    console.log('\n7️⃣ Testing download tracking...');
    const { error: downloadTrackError } = await supabase
      .from('media_downloads')
      .insert({
        media_id: mediaData.id,
        session_id: sessionId
      });
    
    if (downloadTrackError) {
      console.error('❌ Download tracking error:', downloadTrackError);
    } else {
      console.log('✅ Download tracked successfully');
    }
    
    // Test 8: Get all unique tags
    console.log('\n8️⃣ Getting all unique tags...');
    const { data: allMedia, error: allError } = await supabase
      .from('media_library')
      .select('tags');
    
    if (allError) {
      console.error('❌ Error getting all media:', allError);
    } else {
      const allTags = [...new Set(allMedia.flatMap(item => item.tags || []))].sort();
      console.log('✅ All unique tags:', allTags);
    }
    
    // Test 9: Clean up test data
    console.log('\n9️⃣ Cleaning up test data...');
    const { error: deleteMediaError } = await supabase
      .from('media_library')
      .delete()
      .eq('id', mediaData.id);
    
    const { error: deleteSessionError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);
    
    const { error: deleteFileError } = await supabase.storage
      .from('media-library')
      .remove([uploadData.path]);
    
    if (deleteMediaError) {
      console.error('❌ Error deleting media record:', deleteMediaError);
    } else {
      console.log('✅ Media record cleaned up');
    }
    
    if (deleteSessionError) {
      console.error('❌ Error deleting session:', deleteSessionError);
    } else {
      console.log('✅ Session cleaned up');
    }
    
    if (deleteFileError) {
      console.error('❌ Error deleting file:', deleteFileError);
    } else {
      console.log('✅ File cleaned up');
    }
    
    console.log('\n🎉 Media Library test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMediaLibrary(); 