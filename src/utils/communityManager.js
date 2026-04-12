import { getSharedPresets, downloadPreset, uploadPreset } from './supabase'

class CommunityManager {
  async browsePresets() {
    return getSharedPresets()
  }

  async downloadPreset(presetId) {
    return downloadPreset(presetId)
  }

  async uploadPreset(presetData, formData) {
    try {
      const data = await uploadPreset(presetData, formData)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  isCommunityAvailable() {
    return true
  }

  getCurrentMethod() {
    return 'Supabase spoke client'
  }
}

export const communityManager = new CommunityManager()