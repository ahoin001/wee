import { createClient } from '@supabase/supabase-js'
import { sanitizePresetSettingsForCommunity } from './presetSharing'
import {
  CANVAS_AVATAR_FALLBACK_BG,
  CANVAS_AVATAR_FALLBACK_FG,
  CANVAS_PLACEHOLDER_ACCENT,
  CANVAS_PLACEHOLDER_BG,
  CANVAS_PLACEHOLDER_GRADIENT_END,
  CANVAS_PLACEHOLDER_GRADIENT_START,
  CANVAS_PLACEHOLDER_TEXT_DIM,
  CANVAS_PLACEHOLDER_TEXT_MUTED,
  CANVAS_PLACEHOLDER_TEXT_PRIMARY,
} from '../design/supabaseCanvasColors.js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const APP_SCHEMA = import.meta.env.VITE_SUPABASE_APP_SCHEMA || 'app_wee_v1'

/** Project base URL with no trailing slash (for storage public URLs). */
export const supabaseProjectUrl = String(SUPABASE_URL || '').replace(/\/$/, '')

/**
 * Public Storage URL for `storage/v1/object/public/<bucket>/<path>`.
 * @param {string} bucket
 * @param {string} objectPath path as stored in DB (no leading slash)
 */
export function getStoragePublicObjectUrl(bucket, objectPath) {
  const p = String(objectPath || '').replace(/^\/+/, '')
  return `${supabaseProjectUrl}/storage/v1/object/public/${bucket}/${p}`
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[SUPABASE] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and set values.'
  )
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')
const spokeClient = supabase.schema(APP_SCHEMA)
export const supabaseSpoke = spokeClient

const supabaseReadCache = new Map()
const supabaseInFlightReads = new Map()

const getCachedReadResult = async (cacheKey, fetcher, { ttlMs = 15000, forceFresh = false } = {}) => {
  if (!forceFresh) {
    const cached = supabaseReadCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < ttlMs) {
      return cached.value
    }
  }

  if (supabaseInFlightReads.has(cacheKey)) {
    return supabaseInFlightReads.get(cacheKey)
  }

  const request = (async () => {
    const value = await fetcher()
    supabaseReadCache.set(cacheKey, { ts: Date.now(), value })
    return value
  })().finally(() => {
    supabaseInFlightReads.delete(cacheKey)
  })

  supabaseInFlightReads.set(cacheKey, request)
  return request
}

export const clearSupabaseReadCache = () => {
  supabaseReadCache.clear()
  supabaseInFlightReads.clear()
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

export const createSession = async () => {
  const sessionToken = crypto.randomUUID()
  const { data, error } = await spokeClient
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
    const { data: mediaData, error: insertError } = await spokeClient
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
    let queryBuilder = spokeClient
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
    const { data: media, error: mediaError } = await spokeClient
      .from('media_library')
      .select('*')
      .eq('id', mediaId)
      .single()
    
    if (mediaError) {
      return { success: false, error: mediaError.message }
    }
    
    // Track download
    await spokeClient
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
    // Create a canvas to generate thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 200;
    
    // Draw background
    ctx.fillStyle = CANVAS_PLACEHOLDER_BG;
    ctx.fillRect(0, 0, 300, 200);
    
    // Draw gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, CANVAS_PLACEHOLDER_GRADIENT_START);
    gradient.addColorStop(1, CANVAS_PLACEHOLDER_GRADIENT_END);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 200);
    
    // Add preset name
    ctx.fillStyle = CANVAS_PLACEHOLDER_TEXT_PRIMARY;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(presetData.name || 'Preset', 150, 80);
    
    // Add channel count
    const channelCount = presetData.channels?.length || 0;
    ctx.font = '14px Arial';
    ctx.fillStyle = CANVAS_PLACEHOLDER_TEXT_MUTED;
    ctx.fillText(`${channelCount} channels`, 150, 110);
    
    // Add creator info
    if (presetData.creator_name) {
      ctx.font = '12px Arial';
      ctx.fillStyle = CANVAS_PLACEHOLDER_TEXT_DIM;
      ctx.fillText(`by ${presetData.creator_name}`, 150, 130);
    }
    
    // Add Wii-style border
    ctx.strokeStyle = CANVAS_PLACEHOLDER_ACCENT;
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
  const sessionId = await ensureSession()
  
  // Upload wallpaper if provided
  let wallpaperUrl = null
  let wallpaperFile = null
  
  if (presetData.wallpaper) {
    wallpaperFile = presetData.wallpaper
    const wallpaperFileName = `${Date.now()}-wallpaper-${wallpaperFile.name}`
    
    try {
      const { data: wallpaperData, error: wallpaperError } = await supabase.storage
        .from('preset-wallpapers')
        .upload(wallpaperFileName, wallpaperFile, {
          cacheControl: '3600',
          upsert: false
        })
      
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
    } catch (error) {
      console.error('[SUPABASE] Error uploading wallpaper:', error);
      console.error('[SUPABASE] Error stack:', error.stack);
      throw error;
    }
  }
  
  // Upload custom image if provided
  let customImageUrl = null
  let customImageFile = null
  
  if (presetData.customImage) {
    customImageFile = presetData.customImage
    const customImageFileName = `${Date.now()}-display-${customImageFile.name}`
    
    try {
      const { data: customImageData, error: customImageError } = await supabase.storage
        .from('preset-displays')
        .upload(customImageFileName, customImageFile, {
          cacheControl: '3600',
          upsert: false
        })
      
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
    } catch (error) {
      console.error('[SUPABASE] Error uploading custom image:', error);
      console.error('[SUPABASE] Error stack:', error.stack);
      throw error;
    }
  } else {
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
        }
      } catch (error) {
        console.error('[SUPABASE] Error uploading thumbnail:', error);
      }
    }
  }
  
  const wallpaperPublicUrl = wallpaperUrl
    ? getStoragePublicObjectUrl('preset-wallpapers', wallpaperUrl)
    : null
  const sharedSettings = sanitizePresetSettingsForCommunity(presetData.settings, { wallpaperPublicUrl })
  const rootPresetId = formData.parent_preset_id || null
  let nextVersion = 1

  if (rootPresetId) {
    const [rootResult, childrenResult] = await Promise.all([
      spokeClient
        .from('presets')
        .select('id, version')
        .eq('id', rootPresetId)
        .limit(1),
      spokeClient
        .from('presets')
        .select('id, version')
        .eq('parent_preset_id', rootPresetId)
        .order('version', { ascending: false })
        .limit(1)
    ])

    const candidates = []
    if (!rootResult.error && Array.isArray(rootResult.data)) candidates.push(...rootResult.data)
    if (!childrenResult.error && Array.isArray(childrenResult.data)) candidates.push(...childrenResult.data)
    const highestVersion = candidates.reduce((acc, row) => Math.max(acc, Number(row?.version) || 1), 1)
    nextVersion = highestVersion + 1
  }

  // Create preset record
  const presetRecord = {
    name: formData.name,
    description: formData.description,
    tags: formData.tags || [],
    settings_config: sharedSettings,
    wallpaper_url: wallpaperUrl,
    wallpaper_file_size: wallpaperFile?.size,
    wallpaper_mime_type: wallpaperFile?.type,
    display_image_url: customImageUrl, // Add custom image URL
    display_image_size: customImageFile?.size,
    display_image_mime_type: customImageFile?.type,
    created_by_session_id: sessionId,
    parent_preset_id: rootPresetId,
    version: nextVersion
  };
  
  const { data, error } = await spokeClient
    .from('presets')
    .insert(presetRecord)
    .select()
    .single()
  if (error) {
    console.error('[SUPABASE] Error inserting preset:', error);
    throw error;
  }

  const warnings = []
  if (!wallpaperFile && presetData?.settings?.wallpaper?.url) {
    warnings.push('Wallpaper could not be included with this shared preset.')
  }
  return {
    ...data,
    includesWallpaper: Boolean(wallpaperUrl),
    warnings
  }
}

export const downloadPreset = async (presetId) => {
  try {
    const sessionId = await ensureSession()
    
    // Get preset data
    const { data: preset, error: presetError } = await spokeClient
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
    const { error: downloadError } = await spokeClient
      .from('preset_downloads')
      .insert({
        preset_id: presetId,
        session_id: sessionId
      })
    
    if (downloadError) {
      // 409 Conflict means this session already downloaded this preset
      if (downloadError.code === '23505' || downloadError.message.includes('duplicate')) {
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
        version: preset.version || 1,
        parentPresetId: preset.parent_preset_id || null,
        rootPresetId: preset.parent_preset_id || preset.id,
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

export const getSharedPresets = async (searchTerm = '', sortBy = 'created_at', options = {}) => {
  const normalizedSearchTerm = String(searchTerm || '').trim()
  const cacheKey = `shared-presets:${sortBy}:${normalizedSearchTerm.toLowerCase()}`

  return getCachedReadResult(
    cacheKey,
    async () => {
      try {
        let query = spokeClient
          .from('presets')
          .select('*')
          .eq('is_public', true)
          .eq('is_approved', true)
          .order(sortBy, { ascending: false })
        
        if (normalizedSearchTerm) {
          query = query.ilike('name', `%${normalizedSearchTerm}%`)
        }
        
        const { data, error } = await query
        
        if (error) {
          throw error
        }
        
        return { success: true, data: data || [] }
      } catch (error) {
        console.error('[SUPABASE] Error fetching shared presets:', error)
        return { success: false, error: error.message, data: [] }
      }
    },
    { ttlMs: options.ttlMs ?? 15000, forceFresh: options.forceFresh === true }
  )
}

export const getCommunityPresetUpdates = async (installedPresets = [], options = {}) => {
  const refs = installedPresets
    .map((preset) => ({
      localKey: String(preset.localKey || ''),
      rootPresetId: String(preset.rootPresetId || ''),
      installedVersion: Number(preset.installedVersion) || 1
    }))
    .filter((preset) => preset.localKey && preset.rootPresetId)

  if (refs.length === 0) return { success: true, data: {} }

  const cacheRefKey = refs
    .map((preset) => `${preset.localKey}:${preset.rootPresetId}:${preset.installedVersion}`)
    .sort()
    .join('|')
  const cacheKey = `community-updates:${cacheRefKey}`

  return getCachedReadResult(
    cacheKey,
    async () => {
      try {
        const uniqueRootIds = [...new Set(refs.map((preset) => preset.rootPresetId))]
        const [rootRows, childRows] = await Promise.all([
          spokeClient
            .from('presets')
            .select('id, parent_preset_id, version, updated_at')
            .in('id', uniqueRootIds)
            .eq('is_public', true)
            .eq('is_approved', true),
          spokeClient
            .from('presets')
            .select('id, parent_preset_id, version, updated_at')
            .in('parent_preset_id', uniqueRootIds)
            .eq('is_public', true)
            .eq('is_approved', true)
        ])

        if (rootRows.error) throw rootRows.error
        if (childRows.error) throw childRows.error

        const latestByRoot = {}
        const rows = [...(rootRows.data || []), ...(childRows.data || [])]
        for (const row of rows) {
          const rootId = row.parent_preset_id || row.id
          const current = latestByRoot[rootId]
          if (!current || Number(row.version || 1) > Number(current.version || 1)) {
            latestByRoot[rootId] = row
          }
        }

        const result = {}
        for (const ref of refs) {
          const latest = latestByRoot[ref.rootPresetId]
          const latestVersion = Number(latest?.version || ref.installedVersion || 1)
          result[ref.localKey] = {
            hasUpdate: latestVersion > ref.installedVersion,
            latestVersion,
            latestPresetId: latest?.id || ref.rootPresetId,
            updatedAt: latest?.updated_at || null
          }
        }

        return { success: true, data: result }
      } catch (error) {
        console.error('[SUPABASE] Error checking community preset updates:', error)
        return { success: false, error: error.message, data: {} }
      }
    },
    { ttlMs: options.ttlMs ?? 20000, forceFresh: options.forceFresh === true }
  )
}

export const getFeaturedPresets = async (options = {}) => {
  return getCachedReadResult(
    'featured-presets',
    async () => {
      const { data, error } = await spokeClient
        .from('featured_presets')
        .select('*')
        .limit(20)
      
      if (error) throw error
      return data
    },
    { ttlMs: options.ttlMs ?? 30000, forceFresh: options.forceFresh === true }
  )
}

export const getPopularMedia = async (options = {}) => {
  return getCachedReadResult(
    'popular-media',
    async () => {
      const { data, error } = await spokeClient
        .from('popular_media')
        .select('*')
        .limit(50)
      
      if (error) throw error
      return data
    },
    { ttlMs: options.ttlMs ?? 30000, forceFresh: options.forceFresh === true }
  )
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
  ctx.fillStyle = CANVAS_AVATAR_FALLBACK_BG
  ctx.fillRect(0, 0, 300, 200)
  
  // Add preset name
  ctx.fillStyle = CANVAS_AVATAR_FALLBACK_FG
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
    const currentDownloads = preset.downloads || 0;
    const { error: updateError } = await spokeClient
      .from('presets')
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
    }

    return { success: true, data: presetData };
  } catch (error) {
    console.error('Error downloading preset:', error);
    return { success: false, error: error.message };
  }
} 
 