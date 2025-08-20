import { supabase, getSharedPresets, downloadPreset as downloadPresetFromSupabase, uploadPreset } from './supabase';
import { communityService } from './communityService';

class CommunityManager {
  constructor() {
    this.useBuiltInSupabase = !!supabase;
  }

  // Browse presets using the appropriate method
  async browsePresets() {
    if (this.useBuiltInSupabase) {
      return await this.browsePresetsWithSupabase();
    } else {
      return await this.browsePresetsWithBackend();
    }
  }

  // Download preset using the appropriate method
  async downloadPreset(presetId) {
    if (this.useBuiltInSupabase) {
      return await this.downloadPresetWithSupabase(presetId);
    } else {
      return await this.downloadPresetWithBackend(presetId);
    }
  }

  // Upload preset using backend proxy (secure)
  async uploadPreset(presetData) {
    return await this.uploadPresetWithBackend(presetData);
  }

  // Delete preset using backend proxy (secure)
  async deletePreset(presetId) {
    return await this.deletePresetWithBackend(presetId);
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