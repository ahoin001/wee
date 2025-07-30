// Community service that uses a backend proxy
// This allows all users to access community features without environment variables

class CommunityService {
  constructor() {
    this.backendUrl = 'https://your-backend-service.com/api'; // Your backend URL
  }

  // Browse community presets
  async browsePresets(searchTerm = '', sortBy = 'created_at') {
    try {
      const response = await fetch(`${this.backendUrl}/presets?search=${searchTerm}&sort=${sortBy}`);
      const data = await response.json();
      return { success: true, data: data.presets || [] };
    } catch (error) {
      console.error('Error browsing presets:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Download a preset
  async downloadPreset(presetId) {
    try {
      const response = await fetch(`${this.backendUrl}/presets/${presetId}/download`);
      const data = await response.json();
      return { success: true, data: data.preset };
    } catch (error) {
      console.error('Error downloading preset:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload a preset (anonymous)
  async uploadPreset(presetData, formData) {
    try {
      const response = await fetch(`${this.backendUrl}/presets/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presetData,
          formData,
          // No authentication required - backend handles anonymous uploads
        }),
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error uploading preset:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a preset (anonymous)
  async deletePreset(presetId) {
    try {
      const response = await fetch(`${this.backendUrl}/presets/${presetId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error deleting preset:', error);
      return { success: false, error: error.message };
    }
  }
}

export const communityService = new CommunityService(); 