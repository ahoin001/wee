import { downloadPreset, getSharedPresets, uploadPreset } from './supabase'

// Canonical community service backed by app_wee_v1 Supabase spoke.
class CommunityService {
  async browsePresets(searchTerm = '', sortBy = 'created_at') {
    return getSharedPresets(searchTerm, sortBy)
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
}

export const communityService = new CommunityService()