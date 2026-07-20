import { useState, useRef, useCallback } from 'react';
import { getStoragePublicObjectUrl } from '../utils/supabase';
import { uploadFileToMediaLibraryRow } from '../utils/mediaLibraryUploadApply';
import {
  isSupportedGalleryStillUpload,
  isSupportedImageOrVideoUpload,
  SUPPORTED_GALLERY_HINT,
  SUPPORTED_IMAGE_VIDEO_HINT,
} from '../utils/supportedUploadMedia';
import {
  CHANNEL_ART_MOTION,
  CHANNEL_GALLERY_MAX_STILLS,
  isChannelGalleryStillType,
  mediaFromChannelGallery,
  normalizeChannelGallery,
  normalizeChannelMedia,
  replaceChannelMediaArt,
} from '../utils/channelMediaFit';
import { isVideoMediaType } from '../utils/channelMediaType';

function galleryItemId() {
  return `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Channel image / gallery state and handlers for ChannelModal.
 * SSOT: `media` (includes gallery + artMotion). `imageGallery` mirrors media.gallery for UI.
 */
export function useChannelModalMedia({ currentMedia }) {
  const [media, setMediaState] = useState(() => normalizeChannelMedia(currentMedia));
  const [imageGallery, setImageGalleryState] = useState(() =>
    normalizeChannelGallery(currentMedia?.gallery)
  );
  const [galleryMode, setGalleryMode] = useState(
    () => normalizeChannelGallery(currentMedia?.gallery).length > 1
  );
  const fileInputRef = useRef();
  const galleryFileInputRef = useRef();
  const [mediaUploadHint, setMediaUploadHint] = useState('');
  const [libraryUploading, setLibraryUploading] = useState(false);

  const syncMediaFromGallery = useCallback((gallery, artMotion) => {
    const normalized = normalizeChannelGallery(gallery);
    setImageGalleryState(normalized);
    if (normalized.length === 0) {
      setMediaState((prev) => {
        if (!prev) return null;
        return normalizeChannelMedia({
          ...prev,
          gallery: undefined,
          artMotion: CHANNEL_ART_MOTION.COVER,
        });
      });
      return;
    }
    setMediaState((prev) => {
      const motion =
        artMotion !== undefined
          ? artMotion
          : prev?.artMotion === CHANNEL_ART_MOTION.CINEMATIC
            ? CHANNEL_ART_MOTION.CINEMATIC
            : normalized.length > 1
              ? CHANNEL_ART_MOTION.GALLERY_IDLE
              : CHANNEL_ART_MOTION.COVER;
      return mediaFromChannelGallery(
        normalized.map((item, i) =>
          i === 0 && prev
            ? { ...item, focalX: prev.focalX, focalY: prev.focalY, name: prev.name || item.name }
            : item
        ),
        motion
      );
    });
  }, []);

  /** Preserve / reset focal framing through the shared media-fit contract. */
  const setMedia = useCallback((next) => {
    if (next == null) {
      setMediaState(null);
      setImageGalleryState([]);
      setGalleryMode(false);
      return;
    }
    setMediaState((prev) => {
      const replaced = replaceChannelMediaArt(prev, next);
      if (isVideoMediaType(replaced?.type)) {
        setImageGalleryState([]);
        setGalleryMode(false);
        return replaced;
      }
      const gal = normalizeChannelGallery(replaced?.gallery);
      if (gal.length > 0) {
        setImageGalleryState(gal);
        setGalleryMode(gal.length > 1);
      } else if (replaced?.url && isChannelGalleryStillType(replaced.type || 'image/png')) {
        // Single cover replace — clear multi-gallery
        setImageGalleryState([]);
        setGalleryMode(false);
      }
      return replaced;
    });
  }, []);

  const setImageGallery = useCallback(
    (next) => {
      const value = typeof next === 'function' ? next(imageGallery) : next;
      syncMediaFromGallery(value);
    },
    [imageGallery, syncMediaFromGallery]
  );

  const setArtMotion = useCallback((motion) => {
    setMediaState((prev) => {
      if (!prev) return prev;
      const gallery = normalizeChannelGallery(prev.gallery?.length ? prev.gallery : imageGallery);
      return normalizeChannelMedia({
        ...prev,
        gallery: gallery.length > 0 ? gallery : undefined,
        artMotion: motion,
      });
    });
  }, [imageGallery]);

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
  }, [setMedia]);

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

      const room = Math.max(0, CHANNEL_GALLERY_MAX_STILLS - imageGallery.length);
      const toAdd = fileArray.slice(0, room);
      if (toAdd.length < fileArray.length) {
        setMediaUploadHint(`Gallery holds up to ${CHANNEL_GALLERY_MAX_STILLS} stills.`);
      }
      if (toAdd.length === 0) return;

      const tempImages = toAdd.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type,
        name: file.name,
        id: galleryItemId(),
        loading: true,
      }));

      let base = imageGallery;
      if (
        base.length === 0 &&
        media?.url &&
        isChannelGalleryStillType(media.type)
      ) {
        base = [
          {
            url: media.url,
            type: media.type,
            name: media.name,
            id: galleryItemId(),
            focalX: media.focalX,
            focalY: media.focalY,
          },
        ];
      }

      const withTemps = [...base, ...tempImages].slice(0, CHANNEL_GALLERY_MAX_STILLS);
      syncMediaFromGallery(withTemps);
      setGalleryMode(true);

      const persistentImages = [];
      for (let i = 0; i < toAdd.length; i++) {
        const file = toAdd[i];
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

      setImageGalleryState((prev) => {
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
        syncMediaFromGallery(newGallery);
        return newGallery;
      });
    } catch (error) {
      console.error('Error processing gallery files:', error);
    }
  }, [imageGallery, media, syncMediaFromGallery]);

  const handleRemoveGalleryImage = useCallback(
    (imageId) => {
      const next = imageGallery.filter((img) => img.id !== imageId && img.url !== imageId);
      syncMediaFromGallery(next);
      if (next.length <= 1) setGalleryMode(false);
    },
    [imageGallery, syncMediaFromGallery]
  );

  const handleReorderGallery = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      const next = [...imageGallery];
      if (fromIndex < 0 || fromIndex >= next.length || toIndex < 0 || toIndex >= next.length) return;
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      syncMediaFromGallery(next);
    },
    [imageGallery, syncMediaFromGallery]
  );

  const handleAddLibraryStillToGallery = useCallback(
    (mediaItem) => {
      if (!mediaItem) return;
      if (mediaItem.file_type === 'video') {
        setMediaUploadHint('Gallery stills only — videos stay single-cover.');
        return;
      }
      if (imageGallery.length >= CHANNEL_GALLERY_MAX_STILLS) {
        setMediaUploadHint(`Gallery holds up to ${CHANNEL_GALLERY_MAX_STILLS} stills.`);
        return;
      }
      const mediaUrl = getStoragePublicObjectUrl('media-library', mediaItem.file_url);
      let mimeType = 'image/png';
      if (mediaItem.file_type === 'gif') mimeType = 'image/gif';
      else if (mediaItem.mime_type) mimeType = mediaItem.mime_type;

      if (!isChannelGalleryStillType(mimeType)) {
        setMediaUploadHint(SUPPORTED_GALLERY_HINT);
        return;
      }

      const next = [
        ...imageGallery,
        {
          url: mediaUrl,
          type: mimeType,
          name: mediaItem.title || mediaItem.file_url,
          id: galleryItemId(),
        },
      ];
      // Seed gallery from current cover if empty
      if (imageGallery.length === 0 && media?.url && isChannelGalleryStillType(media.type)) {
        next.unshift({
          url: media.url,
          type: media.type,
          name: media.name,
          id: galleryItemId(),
          focalX: media.focalX,
          focalY: media.focalY,
        });
      }
      // Avoid duplicating if library pick is the same as cover we just seeded
      const deduped = [];
      const seen = new Set();
      for (const item of next) {
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        deduped.push(item);
      }
      syncMediaFromGallery(deduped.slice(0, CHANNEL_GALLERY_MAX_STILLS));
      setGalleryMode(true);
      setMediaUploadHint('');
    },
    [imageGallery, media, syncMediaFromGallery]
  );

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
  }, [setMedia]);

  /**
   * Upload to Supabase media library, apply URL to channel, and refresh local library cache.
   */
  const handleUploadToLibraryAndChannel = useCallback(async (file, { title, description, tags } = {}) => {
    if (!file) return;
    setMediaUploadHint('');
    if (!isSupportedImageOrVideoUpload(file)) {
      setMediaUploadHint(SUPPORTED_IMAGE_VIDEO_HINT);
      return;
    }

    const baseTitle =
      String(title || '')
        .trim()
        .replace(/\.[^.]+$/, '') ||
      file.name.replace(/\.[^.]+$/, '') ||
      'Channel media';

    const meta = {
      title: baseTitle,
      description: String(description || '').trim(),
      tags: Array.isArray(tags)
        ? tags.filter(Boolean)
        : String(tags || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
    };

    const tempUrl = URL.createObjectURL(file);
    setMedia({ url: tempUrl, type: file.type, name: file.name, loading: true });
    setLibraryUploading(true);

    try {
      const result = await uploadFileToMediaLibraryRow(file, meta);
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      const mediaUrl = result.url;
      setMedia({
        url: mediaUrl,
        type: result.type,
        name: result.row?.title || result.row?.file_url || file.name,
        isBuiltin: true,
      });
      URL.revokeObjectURL(tempUrl);
    } catch (error) {
      console.error('[useChannelModalMedia] Library upload failed:', error);
      setMediaUploadHint(error?.message || 'Upload failed');
      setMedia({
        url: tempUrl,
        type: file.type,
        name: file.name,
        loading: false,
        temporary: true,
      });
    } finally {
      setLibraryUploading(false);
    }
  }, [setMedia]);

  const handleRemoveImage = useCallback(() => {
    setMedia(null);
  }, [setMedia]);

  return {
    media,
    setMedia,
    imageGallery,
    setImageGallery,
    galleryMode,
    setGalleryMode,
    setArtMotion,
    fileInputRef,
    galleryFileInputRef,
    handleFileSelect,
    handleGalleryFilesSelect,
    handleRemoveGalleryImage,
    handleReorderGallery,
    handleAddLibraryStillToGallery,
    handleImageSelect,
    handleRemoveImage,
    mediaUploadHint,
    setMediaUploadHint,
    clearMediaUploadHint,
    libraryUploading,
    handleUploadToLibraryAndChannel,
  };
}
