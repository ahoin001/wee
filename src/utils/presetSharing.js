const COMMUNITY_BLOCKED_KEYS = ['channels', 'channelData', 'soundLibrary']

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value)

const cloneJson = (value) => {
  if (value == null) return {}
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return {}
  }
}

const removeBlockedKeys = (settings) => {
  for (const key of COMMUNITY_BLOCKED_KEYS) {
    delete settings[key]
  }
}

const normalizeWallpaperCollections = (settings) => {
  const candidates = []
  if (Array.isArray(settings.savedWallpapers)) candidates.push('savedWallpapers')
  if (Array.isArray(settings.likedWallpapers)) candidates.push('likedWallpapers')
  if (isPlainObject(settings.wallpaper)) {
    if (Array.isArray(settings.wallpaper.savedWallpapers)) candidates.push('wallpaper.savedWallpapers')
    if (Array.isArray(settings.wallpaper.likedWallpapers)) candidates.push('wallpaper.likedWallpapers')
  }

  for (const path of candidates) {
    const target =
      path === 'savedWallpapers'
        ? settings.savedWallpapers
        : path === 'likedWallpapers'
          ? settings.likedWallpapers
          : path === 'wallpaper.savedWallpapers'
            ? settings.wallpaper.savedWallpapers
            : settings.wallpaper.likedWallpapers

    const seen = new Set()
    const cleaned = target.filter((item) => {
      if (!item || typeof item !== 'object') return false
      const url = typeof item.url === 'string' ? item.url : ''
      if (!url || url.startsWith('userdata://')) return false
      if (seen.has(url)) return false
      seen.add(url)
      return true
    })

    if (path === 'savedWallpapers') settings.savedWallpapers = cleaned
    else if (path === 'likedWallpapers') settings.likedWallpapers = cleaned
    else if (path === 'wallpaper.savedWallpapers') settings.wallpaper.savedWallpapers = cleaned
    else settings.wallpaper.likedWallpapers = cleaned
  }
}

export const sanitizePresetSettingsForCommunity = (settingsInput, options = {}) => {
  const settings = cloneJson(settingsInput)
  const wallpaperPublicUrl = options.wallpaperPublicUrl || null

  removeBlockedKeys(settings)

  if (isPlainObject(settings.wallpaper)) {
    if (wallpaperPublicUrl) {
      settings.wallpaper.url = wallpaperPublicUrl
      settings.wallpaper.source = 'community'
    } else if (typeof settings.wallpaper.url === 'string' && settings.wallpaper.url.startsWith('userdata://')) {
      delete settings.wallpaper.url
    }
  }

  normalizeWallpaperCollections(settings)
  return settings
}

const fileFromBase64 = (base64Data, filename, mimeType) => {
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new File([bytes], filename, { type: mimeType })
}

export const resolveWallpaperFileForShare = async (selectedPreset) => {
  const wallpaperRef = selectedPreset?.data?.wallpaper
  const wallpaperUrl = wallpaperRef?.url
  if (!wallpaperUrl) return { file: null, warning: null }

  try {
    if (wallpaperUrl.startsWith('userdata://')) {
      if (!window.api?.wallpapers?.getFile) {
        return { file: null, warning: 'Wallpaper API unavailable; shared preset will not include wallpaper.' }
      }
      const wallpaperResult = await window.api.wallpapers.getFile(wallpaperUrl)
      if (!wallpaperResult?.success || !wallpaperResult?.data) {
        return { file: null, warning: 'Could not read local wallpaper; shared preset will not include wallpaper.' }
      }
      const file = fileFromBase64(
        wallpaperResult.data,
        wallpaperResult.filename || `wallpaper-${Date.now()}.jpg`,
        wallpaperRef?.mimeType || 'image/jpeg'
      )
      return { file, warning: null }
    }

    if (/^https?:\/\//i.test(wallpaperUrl)) {
      const response = await fetch(wallpaperUrl)
      if (!response.ok) {
        return { file: null, warning: 'Could not fetch remote wallpaper; shared preset will not include wallpaper.' }
      }
      const blob = await response.blob()
      const file = new File([blob], 'wallpaper.jpg', { type: blob.type || wallpaperRef?.mimeType || 'image/jpeg' })
      return { file, warning: null }
    }

    return { file: null, warning: 'Unsupported wallpaper source; shared preset will not include wallpaper.' }
  } catch {
    return { file: null, warning: 'Wallpaper upload preparation failed; shared preset will not include wallpaper.' }
  }
}

export const capturePresetThumbnailDataUrl = async () => {
  try {
    if (!window.api?.capturePresetThumbnail) return null
    const result = await window.api.capturePresetThumbnail({ width: 960, height: 540, quality: 88 })
    if (!result?.success || !result?.dataUrl) return null
    return result.dataUrl
  } catch {
    return null
  }
}

export const resolveCustomImageFileForShare = (customImageDataUrl, fallbackDataUrl = null) => {
  const sourceDataUrl = customImageDataUrl || fallbackDataUrl
  if (!sourceDataUrl) return { file: null, warning: null }
  try {
    const base64Data = String(sourceDataUrl).split(',')[1]
    if (!base64Data) return { file: null, warning: 'Invalid custom display image format; using generated thumbnail.' }
    const file = fileFromBase64(base64Data, 'custom-display.jpg', 'image/jpeg')
    return { file, warning: null }
  } catch {
    return { file: null, warning: 'Custom display image could not be processed; using generated thumbnail.' }
  }
}

export const parseTags = (tagsInput) => {
  if (Array.isArray(tagsInput)) return tagsInput.map((tag) => String(tag).trim()).filter(Boolean)
  if (typeof tagsInput !== 'string') return []
  return tagsInput
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}
