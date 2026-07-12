import { useState, useEffect, useCallback } from 'react';
import { playPreview, stopPreview } from '../utils/soundPlayback';

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
  const [hoverSoundVolume, setHoverSoundVolume] = useState(hoverSound ? hoverSound.volume : 0.7);
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

  const handleHoverSoundSelect = useCallback(
    async (soundId) => {
      try {
        const channelHoverSounds = getSoundsByCategory('channelHover');
        const selectedSound = channelHoverSounds.find((s) => s.id === soundId);

        if (selectedSound) {
          setHoverSound({
            url: selectedSound.url,
            name: selectedSound.name,
            volume: selectedSound.volume ?? 0.7,
          });
          setHoverSoundName(selectedSound.name);
          setHoverSoundUrl(selectedSound.url);
          setHoverSoundVolume(selectedSound.volume ?? 0.7);
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

  const handleHoverSoundUpload = useCallback(async () => {
    try {
      setUploadingHoverSound(true);
      setHoverSoundError('');

      const fileResult = await selectSoundFile();
      if (!fileResult.success) {
        throw new Error(fileResult.error || 'File selection failed');
      }

      const { file } = fileResult;
      const name = file.name.replace(/\.[^/.]+$/, '');

      const addResult = await addSound('channelHover', file, name);
      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add sound');
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
    reportError,
  ]);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  const handleTestHoverSound = useCallback(async () => {
    if (hoverSoundPreviewPlaying) {
      stopPreview();
      setHoverSoundPreviewPlaying(false);
      return;
    }
    if (!hoverSoundUrl) return;
    setHoverSoundPreviewPlaying(true);
    try {
      await playPreview(hoverSoundUrl, hoverSoundVolume);
    } catch (e) {
      console.error('[ChannelModal] Preview play error:', e);
      setHoverSoundPreviewPlaying(false);
    }
  }, [hoverSoundPreviewPlaying, hoverSoundUrl, hoverSoundVolume]);

  const handleHoverSoundVolumeChange = (value) => {
    setHoverSoundVolume(value);
  };

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
    stopPreview();
    setHoverSoundPreviewPlaying(false);
    setHoverSound(null);
    setHoverSoundName('');
    setHoverSoundUrl('');
    setHoverSoundVolume(0.7);
    setHoverSoundEnabled(false);
    setSelectedHoverSoundId(null);
    setHoverSoundError('');
  }, []);

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
    handleHoverSoundVolumeChange,
    clearHoverSoundSelection,
    resetHoverSoundFields,
  };
}
