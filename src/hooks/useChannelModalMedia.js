import { useState, useRef, useCallback } from 'react';
import { getStoragePublicObjectUrl } from '../utils/supabase';
import {
  isSupportedGalleryStillUpload,
  isSupportedImageOrVideoUpload,
  SUPPORTED_GALLERY_HINT,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../utils/supportedUploadMedia';

/**
 * Channel image / gallery state and handlers for ChannelModal.
 */
export function useChannelModalMedia({ currentMedia }) {
  const [media, setMedia] = useState(currentMedia);
  const [imageGallery, setImageGallery] = useState(currentMedia?.gallery || []);
  const [galleryMode, setGalleryMode] = useState(false);
  const fileInputRef = useRef();
  const galleryFileInputRef = useRef();
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [mediaUploadHint, setMediaUploadHint] = useState('');

  const clearMediaUploadHint = useCallback(() => setMediaUploadHint(''), []);

  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;
    setMediaUploadHint('');
    if (!isSupportedImageOrVideoUpload(file)) {
      setMediaUploadHint(SUPPORTED_IMAGE_VIDEO_HINT);
      return;
    }
    const tempUrl = URL.createObjectURL(file);
    setMedia({ url: tempUrl, type: file.type, name: file.name, loading: true });

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await window.api.wallpapers.saveFile({
        filename: file.name,
        data: base64Data,
      });

      if (result.success) {
        setMedia({ url: result.url, type: file.type, name: file.name, loading: false });
        URL.revokeObjectURL(tempUrl);
      } else {
        console.error('Failed to save media file:', result.error);
        setMedia({ url: tempUrl, type: file.type, name: file.name, loading: false, temporary: true });
      }
    } catch (error) {
      console.error('Error saving media file:', error);
      setMedia({ url: tempUrl, type: file.type, name: file.name, loading: false, temporary: true });
    }
  }, []);

  const handleGalleryFilesSelect = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    setMediaUploadHint('');
    try {
      const allFiles = Array.from(files);
      const fileArray = allFiles.filter(isSupportedGalleryStillUpload);
      const skipped = allFiles.length - fileArray.length;
      if (skipped > 0) {
        setMediaUploadHint(
          skipped === allFiles.length
            ? SUPPORTED_GALLERY_HINT
            : `${skipped} file(s) skipped — ${SUPPORTED_GALLERY_HINT}`
        );
      }
      if (fileArray.length === 0) return;

      const tempImages = fileArray.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type,
        name: file.name,
        id: `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        loading: true,
      }));

      setImageGallery((prev) => [...prev, ...tempImages]);

      const persistentImages = [];
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const tempImage = tempImages[i];

        try {
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const result = await window.api.wallpapers.saveFile({
            filename: file.name,
            data: base64Data,
          });

          if (result.success) {
            persistentImages.push({
              url: result.url,
              type: file.type,
              name: file.name,
              id: tempImage.id,
              loading: false,
            });
          } else {
            console.error('Failed to save gallery image:', result.error);
            persistentImages.push({
              ...tempImage,
              loading: false,
              error: 'Failed to save',
            });
          }
        } catch (error) {
          console.error('Error saving gallery image:', error);
          persistentImages.push({
            ...tempImage,
            loading: false,
            error: error.message,
          });
        }
      }

      setImageGallery((prev) => {
        const newGallery = [...prev];
        tempImages.forEach((tempImg) => {
          const index = newGallery.findIndex((img) => img.id === tempImg.id);
          if (index !== -1) {
            const persistentImg = persistentImages.find((img) => img.id === tempImg.id);
            if (persistentImg) {
              newGallery[index] = persistentImg;
              if (tempImg.url.startsWith('blob:')) {
                URL.revokeObjectURL(tempImg.url);
              }
            }
          }
        });
        return newGallery;
      });
    } catch (error) {
      console.error('Error processing gallery files:', error);
      const newImages = Array.from(files).map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type,
        name: file.name,
        id: `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        error: 'Could not save persistently',
      }));
      setImageGallery((prev) => [...prev, ...newImages]);
    }
  }, []);

  const handleRemoveGalleryImage = useCallback((imageId) => {
    setImageGallery((prev) => prev.filter((img) => img.id !== imageId));
  }, []);

  const handleImageSelect = useCallback((mediaItem) => {
    const mediaUrl = getStoragePublicObjectUrl('media-library', mediaItem.file_url);
    let mimeType = 'image/png';
    if (mediaItem.file_type === 'gif') {
      mimeType = 'image/gif';
    } else if (mediaItem.file_type === 'video') {
      mimeType = 'video/mp4';
    } else if (mediaItem.mime_type) {
      mimeType = mediaItem.mime_type;
    }

    setMedia({
      url: mediaUrl,
      type: mimeType,
      name: mediaItem.title || mediaItem.file_url,
      isBuiltin: true,
    });
    setShowImageSearch(false);
  }, []);

  const handleUploadClick = useCallback(() => {
    setShowImageSearch(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setMedia(null);
  }, []);

  return {
    media,
    setMedia,
    imageGallery,
    setImageGallery,
    galleryMode,
    setGalleryMode,
    fileInputRef,
    galleryFileInputRef,
    showImageSearch,
    setShowImageSearch,
    handleFileSelect,
    handleGalleryFilesSelect,
    handleRemoveGalleryImage,
    handleImageSelect,
    handleUploadClick,
    handleRemoveImage,
    mediaUploadHint,
    clearMediaUploadHint,
  };
}
