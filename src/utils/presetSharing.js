const COMMUNITY_BLOCKED_KEYS = [
  'channels',
  'channelData',
  'homeChannels',
  'sounds',
  'soundLibrary',
  'captureScope',
  'includesHomeChannels',
  'shareable',
]
/** Visual community allowlist — channels/sounds stay local-only. */
export const COMMUNITY_ALLOWED_KEYS = [
  'wallpaper',
  'ribbon',
  'time',
  'overlay',
  'ui',
  'capturedSpotifyPalette',
  'dock',
  'appearanceBySpace',
]

/** Soft cap for remote wallpaper fetch during share (bytes). */
export const COMMUNITY_WALLPAPER_MAX_BYTES = 12 * 1024 * 1024

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value)

const cloneJson = (value) => {
  if (value == null) return {}
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return {}
  }
}

const isHttpUrl = (url) => typeof url === 'string' && /^https?:\/\//i.test(url)
const isUserdataUrl = (url) => typeof url === 'string' && url.startsWith('userdata://')

/**
 * Canonical active wallpaper URL: prefer `wallpaper.current.url`, fall back to legacy `wallpaper.url`.
 */
export const getPresetWallpaperUrl = (wallpaper) => {
  if (!isPlainObject(wallpaper)) return null
  const currentUrl = wallpaper.current?.url
  if (typeof currentUrl === 'string' && currentUrl) return currentUrl
  if (typeof wallpaper.url === 'string' && wallpaper.url) return wallpaper.url
  return null
}

/**
 * Ensure wallpaper uses `current` for the active image; mirror legacy `url` when useful.
 * @param {Record<string, unknown>} wallpaper
 * @param {{ url?: string, name?: string, mimeType?: string, source?: string } | null} [active]
 */
export const normalizeWallpaperCurrentShape = (wallpaper, active = null) => {
  if (!isPlainObject(wallpaper)) return wallpaper
  const next = { ...wallpaper }
  const fromActive =
    active && typeof active.url === 'string' && active.url
      ? {
          ...(isPlainObject(next.current) ? next.current : {}),
          ...active,
          url: active.url,
        }
      : null

  if (fromActive) {
    next.current = fromActive
  } else if (!isPlainObject(next.current) && typeof next.url === 'string' && next.url) {
    next.current = {
      url: next.url,
      ...(typeof next.name === 'string' ? { name: next.name } : {}),
      ...(typeof next.mimeType === 'string' ? { mimeType: next.mimeType } : {}),
      ...(typeof next.source === 'string' ? { source: next.source } : {}),
    }
  }

  if (isPlainObject(next.current) && typeof next.current.url === 'string') {
    next.url = next.current.url
  }
  return next
}

const scrubPrivateUrl = (url) => {
  if (typeof url !== 'string') return null
  if (isUserdataUrl(url)) return null
  if (isHttpUrl(url)) return url
  return null
}

const scrubWallpaperObjectUrls = (wallpaper) => {
  if (!isPlainObject(wallpaper)) return
  if (isPlainObject(wallpaper.current)) {
    const scrubbed = scrubPrivateUrl(wallpaper.current.url)
    if (scrubbed) wallpaper.current = { ...wallpaper.current, url: scrubbed }
    else delete wallpaper.current.url
  }
  if (typeof wallpaper.url === 'string') {
    const scrubbed = scrubPrivateUrl(wallpaper.url)
    if (scrubbed) wallpaper.url = scrubbed
    else delete wallpaper.url
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
      if (!isHttpUrl(url)) return false
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

/**
 * Community share: Home appearance only (never other spaces / channels).
 */
const sanitizeAppearanceBySpaceForCommunity = (appearanceBySpace) => {
  if (!isPlainObject(appearanceBySpace)) return undefined
  if (!isPlainObject(appearanceBySpace.home)) return { home: null }
  return { home: cloneJson(appearanceBySpace.home) }
}

export const sanitizePresetSettingsForCommunity = (settingsInput, options = {}) => {
  const rawSettings = cloneJson(settingsInput)
  const wallpaperPublicUrl = options.wallpaperPublicUrl || null

  removeBlockedKeys(rawSettings)
  const settings = {}
  for (const key of COMMUNITY_ALLOWED_KEYS) {
    if (rawSettings[key] !== undefined) settings[key] = rawSettings[key]
  }

  if (settings.appearanceBySpace !== undefined) {
    settings.appearanceBySpace = sanitizeAppearanceBySpaceForCommunity(settings.appearanceBySpace)
  }

  if (isPlainObject(settings.wallpaper)) {
    settings.wallpaper = normalizeWallpaperCurrentShape(settings.wallpaper)
    scrubWallpaperObjectUrls(settings.wallpaper)

    if (wallpaperPublicUrl) {
      settings.wallpaper = normalizeWallpaperCurrentShape(settings.wallpaper, {
        url: wallpaperPublicUrl,
        source: 'community',
        ...(typeof settings.wallpaper.current?.name === 'string'
          ? { name: settings.wallpaper.current.name }
          : {}),
      })
      settings.wallpaper.source = 'community'
    }

    scrubWallpaperObjectUrls(settings.wallpaper)
    // Community shares active wallpaper only — drop private libraries from public payload.
    delete settings.wallpaper.savedWallpapers
    delete settings.wallpaper.likedWallpapers
  }

  normalizeWallpaperCollections(settings)
  delete settings.savedWallpapers
  delete settings.likedWallpapers

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
  const wallpaperUrl = getPresetWallpaperUrl(wallpaperRef)
  if (!wallpaperUrl) {
    return { file: null, warning: 'No wallpaper on this preset; shared look will use colors only.' }
  }

  const mimeHint =
    wallpaperRef?.current?.mimeType || wallpaperRef?.mimeType || 'image/jpeg'
  const nameHint =
    wallpaperRef?.current?.name || wallpaperRef?.name || `wallpaper-${Date.now()}.jpg`

  try {
    if (isUserdataUrl(wallpaperUrl)) {
      if (!window.api?.wallpapers?.getFile) {
        return { file: null, warning: 'Wallpaper API unavailable; shared preset will not include wallpaper.' }
      }
      const wallpaperResult = await window.api.wallpapers.getFile(wallpaperUrl)
      if (!wallpaperResult?.success || !wallpaperResult?.data) {
        return { file: null, warning: 'Could not read local wallpaper; shared preset will not include wallpaper.' }
      }
      const file = fileFromBase64(
        wallpaperResult.data,
        wallpaperResult.filename || nameHint,
        mimeHint
      )
      if (file.size > COMMUNITY_WALLPAPER_MAX_BYTES) {
        return {
          file: null,
          warning: 'Wallpaper is too large to upload; shared preset will not include wallpaper.',
        }
      }
      return { file, warning: null }
    }

    if (isHttpUrl(wallpaperUrl)) {
      const response = await fetch(wallpaperUrl)
      if (!response.ok) {
        return { file: null, warning: 'Could not fetch remote wallpaper; shared preset will not include wallpaper.' }
      }
      const blob = await response.blob()
      if (blob.size > COMMUNITY_WALLPAPER_MAX_BYTES) {
        return {
          file: null,
          warning: 'Wallpaper is too large to upload; shared preset will not include wallpaper.',
        }
      }
      const file = new File([blob], nameHint.endsWith('.jpg') ? nameHint : 'wallpaper.jpg', {
        type: blob.type || mimeHint,
      })
      return { file, warning: null }
    }

    return { file: null, warning: 'Unsupported wallpaper source; shared preset will not include wallpaper.' }
  } catch {
    return { file: null, warning: 'Wallpaper upload preparation failed; shared preset will not include wallpaper.' }
  }
}

const waitForNextPaint = () =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      setTimeout(resolve, 32)
      return
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })

/**
 * Capture a preset thumbnail with empty Home channel slots (display-only).
 * Does not mutate the channels store slice — uses ui.presetThumbnailCaptureActive.
 */
export const capturePresetThumbnailDataUrl = async () => {
  let setUIState = null
  try {
    if (!window.api?.capturePresetThumbnail) return null

    // Lazy require avoids circular imports with the store ↔ preset helpers.
    const { default: useConsolidatedAppStore } = await import('./useConsolidatedAppStore')
    setUIState = useConsolidatedAppStore.getState().actions.setUIState
    setUIState({ presetThumbnailCaptureActive: true })
    await waitForNextPaint()
    // Brief settle so empty tiles paint before Electron capturePage.
    await new Promise((resolve) => setTimeout(resolve, 48))

    const result = await window.api.capturePresetThumbnail({ width: 960, height: 540, quality: 88 })
    if (!result?.success || !result?.dataUrl) return null
    return result.dataUrl
  } catch {
    return null
  } finally {
    try {
      setUIState?.({ presetThumbnailCaptureActive: false })
    } catch {
      // ignore restore failures
    }
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
