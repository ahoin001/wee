import { getStoragePublicObjectUrl, uploadMedia } from './supabase';
import { clearMediaLibraryCache } from './mediaLibraryCache';
import { resolveMimeTypeFromMediaLibraryRow } from './channelMediaType';

/**
 * Upload a file to media library storage + DB row; returns public URL and MIME for channel/game hub use.
 */
export async function uploadFileToMediaLibraryRow(file, meta) {
  const result = await uploadMedia(file, meta);
  if (!result.success) {
    return { success: false, error: result.error || 'Upload failed' };
  }
  clearMediaLibraryCache();
  const row = result.data;
  const url = getStoragePublicObjectUrl('media-library', row.file_url);
  const type = resolveMimeTypeFromMediaLibraryRow(row);
  return { success: true, url, type, row };
}
