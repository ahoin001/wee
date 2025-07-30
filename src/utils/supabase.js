import { createClient } from '@supabase/supabase-js'

// Built-in Supabase configuration for community features
// These are public keys that are safe to include in client apps
const SUPABASE_URL = 'https://bmlcydwltfexgbsyunkf.supabase.co' // Replace with your project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbGN5ZHdsdGZleGdic3l1bmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTMzNDAsImV4cCI6MjA2OTM4OTM0MH0.m1kx74I5ytK0dLFPFAwD18Q907wvE56jvyQr3otp5A4' // Replace with your public anon key

// For public operations (browsing, downloading), we can use the client directly
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// For private operations (uploading, deleting), we use the backend proxy
// This is already implemented in electron.cjs

console.log('[SUPABASE] Client created for public operations');

// Helper function to generate thumbnail from preset data
export const generateThumbnail = async (presetData) => {
  // Create a canvas to generate thumbnail
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = 300
  canvas.height = 200
  
  // Draw a simple thumbnail based on preset data
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, 300, 200)
  
  // Add preset name
  ctx.fillStyle = '#333'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(presetData.name, 150, 100)
  
  // Add channel count
  ctx.font = '12px Arial'
  ctx.fillText(`${presetData.channels?.length || 0} channels`, 150, 120)
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', 0.8)
  })
}

// Browse presets (public operation - can use client directly)
export const getSharedPresets = async (searchTerm = '', sortBy = 'created_at') => {
  try {
    console.log('[SUPABASE] Fetching shared presets...');
    console.log('[SUPABASE] Search term:', searchTerm);
    console.log('[SUPABASE] Sort by:', sortBy);
    
    let query = supabase
      .from('shared_presets')
      .select('*')
      .order(sortBy, { ascending: false })
    
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`)
    }
    
    const { data, error } = await query
    console.log('[SUPABASE] Query result:', { data: data?.length || 0, error });
    
    if (error) {
      console.error('[SUPABASE] Database error:', error);
      throw error;
    }
    
    console.log('[SUPABASE] Successfully fetched presets:', data?.length || 0);
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('[SUPABASE] Error fetching shared presets:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Download preset (public operation - can use client directly)
export const downloadPreset = async (preset) => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Download the preset file
    const { data: fileData, error: fileError } = await supabase.storage
      .from('presets')
      .download(preset.preset_file_url)

    if (fileError) {
      console.error('Error downloading preset file:', fileError);
      return { success: false, error: fileError.message };
    }

    // Convert the file data to text
    const presetText = await fileData.text();
    const presetData = JSON.parse(presetText);

    return { success: true, data: presetData };
  } catch (error) {
    console.error('Error downloading preset:', error);
    return { success: false, error: error.message };
  }
}

// Upload preset (private operation - uses backend proxy)
export const uploadPreset = async (presetData, formData) => {
  try {
    console.log('Starting upload process...');
    console.log('Form data:', formData);
    console.log('Preset data structure:', Object.keys(presetData));
    
    // Check if backend API is available
    if (!window.api?.supabaseUpload) {
      return { success: false, error: 'Upload functionality not available' };
    }
    
    // Generate thumbnail
    console.log('Generating thumbnail...');
    const thumbnailBlob = await generateThumbnail(presetData)
    console.log('Thumbnail generated, size:', thumbnailBlob.size);
    
    // Convert thumbnail to base64 for IPC transfer
    const thumbnailBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(thumbnailBlob);
    });
    
    // Use backend proxy for storage operations
    const uploadResult = await window.api.supabaseUpload({
      presetData: JSON.stringify(presetData),
      formData,
      thumbnailBase64,
      presetFileName: `${formData.name}-${Date.now()}.json`,
      thumbnailFileName: `${formData.name}-${Date.now()}.png`
    });
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error);
    }
    
    console.log('Upload completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error uploading preset:', error)
    return { success: false, error: error.message }
  }
} 
 