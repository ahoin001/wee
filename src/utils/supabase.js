import { createClient } from '@supabase/supabase-js'
import { sanitizePresetSettingsForCommunity } from './presetSharing'
import { logError, logWarn } from './logger'
import {
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
const SUPABASE_DISABLED_ERROR = 'Supabase is not configured for this build. Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY.'

function createDisabledSupabaseClient() {
  const disabledError = { message: SUPABASE_DISABLED_ERROR }
  const disabledAsync = async () => ({ data: null, error: disabledError })
  const disabledPublicUrl = () => ({ data: { publicUrl: '' } })
  const authUnsubscribe = { unsubscribe: () => {} }

  /** Enough of GoTrue API for authService and any eager listeners (avoids crashes when env is missing). */
  const disabledAuth = {
    onAuthStateChange: (callback) => {
      try {
        queueMicrotask(() => {
          callback('INITIAL_SESSION', null)
        })
      } catch {
        // ignore
      }
      return { data: { subscription: authUnsubscribe } }
    },
    getUser: async () => ({ data: { user: null }, error: disabledError }),
    signUp: async () => ({ data: { user: null, session: null }, error: disabledError }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: disabledError }),
    signOut: async () => ({ error: disabledError }),
  }

  const query = {
    select: () => query,
    insert: () => query,
    update: () => query,
    upsert: () => query,
    delete: () => query,
    eq: () => query,
    or: () => query,
    overlaps: () => query,
    order: () => query,
    range: () => query,
    limit: () => query,
    single: disabledAsync,
    maybeSingle: disabledAsync,
    then: (resolve) => Promise.resolve(resolve({ data: null, error: disabledError, count: 0 })),
  }

  return {
    auth: disabledAuth,
    from: () => query,
    schema: () => ({ from: () => query }),
    storage: {
      from: () => ({
        upload: disabledAsync,
        download: disabledAsync,
        list: disabledAsync,
        remove: disabledAsync,
        getPublicUrl: disabledPublicUrl,
      }),
    },
  }
}

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
  logWarn('SUPABASE', 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and set values.')
}

const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
export const supabase = hasSupabaseEnv
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createDisabledSupabaseClient()
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

const applyMediaSearchFilters = (queryBuilder, filters = {}) => {
  let nextQuery = queryBuilder
  const searchTerm = String(filters.searchTerm || '').trim()

  if (searchTerm) {
    nextQuery = nextQuery.or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`
    )
  }

  if (filters.fileType && filters.fileType !== 'all') {
    nextQuery = nextQuery.eq('file_type', filters.fileType)
  }

  if (filters.tags && filters.tags.length > 0) {
    nextQuery = nextQuery.overlaps('tags', filters.tags)
  }

  const sortBy = filters.sortBy || 'created_at'
  switch (sortBy) {
    case 'title_asc':
      nextQuery = nextQuery.order('title', { ascending: true })
      break
    case 'title_desc':
      nextQuery = nextQuery.order('title', { ascending: false })
      break
    case 'downloads':
      nextQuery = nextQuery.order('downloads', { ascending: false })
      break
    case 'created_at':
    default:
      nextQuery = nextQuery.order('created_at', { ascending: false })
      break
  }

  return nextQuery
}

export const searchMediaPaginated = async (filters = {}) => {
  try {
    const page = Math.max(1, Number(filters.page) || 1)
    const limit = Math.max(1, Number(filters.limit) || 20)
    const offset = (page - 1) * limit

    let queryBuilder = spokeClient
      .from('media_library')
      .select('*', { count: 'exact' })
      .eq('is_approved', true)

    queryBuilder = applyMediaSearchFilters(queryBuilder, filters)
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) {
      return { success: false, error: error.message, data: [], totalCount: 0, totalPages: 0, page, limit }
    }

    const totalCount = Number(count) || 0
    const totalPages = Math.max(1, Math.ceil(totalCount / limit))

    return {
      success: true,
      data: data || [],
      totalCount,
      totalPages,
      page,
      limit,
    }
  } catch (error) {
    return { success: false, error: error.message, data: [], totalCount: 0, totalPages: 0 }
  }
}

export const searchMedia = async (filters = {}) => {
  const result = await searchMediaPaginated(filters)
  if (!result.success) {
    return { success: false, error: result.error, data: [] }
  }

  return { success: true, data: result.data }
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
    const channelCount = presetData.captureScope === 'visual+homeChannels' ? 1 : 0;
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
    logError('SUPABASE', 'Error generating thumbnail', error);
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
        logError('SUPABASE', 'Wallpaper upload error', wallpaperError, {
          message: wallpaperError.message,
          statusCode: wallpaperError.statusCode,
          details: wallpaperError.details
        });
        throw wallpaperError;
      }
      
      wallpaperUrl = wallpaperData.path
    } catch (error) {
      logError('SUPABASE', 'Error uploading wallpaper', error, { stack: error?.stack });
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
        logError('SUPABASE', 'Custom image upload error', customImageError, {
          message: customImageError.message,
          statusCode: customImageError.statusCode,
          details: customImageError.details
        });
        throw customImageError;
      }
      
      customImageUrl = customImageData.path
    } catch (error) {
      logError('SUPABASE', 'Error uploading custom image', error, { stack: error?.stack });
      throw error;
    }
  } else {
    // Generate thumbnail from preset data
    const thumbnailBlob = await generatePresetThumbnail({
      name: formData.name,
      captureScope: presetData.settings?.captureScope || 'visual',
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
          logError('SUPABASE', 'Thumbnail upload error', thumbnailError);
        } else {
          customImageUrl = thumbnailData.path;
        }
      } catch (error) {
        logError('SUPABASE', 'Error uploading thumbnail', error);
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
    logError('SUPABASE', 'Error inserting preset', error);
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
      logError('SUPABASE', 'Error fetching preset', presetError);
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
        // Intentionally ignored: download already tracked for this session.
      } else {
        logWarn('SUPABASE', 'Error tracking download', downloadError);
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
        logWarn('SUPABASE', 'Error downloading wallpaper', wallpaperError);
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
        logError('SUPABASE', 'Error parsing preset settings', parseError);
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
    logError('SUPABASE', 'Error downloading preset', error);
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
        logError('SUPABASE', 'Error fetching shared presets', error)
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
        logError('SUPABASE', 'Error checking community preset updates', error)
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

 