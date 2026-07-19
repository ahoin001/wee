import { useState, useEffect, useCallback } from 'react';
import { playPreview, setPreviewVolume, stopPreview } from '../utils/soundPlayback';

const DEFAULT_HOVER_VOLUME = 0.5;

function isCancelSelectionError(message) {
  const text = String(message || '').toLowerCase();
  return text.includes('no file selected') || text.includes('cancel');
}

/**
 * Hover sound state, library integration, and preview for ChannelModal.
 * Per-channel override always picks from (or uploads into) the shared hover library.
 */
export function useChannelModalHoverSound({
  currentHoverSound,
  isOpen,
  addSound,
  selectSoundFile,
  getSoundsByCategory,
  loadSoundLibrary,
  soundLibrary,
  onError,
}) {
  const [hoverSound, setHoverSound] = useState(currentHoverSound || null);
  const [hoverSoundName, setHoverSoundName] = useState(hoverSound ? hoverSound.name : '');
  const [hoverSoundUrl, setHoverSoundUrl] = useState(hoverSound ? hoverSound.url : '');
  const [hoverSoundVolume, setHoverSoundVolume] = useState(
    hoverSound ? (hoverSound.volume ?? DEFAULT_HOVER_VOLUME) : DEFAULT_HOVER_VOLUME
  );
  const [hoverSoundEnabled, setHoverSoundEnabled] = useState(!!hoverSound);
  const [hoverSoundPreviewPlaying, setHoverSoundPreviewPlaying] = useState(false);
  const [selectedHoverSoundId, setSelectedHoverSoundId] = useState(null);
  const [uploadingHoverSound, setUploadingHoverSound] = useState(false);
  const [hoverSoundError, setHoverSoundError] = useState('');

  const reportError = useCallback(
    (message) => {
      setHoverSoundError(message);
      onError?.(message);
    },
    [onError]
  );

  const hydrateFromSaved = useCallback((saved) => {
    stopPreview();
    setHoverSoundPreviewPlaying(false);
    setHoverSoundError('');
    if (!saved?.url) {
      setHoverSound(null);
      setHoverSoundName('');
      setHoverSoundUrl('');
      setHoverSoundVolume(DEFAULT_HOVER_VOLUME);
      setHoverSoundEnabled(false);
      setSelectedHoverSoundId(null);
      return;
    }
    const volume = saved.volume ?? DEFAULT_HOVER_VOLUME;
    setHoverSound({
      url: saved.url,
      name: saved.name || 'Custom hover',
      volume,
    });
    setHoverSoundName(saved.name || 'Custom hover');
    setHoverSoundUrl(saved.url);
    setHoverSoundVolume(volume);
    setHoverSoundEnabled(true);
    setSelectedHoverSoundId(null);
  }, []);

  const handleHoverSoundSelect = useCallback(
    async (soundId) => {
      try {
        const channelHoverSounds = getSoundsByCategory('channelHover');
        const selectedSound = channelHoverSounds.find((s) => s.id === soundId);

        if (selectedSound) {
          setHoverSound({
            url: selectedSound.url,
            name: selectedSound.name,
            volume: selectedSound.volume ?? DEFAULT_HOVER_VOLUME,
          });
          setHoverSoundName(selectedSound.name);
          setHoverSoundUrl(selectedSound.url);
          setHoverSoundVolume(selectedSound.volume ?? DEFAULT_HOVER_VOLUME);
          setSelectedHoverSoundId(soundId);
          setHoverSoundEnabled(true);
          setHoverSoundError('');
        }
      } catch (error) {
        console.error('[ChannelModal] Error selecting hover sound:', error);
      }
    },
    [getSoundsByCategory]
  );

  const applyUploadedSound = useCallback(
    (sound) => {
      if (!sound?.url) return;
      setHoverSound({
        url: sound.url,
        name: sound.name,
        volume: sound.volume ?? DEFAULT_HOVER_VOLUME,
      });
      setHoverSoundName(sound.name || 'Custom hover');
      setHoverSoundUrl(sound.url);
      setHoverSoundVolume(sound.volume ?? DEFAULT_HOVER_VOLUME);
      setSelectedHoverSoundId(sound.id || null);
      setHoverSoundEnabled(true);
      setHoverSoundError('');
    },
    []
  );

  const handleHoverSoundUpload = useCallback(async () => {
    try {
      setUploadingHoverSound(true);
      setHoverSoundError('');

      const fileResult = await selectSoundFile();
      if (!fileResult.success) {
        if (fileResult.cancelled || isCancelSelectionError(fileResult.error)) {
          return;
        }
        throw new Error(fileResult.error || 'File selection failed');
      }

      const { file } = fileResult;
      const name = file.name.replace(/\.[^/.]+$/, '');

      const addResult = await addSound('channelHover', file, name);
      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add sound');
      }

      if (addResult.sound) {
        applyUploadedSound(addResult.sound);
        return;
      }

      await loadSoundLibrary();
      const channelHoverSounds = getSoundsByCategory('channelHover');
      const newSound = channelHoverSounds.find((s) => s.name === name);
      if (newSound) {
        await handleHoverSoundSelect(newSound.id);
      }
    } catch (error) {
      console.error('[ChannelModal] Error uploading hover sound:', error);
      reportError('Failed to upload hover sound: ' + error.message);
    } finally {
      setUploadingHoverSound(false);
    }
  }, [
    selectSoundFile,
    addSound,
    loadSoundLibrary,
    getSoundsByCategory,
    handleHoverSoundSelect,
    applyUploadedSound,
    reportError,
  ]);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopPreview();
      setHoverSoundPreviewPlaying(false);
    }
  }, [isOpen]);

  const handleTestHoverSound = useCallback(async () => {
    if (hoverSoundPreviewPlaying) {
      stopPreview();
      setHoverSoundPreviewPlaying(false);
      return;
    }
    if (!hoverSoundUrl) return;
    setHoverSoundPreviewPlaying(true);
    try {
      await playPreview(hoverSoundUrl, hoverSoundVolume, {
        onEnded: () => setHoverSoundPreviewPlaying(false),
      });
    } catch (e) {
      console.error('[ChannelModal] Preview play error:', e);
      setHoverSoundPreviewPlaying(false);
    }
  }, [hoverSoundPreviewPlaying, hoverSoundUrl, hoverSoundVolume]);

  const handleTestLibraryHoverSound = useCallback(
    async (sound) => {
      if (!sound?.url) return;
      // Selecting + testing from the library card should drive the same Stop/Test chrome.
      if (hoverSoundPreviewPlaying && hoverSoundUrl === sound.url) {
        stopPreview();
        setHoverSoundPreviewPlaying(false);
        return;
      }
      setHoverSound({
        url: sound.url,
        name: sound.name,
        volume: sound.volume ?? hoverSoundVolume,
      });
      setHoverSoundName(sound.name);
      setHoverSoundUrl(sound.url);
      setHoverSoundVolume(sound.volume ?? hoverSoundVolume);
      setSelectedHoverSoundId(sound.id);
      setHoverSoundEnabled(true);
      setHoverSoundPreviewPlaying(true);
      try {
        await playPreview(sound.url, sound.volume ?? hoverSoundVolume, {
          onEnded: () => setHoverSoundPreviewPlaying(false),
        });
      } catch (e) {
        console.error('[ChannelModal] Library preview play error:', e);
        setHoverSoundPreviewPlaying(false);
      }
    },
    [hoverSoundPreviewPlaying, hoverSoundUrl, hoverSoundVolume]
  );

  const handleHoverSoundVolumeChange = useCallback(
    (value) => {
      setHoverSoundVolume(value);
      if (hoverSoundPreviewPlaying) {
        setPreviewVolume(value);
      }
    },
    [hoverSoundPreviewPlaying]
  );

  const clearHoverSoundSelection = useCallback(() => {
    stopPreview();
    setHoverSoundPreviewPlaying(false);
    setHoverSound(null);
    setHoverSoundName('');
    setHoverSoundUrl('');
    setSelectedHoverSoundId(null);
    setHoverSoundEnabled(false);
  }, []);

  const resetHoverSoundFields = useCallback(() => {
    hydrateFromSaved(null);
  }, [hydrateFromSaved]);

  useEffect(() => {
    if (isOpen && soundLibrary && hoverSoundUrl) {
      const channelHoverSounds = getSoundsByCategory('channelHover') || [];
      const matchingSound = channelHoverSounds.find((s) => s.url === hoverSoundUrl);
      if (matchingSound) {
        setSelectedHoverSoundId(matchingSound.id);
      }
    }
  }, [isOpen, soundLibrary, hoverSoundUrl, getSoundsByCategory]);

  return {
    setHoverSound,
    hydrateFromSaved,
    hoverSoundName,
    hoverSoundUrl,
    hoverSoundVolume,
    hoverSoundEnabled,
    setHoverSoundEnabled,
    hoverSoundPreviewPlaying,
    selectedHoverSoundId,
    uploadingHoverSound,
    hoverSoundError,
    handleHoverSoundSelect,
    handleHoverSoundUpload,
    handleTestHoverSound,
    handleTestLibraryHoverSound,
    handleHoverSoundVolumeChange,
    clearHoverSoundSelection,
    resetHoverSoundFields,
  };
}
