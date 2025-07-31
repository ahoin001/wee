# New Supabase Implementation Guide

## Overview

This guide covers the complete refactor of the Supabase implementation for WiiDesktop Launcher. The new schema supports all your requirements:

1. **Media Library**: Images, GIFs, videos with tags and search
2. **Presets with Wallpapers**: Embedded wallpapers in presets
3. **Anonymous Users**: Session-based tracking with future account support
4. **Community Features**: Sharing, browsing, downloading
5. **Scalable Architecture**: Ready for future user accounts

## Quick Start

### 1. Database Setup

Run the SQL schema in `NEW_SUPABASE_SCHEMA.sql` in your Supabase SQL editor.

### 2. Storage Buckets

Create these buckets in Supabase Dashboard:
- `media-library` (for images, gifs, videos)
- `preset-wallpapers` (for embedded wallpapers)
- `preset-displays` (for preset display images)

### 3. Update Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## New Schema Structure

### Core Tables

#### 1. `media_library`
- Stores images, GIFs, videos for channel thumbnails
- Supports tags, search, and filtering
- Tracks downloads and views
- Future-ready for user accounts

#### 2. `presets`
- Stores user presets with embedded wallpapers
- JSONB settings configuration
- Optional display images
- Versioning support

#### 3. `user_sessions`
- Tracks anonymous users
- Enables analytics and future migration
- Session-based permissions

#### 4. Download Tracking
- `preset_downloads` and `media_downloads`
- Automatic download count updates
- Analytics support

### Key Features

✅ **Media Library**: Upload, search, filter images/gifs/videos
✅ **Preset Wallpapers**: Embedded wallpapers in presets
✅ **Display Images**: Optional images for preset previews
✅ **Anonymous Users**: Session-based tracking
✅ **Download Tracking**: Analytics for media and presets
✅ **Community Features**: Sharing, browsing, downloading
✅ **Future-Ready**: User account support built-in
✅ **Performance**: Optimized indexes and views
✅ **Security**: Comprehensive RLS policies

## Implementation Steps

### Step 1: Update Supabase Client

```javascript
// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Session management
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

// Media library functions
export const uploadMedia = async (file, metadata) => {
  const fileName = `${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('media-library')
    .upload(fileName, file)
  
  if (error) throw error
  
  const { data: mediaData, error: insertError } = await supabase
    .from('media_library')
    .insert({
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags || [],
      file_type: metadata.fileType,
      mime_type: file.type,
      file_size: file.size,
      file_url: data.path,
      created_by_session_id: metadata.sessionId
    })
    .select()
    .single()
  
  if (insertError) throw insertError
  return mediaData
}

export const searchMedia = async (query, filters = {}) => {
  let queryBuilder = supabase
    .from('media_library')
    .select('*')
    .eq('is_approved', true)
  
  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  }
  
  if (filters.fileType && filters.fileType !== 'all') {
    queryBuilder = queryBuilder.eq('file_type', filters.fileType)
  }
  
  if (filters.tags && filters.tags.length > 0) {
    queryBuilder = queryBuilder.overlaps('tags', filters.tags)
  }
  
  const { data, error } = await queryBuilder
    .order('downloads', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return data
}

// Preset functions
export const uploadPreset = async (presetData, wallpaperFile, displayImageId = null) => {
  // Upload wallpaper if provided
  let wallpaperUrl = null
  if (wallpaperFile) {
    const wallpaperFileName = `${Date.now()}-wallpaper-${wallpaperFile.name}`
    const { data: wallpaperData, error: wallpaperError } = await supabase.storage
      .from('preset-wallpapers')
      .upload(wallpaperFileName, wallpaperFile)
    
    if (wallpaperError) throw wallpaperError
    wallpaperUrl = wallpaperData.path
  }
  
  // Create preset
  const { data, error } = await supabase
    .from('presets')
    .insert({
      name: presetData.name,
      description: presetData.description,
      tags: presetData.tags || [],
      settings_config: presetData.settings,
      wallpaper_url: wallpaperUrl,
      wallpaper_file_size: wallpaperFile?.size,
      wallpaper_mime_type: wallpaperFile?.type,
      display_image_id: displayImageId,
      created_by_session_id: presetData.sessionId
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const downloadPreset = async (presetId, sessionId) => {
  // Get preset data
  const { data: preset, error: presetError } = await supabase
    .from('presets')
    .select('*')
    .eq('id', presetId)
    .single()
  
  if (presetError) throw presetError
  
  // Track download
  await supabase
    .from('preset_downloads')
    .insert({
      preset_id: presetId,
      session_id: sessionId
    })
  
  // Download wallpaper if exists
  let wallpaperData = null
  if (preset.wallpaper_url) {
    const { data: wallpaper, error: wallpaperError } = await supabase.storage
      .from('preset-wallpapers')
      .download(preset.wallpaper_url)
    
    if (!wallpaperError) {
      wallpaperData = await wallpaper.arrayBuffer()
    }
  }
  
  return {
    preset: preset.settings_config,
    wallpaper: wallpaperData ? {
      data: wallpaperData,
      mimeType: preset.wallpaper_mime_type,
      fileName: preset.wallpaper_url.split('/').pop()
    } : null
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
```

### Step 2: Update Image Search Modal

```javascript
// src/components/ImageSearchModal.jsx
import { searchMedia, uploadMedia } from '../utils/supabase'

// Replace the current image loading logic with:
const loadImages = async () => {
  setLoading(true)
  try {
    const media = await searchMedia(search, { fileType: filter })
    setImages(media)
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}

// Add upload functionality:
const handleUpload = async (file) => {
  try {
    const metadata = {
      title: file.name,
      description: '',
      tags: [],
      fileType: getFileType(file.type),
      sessionId: currentSessionId
    }
    
    const uploadedMedia = await uploadMedia(file, metadata)
    setImages(prev => [uploadedMedia, ...prev])
  } catch (error) {
    setError(error.message)
  }
}
```

### Step 3: Update Preset Management

```javascript
// src/components/settings/PresetManager.jsx
import { uploadPreset, downloadPreset, getFeaturedPresets } from '../../utils/supabase'

// Replace current upload logic:
const handleUploadPreset = async (presetData, wallpaperFile) => {
  try {
    const uploadedPreset = await uploadPreset(presetData, wallpaperFile)
    // Update UI
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

// Replace current download logic:
const handleDownloadPreset = async (presetId) => {
  try {
    const { preset, wallpaper } = await downloadPreset(presetId, sessionId)
    
    // Apply preset settings
    applyPresetSettings(preset)
    
    // Apply wallpaper if provided
    if (wallpaper) {
      const blob = new Blob([wallpaper.data], { type: wallpaper.mimeType })
      const wallpaperUrl = URL.createObjectURL(blob)
      setWallpaper(wallpaperUrl)
    }
  } catch (error) {
    console.error('Download failed:', error)
  }
}
```

### Step 4: Session Management

```javascript
// src/utils/sessionManager.js
import { createSession } from './supabase'

class SessionManager {
  constructor() {
    this.sessionId = localStorage.getItem('wii_session_id')
  }
  
  async getSession() {
    if (!this.sessionId) {
      const session = await createSession()
      this.sessionId = session.id
      localStorage.setItem('wii_session_id', this.sessionId)
    }
    return this.sessionId
  }
  
  getSessionId() {
    return this.sessionId
  }
}

export const sessionManager = new SessionManager()
```

## Migration from Old Schema

### 1. Export Current Data

```sql
-- Export existing presets
SELECT * FROM shared_presets;
```

### 2. Transform Data

```javascript
// Transform old preset data to new format
const transformPreset = (oldPreset) => ({
  name: oldPreset.name,
  description: oldPreset.description,
  tags: oldPreset.tags || [],
  settings_config: JSON.parse(oldPreset.preset_file_url), // Assuming this contains settings
  wallpaper_url: oldPreset.wallpaper_url,
  downloads: oldPreset.downloads || 0,
  is_public: true,
  is_approved: true
})
```

### 3. Import to New Schema

```javascript
// Import transformed data
const importPresets = async (transformedPresets) => {
  for (const preset of transformedPresets) {
    await supabase
      .from('presets')
      .insert(preset)
  }
}
```

## API Examples

### Media Library

```javascript
// Search media
const media = await searchMedia('gaming', { fileType: 'gif' })

// Upload media
const uploaded = await uploadMedia(file, {
  title: 'Cool GIF',
  description: 'Animated gaming icon',
  tags: ['gaming', 'retro'],
  fileType: 'gif',
  sessionId: sessionId
})

// Download media
const { data } = await supabase.storage
  .from('media-library')
  .download(media.file_url)
```

### Presets

```javascript
// Upload preset with wallpaper
const preset = await uploadPreset(
  { name: 'My Theme', settings: settingsConfig },
  wallpaperFile,
  displayImageId
)

// Download preset with wallpaper
const { preset: settings, wallpaper } = await downloadPreset(presetId, sessionId)

// Get featured presets
const featured = await getFeaturedPresets()
```

## Performance Optimizations

### 1. Caching

```javascript
// Cache media search results
const searchMediaCached = async (query, filters) => {
  const cacheKey = `media_search_${query}_${JSON.stringify(filters)}`
  const cached = sessionStorage.getItem(cacheKey)
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minutes
      return data
    }
  }
  
  const data = await searchMedia(query, filters)
  sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }))
  return data
}
```

### 2. Lazy Loading

```javascript
// Lazy load media thumbnails
const LazyMediaItem = ({ media }) => {
  const [loaded, setLoaded] = useState(false)
  
  return (
    <div>
      {!loaded && <div className="skeleton" />}
      <img
        src={media.thumbnail_url}
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? 'block' : 'none' }}
      />
    </div>
  )
}
```

## Security Considerations

### 1. File Validation

```javascript
const validateFile = (file, allowedTypes) => {
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File too large')
  }
  
  return true
}
```

### 2. Rate Limiting

```javascript
// Implement rate limiting for uploads
const rateLimit = {
  uploads: new Map(),
  
  checkLimit(sessionId, type) {
    const now = Date.now()
    const key = `${sessionId}_${type}`
    const lastUpload = this.uploads.get(key) || 0
    
    if (now - lastUpload < 60000) { // 1 minute
      throw new Error('Rate limit exceeded')
    }
    
    this.uploads.set(key, now)
  }
}
```

## Testing

### 1. Unit Tests

```javascript
// Test media upload
test('uploadMedia should upload file and create record', async () => {
  const file = new File(['test'], 'test.gif', { type: 'image/gif' })
  const metadata = {
    title: 'Test',
    fileType: 'gif',
    sessionId: 'test-session'
  }
  
  const result = await uploadMedia(file, metadata)
  expect(result.title).toBe('Test')
  expect(result.file_type).toBe('gif')
})
```

### 2. Integration Tests

```javascript
// Test preset download with wallpaper
test('downloadPreset should return preset and wallpaper', async () => {
  const result = await downloadPreset('test-preset-id', 'test-session')
  expect(result.preset).toBeDefined()
  expect(result.wallpaper).toBeDefined()
})
```

## Deployment Checklist

- [ ] Run new schema in Supabase
- [ ] Create storage buckets
- [ ] Update environment variables
- [ ] Update application code
- [ ] Test media upload/download
- [ ] Test preset upload/download
- [ ] Test search and filtering
- [ ] Test session management
- [ ] Test download tracking
- [ ] Performance testing
- [ ] Security testing

## Future Enhancements

### 1. User Accounts
- Add authentication tables
- Link sessions to users
- User-specific presets and media

### 2. Advanced Features
- Media collections
- Preset variations
- Social features (likes, comments)
- Advanced search filters

### 3. Analytics
- User behavior tracking
- Popular content analysis
- Performance metrics

This new implementation provides a solid foundation for all your requirements while maintaining scalability for future features. 