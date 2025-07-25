import { create } from 'zustand';

const useIconsStore = create((set, get) => ({
  // State
  savedIcons: [],
  loading: false,
  error: null,
  uploading: false,
  uploadError: null,

  // Actions
  fetchIcons: async () => {
    set({ loading: true, error: null });
    try {
      if (window.api?.icons?.list) {
        const result = await window.api.icons.list();
        if (result && result.success) {
          set({ savedIcons: result.icons || [], loading: false });
        } else {
          set({ error: result?.error || 'Failed to fetch icons', loading: false });
        }
      } else {
        set({ error: 'Icons API not available', loading: false });
      }
    } catch (err) {
      console.error('Error fetching icons:', err);
      set({ error: err.message, loading: false });
    }
  },

  uploadIcon: async () => {
    set({ uploading: true, uploadError: null });
    try {
      if (!window.api?.selectIconFile) {
        throw new Error('Icon file picker is not available');
      }

      const fileResult = await window.api.selectIconFile();
      if (!fileResult.success) {
        throw new Error(fileResult.error || 'File selection cancelled');
      }

      const file = fileResult.file;
      if (!window.api?.icons?.add) {
        throw new Error('Icon upload API not available');
      }

      const addResult = await window.api.icons.add({ 
        filePath: file.path, 
        filename: file.name 
      });

      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add icon');
      }

      // Refresh the icons list after successful upload
      await get().fetchIcons();
      
      set({ uploading: false });
      return { success: true, icon: addResult.icon };
    } catch (err) {
      console.error('Upload error:', err);
      set({ uploadError: err.message, uploading: false });
      return { success: false, error: err.message };
    }
  },

  deleteIcon: async (iconUrl) => {
    try {
      if (!window.api?.icons?.delete) {
        throw new Error('Icon delete API not available');
      }

      const result = await window.api.icons.delete({ url: iconUrl });
      if (result && result.success) {
        // Refresh the icons list after successful deletion
        await get().fetchIcons();
        return { success: true };
      } else {
        throw new Error(result?.error || 'Failed to delete icon');
      }
    } catch (err) {
      console.error('Delete error:', err);
      set({ error: err.message });
      return { success: false, error: err.message };
    }
  },

  clearError: () => {
    set({ error: null, uploadError: null });
  },

  // Utility function to check if an icon exists
  hasIcon: (iconUrl) => {
    const { savedIcons } = get();
    return savedIcons.some(icon => icon.url === iconUrl);
  },

  // Utility function to get icon by URL
  getIcon: (iconUrl) => {
    const { savedIcons } = get();
    return savedIcons.find(icon => icon.url === iconUrl);
  },
}));

export default useIconsStore; 