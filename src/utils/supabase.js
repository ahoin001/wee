import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const publicAnonKey = import.meta.env.VITE_SUPABASE_PUBLIC_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
const secretKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !publicAnonKey) {
  console.warn('Missing Supabase environment variables - community features will be disabled')
}

// Client for database operations (uses public anon key)
export const supabase = (supabaseUrl && publicAnonKey) ? createClient(supabaseUrl, publicAnonKey) : null

// Client for storage operations (uses secret key - server-side only)
const supabaseStorage = (supabaseUrl && secretKey) ? createClient(supabaseUrl, secretKey) : null

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

// Upload preset to Supabase using backend proxy
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

// Download preset from Supabase
export const downloadPreset = async (preset) => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Download the preset file
    const { data: fileData, error: fileError } = await supabase.storage
      .from('presets')
      .download(preset.preset_file_url)

    if (fileError) throw fileError

    // Convert blob to JSON
    const presetData = JSON.parse(await fileData.text())
    
    // Increment download count
    await supabase
      .from('shared_presets')
      .update({ downloads: preset.downloads + 1 })
      .eq('id', preset.id)

    return { success: true, data: presetData }
  } catch (error) {
    console.error('Error downloading preset:', error)
    return { success: false, error: error.message }
  }
}



// Get shared presets with optional search and filtering
export const getSharedPresets = async (searchTerm = '', sortBy = 'created_at') => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured', data: [] }
    }

    let query = supabase
      .from('shared_presets')
      .select('*')
      .order(sortBy, { ascending: false })

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`)
    }

    const { data, error } = await query
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching shared presets:', error)
    return { success: false, error: error.message, data: [] }
  }
} 
 