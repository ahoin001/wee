import { supabase, getSharedPresets, downloadPreset, uploadPreset } from './supabase';
import { communityService } from './communityService';

class CommunityManager {
  constructor() {
    this.useBuiltInSupabase = !!supabase;
    console.log('[COMMUNITY] Using built-in Supabase:', this.useBuiltInSupabase);
  }

  // Browse presets - tries built-in first, falls back to backend
  async browsePresets(searchTerm = '', sortBy = 'created_at') {
    if (this.useBuiltInSupabase) {
      console.log('[COMMUNITY] Using built-in Supabase for browsing');
      return await getSharedPresets(searchTerm, sortBy);
    } else {
      console.log('[COMMUNITY] Using backend proxy for browsing');
      return await communityService.browsePresets(searchTerm, sortBy);
    }
  }

  // Download preset - tries built-in first, falls back to backend
  async downloadPreset(preset) {
    if (this.useBuiltInSupabase) {
      console.log('[COMMUNITY] Using built-in Supabase for download');
      return await downloadPreset(preset);
    } else {
      console.log('[COMMUNITY] Using backend proxy for download');
      return await communityService.downloadPreset(preset.id);
    }
  }

  // Upload preset - always uses backend proxy for security
  async uploadPreset(presetData, formData) {
    console.log('[COMMUNITY] Using backend proxy for upload (secure)');
    return await uploadPreset(presetData, formData);
  }

  // Delete preset - always uses backend proxy for security
  async deletePreset(presetId) {
    console.log('[COMMUNITY] Using backend proxy for delete (secure)');
    return await communityService.deletePreset(presetId);
  }

  // Check if community features are available
  isCommunityAvailable() {
    return this.useBuiltInSupabase || true; // Always available with backend proxy
  }

  // Get the current method being used
  getCurrentMethod() {
    return this.useBuiltInSupabase ? 'Built-in Supabase' : 'Backend Proxy';
  }
}

export const communityManager = new CommunityManager(); 