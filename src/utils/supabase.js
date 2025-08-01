import { createClient } from '@supabase/supabase-js'

// Built-in Supabase configuration for community features
const SUPABASE_URL = 'https://bmlcydwltfexgbsyunkf.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbGN5ZHdsdGZleGdic3l1bmtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgxMzM0MCwiZXhwIjoyMDY5Mzg5MzQwfQ.bAAIvW06rnyPVdXTKL2BL790JczCaCJiMr8fAx8PhQY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('[SUPABASE] Client created with service role for full access');

// =====================================================
// SESSION MANAGEMENT
// =====================================================

export const createSession = async () => {
  const sessionToken = crypto.randomUUID()
  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      session_token: sessionToken,
      ip_address: null, // Will be set by backend
      user_agent: navigator.userAgent
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getSessionId = () => {
  return localStorage.getItem('wii_session_id')
}

export const setSessionId = (sessionId) => {
  localStorage.setItem('wii_session_id', sessionId)
}

export const ensureSession = async () => {
  let sessionId = getSessionId()
  if (!sessionId) {
    const session = await createSession()
    sessionId = session.id
    setSessionId(sessionId)
  }
  return sessionId
}

// =====================================================
// MEDIA LIBRARY FUNCTIONS
// =====================================================

export const uploadMedia = async (file, metadata) => {
  try {
    const sessionId = await ensureSession()
    const fileName = `${Date.now()}-${file.name}`
    
    // Determine file type
    let fileType = 'image'
    if (file.type.includes('gif')) fileType = 'gif'
    else if (file.type.includes('video')) fileType = 'video'
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from('media-library')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Create media record
    const { data: mediaData, error: insertError } = await supabase
      .from('media_library')
      .insert({
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags || [],
        file_type: fileType,
        mime_type: file.type,
        file_size: file.size,
        file_url: data.path,
        created_by_session_id: sessionId
      })
      .select()
      .single()
    
    if (insertError) {
      return { success: false, error: insertError.message }
    }
    
    return { success: true, data: mediaData }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const searchMedia = async (filters = {}) => {
  try {
    let queryBuilder = supabase
      .from('media_library')
      .select('*')
      .eq('is_approved', true)
    
    // Search by title, description, or tags
    if (filters.searchTerm) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,tags.cs.{${filters.searchTerm}}`
      )
    }
    
    // Filter by file type
    if (filters.fileType && filters.fileType !== 'all') {
      queryBuilder = queryBuilder.eq('file_type', filters.fileType)
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', filters.tags)
    }
    
    // Apply sorting
    const sortBy = filters.sortBy || 'created_at'
    switch (sortBy) {
      case 'title_asc':
        queryBuilder = queryBuilder.order('title', { ascending: true })
        break
      case 'title_desc':
        queryBuilder = queryBuilder.order('title', { ascending: false })
        break
      case 'downloads':
        queryBuilder = queryBuilder.order('downloads', { ascending: false })
        break
      case 'created_at':
      default:
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
    }
    
    // Pagination
    const page = filters.page || 1
    const limit = filters.limit || 12
    const offset = (page - 1) * limit
    
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)
    
    const { data, error } = await queryBuilder
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const downloadMedia = async (mediaId) => {
  try {
    const sessionId = await ensureSession()
    
    // Get media info
    const { data: media, error: mediaError } = await supabase
      .from('media_library')
      .select('*')
      .eq('id', mediaId)
      .single()
    
    if (mediaError) {
      return { success: false, error: mediaError.message }
    }
    
    // Track download
    await supabase
      .from('media_downloads')
      .insert({
        media_id: mediaId,
        session_id: sessionId
      })
    
    // Download file
    const { data: fileData, error: fileError } = await supabase.storage
      .from('media-library')
      .download(media.file_url)
    
    if (fileError) {
      return { success: false, error: fileError.message }
    }
    
    return {
      success: true,
      data: await fileData.arrayBuffer(),
      mimeType: media.mime_type,
      fileName: media.file_url.split('/').pop()
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// THUMBNAIL GENERATION
// =====================================================

export const generatePresetThumbnail = async (presetData) => {
  try {
    console.log('[SUPABASE] Generating preset thumbnail...');
    
    // Create a canvas to generate thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 200;
    
    // Draw background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, 300, 200);
    
    // Draw gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 123, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 123, 255, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 200);
    
    // Add preset name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(presetData.name || 'Preset', 150, 80);
    
    // Add channel count
    const channelCount = presetData.channels?.length || 0;
    ctx.font = '14px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`${channelCount} channels`, 150, 110);
    
    // Add creator info
    if (presetData.creator_name) {
      ctx.font = '12px Arial';
      ctx.fillStyle = '#999999';
      ctx.fillText(`by ${presetData.creator_name}`, 150, 130);
    }
    
    // Add Wii-style border
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, 290, 190);
    
    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png', 0.9);
    });
  } catch (error) {
    console.error('[SUPABASE] Error generating thumbnail:', error);
    return null;
  }
};

// =====================================================
// PRESET FUNCTIONS
// =====================================================

export const uploadPreset = async (presetData, formData) => {
  console.log('[SUPABASE] Starting uploadPreset...');
  console.log('[SUPABASE] Preset data:', { 
    hasSettings: !!presetData.settings, 
    hasWallpaper: !!presetData.wallpaper,
    hasCustomImage: !!presetData.customImage
  });
  console.log('[SUPABASE] Form data:', formData);
  
  const sessionId = await ensureSession()
  console.log('[SUPABASE] Session ID:', sessionId);
  
  // Upload wallpaper if provided
  let wallpaperUrl = null
  let wallpaperFile = null
  
  if (presetData.wallpaper) {
    console.log('[SUPABASE] Uploading wallpaper...');
    wallpaperFile = presetData.wallpaper
    const wallpaperFileName = `${Date.now()}-wallpaper-${wallpaperFile.name}`
    console.log('[SUPABASE] Wallpaper filename:', wallpaperFileName);
    console.log('[SUPABASE] Wallpaper size:', wallpaperFile.size);
    console.log('[SUPABASE] Wallpaper type:', wallpaperFile.type);
    console.log('[SUPABASE] Wallpaper instanceof File:', wallpaperFile instanceof File);
    console.log('[SUPABASE] Wallpaper instanceof Blob:', wallpaperFile instanceof Blob);
    
    try {
      console.log('[SUPABASE] Attempting wallpaper upload...');
      const { data: wallpaperData, error: wallpaperError } = await supabase.storage
        .from('preset-wallpapers')
        .upload(wallpaperFileName, wallpaperFile, {
          cacheControl: '3600',
          upsert: false
        })
      
      console.log('[SUPABASE] Wallpaper upload result:', { 
        data: wallpaperData, 
        error: wallpaperError,
        errorMessage: wallpaperError?.message 
      });
      
      if (wallpaperError) {
        console.error('[SUPABASE] Wallpaper upload error:', wallpaperError);
        console.error('[SUPABASE] Error details:', {
          message: wallpaperError.message,
          statusCode: wallpaperError.statusCode,
          details: wallpaperError.details
        });
        throw wallpaperError;
      }
      
      wallpaperUrl = wallpaperData.path
      console.log('[SUPABASE] Wallpaper URL set to:', wallpaperUrl);
    } catch (error) {
      console.error('[SUPABASE] Error uploading wallpaper:', error);
      console.error('[SUPABASE] Error stack:', error.stack);
      throw error;
    }
  } else {
    console.log('[SUPABASE] No wallpaper to upload');
  }
  
  // Upload custom image if provided
  let customImageUrl = null
  let customImageFile = null
  
  if (presetData.customImage) {
    console.log('[SUPABASE] Uploading custom image...');
    customImageFile = presetData.customImage
    const customImageFileName = `${Date.now()}-display-${customImageFile.name}`
    console.log('[SUPABASE] Custom image filename:', customImageFileName);
    console.log('[SUPABASE] Custom image size:', customImageFile.size);
    console.log('[SUPABASE] Custom image type:', customImageFile.type);
    
    try {
      console.log('[SUPABASE] Attempting custom image upload...');
      const { data: customImageData, error: customImageError } = await supabase.storage
        .from('preset-displays')
        .upload(customImageFileName, customImageFile, {
          cacheControl: '3600',
          upsert: false
        })
      
      console.log('[SUPABASE] Custom image upload result:', { 
        data: customImageData, 
        error: customImageError,
        errorMessage: customImageError?.message 
      });
      
      if (customImageError) {
        console.error('[SUPABASE] Custom image upload error:', customImageError);
        console.error('[SUPABASE] Error details:', {
          message: customImageError.message,
          statusCode: customImageError.statusCode,
          details: customImageError.details
        });
        throw customImageError;
      }
      
      customImageUrl = customImageData.path
      console.log('[SUPABASE] Custom image URL set to:', customImageUrl);
    } catch (error) {
      console.error('[SUPABASE] Error uploading custom image:', error);
      console.error('[SUPABASE] Error stack:', error.stack);
      throw error;
    }
  } else {
    console.log('[SUPABASE] No custom image provided, generating thumbnail...');
    
    // Generate thumbnail from preset data
    const thumbnailBlob = await generatePresetThumbnail({
      name: formData.name,
      channels: presetData.settings?.channels || [],
      creator_name: formData.creator_name
    });
    
    if (thumbnailBlob) {
      customImageFile = new File([thumbnailBlob], 'thumbnail.png', { type: 'image/png' });
      const thumbnailFileName = `${Date.now()}-thumbnail.png`;
      
      try {
        console.log('[SUPABASE] Uploading generated thumbnail...');
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from('preset-displays')
          .upload(thumbnailFileName, customImageFile, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (thumbnailError) {
          console.error('[SUPABASE] Thumbnail upload error:', thumbnailError);
        } else {
          customImageUrl = thumbnailData.path;
          console.log('[SUPABASE] Generated thumbnail uploaded:', customImageUrl);
        }
      } catch (error) {
        console.error('[SUPABASE] Error uploading thumbnail:', error);
      }
    }
  }
  
  // Create preset record
  console.log('[SUPABASE] Creating preset record...');
  const presetRecord = {
    name: formData.name,
    description: formData.description,
    tags: formData.tags || [],
    settings_config: presetData.settings,
    wallpaper_url: wallpaperUrl,
    wallpaper_file_size: wallpaperFile?.size,
    wallpaper_mime_type: wallpaperFile?.type,
    display_image_url: customImageUrl, // Add custom image URL
    display_image_size: customImageFile?.size,
    display_image_mime_type: customImageFile?.type,
    created_by_session_id: sessionId
  };
  
  console.log('[SUPABASE] Preset record to insert:', presetRecord);
  
  const { data, error } = await supabase
    .from('presets')
    .insert(presetRecord)
    .select()
    .single()
  
  console.log('[SUPABASE] Insert result:', { data, error });
  
  if (error) {
    console.error('[SUPABASE] Error inserting preset:', error);
    throw error;
  }
  
  console.log('[SUPABASE] Upload successful:', data);
  return data
}

export const downloadPreset = async (presetId) => {
  try {
    const sessionId = await ensureSession()
    
    // Get preset data
    const { data: preset, error: presetError } = await supabase
      .from('presets')
      .select('*')
      .eq('id', presetId)
      .single()
    
    if (presetError) {
      console.error('[SUPABASE] Error fetching preset:', presetError);
      return { success: false, error: presetError.message };
    }
    
    if (!preset) {
      return { success: false, error: 'Preset not found' };
    }
    
    // Track download - handle duplicate download gracefully
    const { error: downloadError } = await supabase
      .from('preset_downloads')
      .insert({
        preset_id: presetId,
        session_id: sessionId
      })
    
    if (downloadError) {
      // 409 Conflict means this session already downloaded this preset
      if (downloadError.code === '23505' || downloadError.message.includes('duplicate')) {
        console.log('[SUPABASE] Download already tracked for this session');
      } else {
        console.warn('[SUPABASE] Error tracking download:', downloadError);
      }
      // Don't fail the download if tracking fails
    }
    
    // Download wallpaper if exists
    let wallpaperData = null
    if (preset.wallpaper_url) {
      const { data: wallpaper, error: wallpaperError } = await supabase.storage
        .from('preset-wallpapers')
        .download(preset.wallpaper_url)
      
      if (!wallpaperError) {
        wallpaperData = await wallpaper.arrayBuffer()
      } else {
        console.warn('[SUPABASE] Error downloading wallpaper:', wallpaperError);
        // Don't fail the download if wallpaper fails
      }
    }
    
    // Ensure the preset data has the correct structure
    let presetData = preset.settings_config;
    
    // If settings_config is a string, try to parse it
    if (typeof presetData === 'string') {
      try {
        presetData = JSON.parse(presetData);
      } catch (parseError) {
        console.error('[SUPABASE] Error parsing preset settings:', parseError);
        return { success: false, error: 'Invalid preset data format' };
      }
    }
    
    // Ensure the preset has a name
    if (!presetData.name && preset.name) {
      presetData.name = preset.name;
    }
    
    return {
      success: true,
      data: {
        name: preset.name,
        settings: presetData,
        id: preset.id,
        wallpaper: wallpaperData ? {
          data: wallpaperData,
          mimeType: preset.wallpaper_mime_type,
          fileName: preset.wallpaper_url.split('/').pop()
        } : null
      }
    }
  } catch (error) {
    console.error('[SUPABASE] Error downloading preset:', error);
    return { success: false, error: error.message };
  }
}

export const getSharedPresets = async (searchTerm = '', sortBy = 'created_at') => {
  try {
    let query = supabase
      .from('presets')
      .select('*')
      .eq('is_public', true)
      .eq('is_approved', true)
      .order(sortBy, { ascending: false })
    
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw error;
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('[SUPABASE] Error fetching shared presets:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getFeaturedPresets = async () => {
  const { data, error } = await supabase
    .from('featured_presets')
    .select('*')
    .limit(20)
  
  if (error) throw error
  return data
}

export const getPopularMedia = async () => {
  const { data, error } = await supabase
    .from('popular_media')
    .select('*')
    .limit(50)
  
  if (error) throw error
  return data
}

// =====================================================
// LEGACY COMPATIBILITY (for existing code)
// =====================================================

// Helper function to generate thumbnail from preset data
export const generateThumbnail = async (presetData) => {
  // Create a canvas to generate thumbnail
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = 300
  canvas.height = 200
  
  // Draw a simple thumbnail based on preset data
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, 300, 200)
  
  // Add preset name
  ctx.fillStyle = '#333'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(presetData.name, 150, 100)
  
  // Add channel count
  ctx.font = '12px Arial'
  ctx.fillText(`${presetData.channels?.length || 0} channels`, 150, 120)
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', 0.8)
  })
}

// Legacy function for backward compatibility
export const downloadPresetLegacy = async (preset) => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Download the preset file
    const { data: fileData, error: fileError } = await supabase.storage
      .from('presets')
      .download(preset.preset_file_url)

    if (fileError) {
      console.error('Error downloading preset file:', fileError);
      return { success: false, error: fileError.message };
    }

    // Convert the file data to text
    const presetText = await fileData.text();
    const presetData = JSON.parse(presetText);

    // Increment download count
    console.log('Incrementing download count for preset:', preset.id);
    const currentDownloads = preset.downloads || 0;
    const { error: updateError } = await supabase
      .from('shared_presets')
      .update({ downloads: currentDownloads + 1 })
      .eq('id', preset.id);

    if (updateError) {
      console.error('Error updating download count:', updateError);
      console.error('Update details:', { 
        presetId: preset.id, 
        currentDownloads, 
        newDownloads: currentDownloads + 1 
      });
      // Don't fail the download if the count update fails
    } else {
      console.log('Download count updated successfully:', currentDownloads + 1);
    }

    return { success: true, data: presetData };
  } catch (error) {
    console.error('Error downloading preset:', error);
    return { success: false, error: error.message };
  }
} 
 