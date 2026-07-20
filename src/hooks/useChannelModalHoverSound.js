import { useState, useEffect, useCallback } from 'react';
import { playPreview, setPreviewVolume, stopPreview } from '../utils/soundPlayback';
import {
  SOUND_PREVIEW_MAX_SEC,
  assessSoundUploadSize,
  probeAudioDuration,
  validateSoundDuration,
} from '../utils/audioTrim';

const DEFAULT_HOVER_VOLUME = 0.5;

function isCancelSelectionError(message) {
  const text = String(message || '').toLowerCase();
  return text.includes('no file selected') || text.includes('cancel');
}

/**
 * Hover sound state, library integration, and preview for ChannelModal.
 * Per-channel override always picks from (or uploads into) the shared hover library.
 * Channel volume is one control — selecting a library sound does not overwrite it.
 */
export function useChannelModalHoverSound({
  currentHoverSound,
  isOpen,
  addSound,
  removeSound,
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
  const [previewingSoundId, setPreviewingSoundId] = useState(null);
  const [selectedHoverSoundId, setSelectedHoverSoundId] = useState(null);
  const [uploadingHoverSound, setUploadingHoverSound] = useState(false);
  const [deletingHoverSoundId, setDeletingHoverSoundId] = useState(null);
  const [hoverSoundError, setHoverSoundError] = useState('');
  const [hoverSoundHint, setHoverSoundHint] = useState('');
  const [trimSound, setTrimSound] = useState(null);

  const reportError = useCallback(
    (message) => {
      setHoverSoundError(message);
      onError?.(message);
    },
    [onError]
  );

  const stopHoverPreview = useCallback(() => {
    stopPreview();
    setHoverSoundPreviewPlaying(false);
    setPreviewingSoundId(null);
  }, []);

  const hydrateFromSaved = useCallback((saved) => {
    stopHoverPreview();
    setHoverSoundError('');
    setHoverSoundHint('');
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
  }, [stopHoverPreview]);

  const handleHoverSoundSelect = useCallback(
    async (soundId) => {
      try {
        const channelHoverSounds = getSoundsByCategory('channelHover');
        const selectedSound = channelHoverSounds.find((s) => s.id === soundId);

        if (selectedSound) {
          setHoverSound({
            url: selectedSound.url,
            name: selectedSound.name,
            volume: hoverSoundVolume,
          });
          setHoverSoundName(selectedSound.name);
          setHoverSoundUrl(selectedSound.url);
          setSelectedHoverSoundId(soundId);
          setHoverSoundEnabled(true);
          setHoverSoundError('');
          setHoverSoundHint('');
        }
      } catch (error) {
        console.error('[ChannelModal] Error selecting hover sound:', error);
      }
    },
    [getSoundsByCategory, hoverSoundVolume]
  );

  const applyUploadedSound = useCallback(
    (sound) => {
      if (!sound?.url) return;
      setHoverSound({
        url: sound.url,
        name: sound.name,
        volume: hoverSoundVolume,
      });
      setHoverSoundName(sound.name || 'Custom hover');
      setHoverSoundUrl(sound.url);
      setSelectedHoverSoundId(sound.id || null);
      setHoverSoundEnabled(true);
      setHoverSoundError('');
    },
    [hoverSoundVolume]
  );

  const openTrimForSound = useCallback((sound) => {
    if (!sound?.url) return;
    stopHoverPreview();
    setTrimSound(sound);
  }, [stopHoverPreview]);

  const closeTrimDialog = useCallback(() => {
    if (trimSound?.staged) {
      void window.api?.sounds?.clearStaging?.();
    }
    setTrimSound(null);
  }, [trimSound?.staged]);

  const handleTrimSaved = useCallback(
    async (savedSound) => {
      if (!savedSound) return;
      await loadSoundLibrary();
      applyUploadedSound(savedSound);
      setHoverSoundHint('Trimmed sound saved.');
      setTrimSound(null);
    },
    [applyUploadedSound, loadSoundLibrary]
  );

  const handleHoverSoundUpload = useCallback(async () => {
    try {
      setUploadingHoverSound(true);
      setHoverSoundError('');
      setHoverSoundHint('');

      const fileResult = await selectSoundFile();
      if (!fileResult.success) {
        if (fileResult.cancelled || isCancelSelectionError(fileResult.error)) {
          return;
        }
        throw new Error(fileResult.error || 'File selection failed');
      }

      const { file } = fileResult;
      const sizeCheck = assessSoundUploadSize('channelHover', file.size);
      if (sizeCheck.mustTrim) {
        if (!window.api?.sounds?.stageForTrim) {
          throw new Error(sizeCheck.message || 'File is too large to upload.');
        }
        const staged = await window.api.sounds.stageForTrim({ file });
        if (!staged?.success || !staged.sound?.url) {
          throw new Error(staged?.error || sizeCheck.message || 'Failed to prepare file for trim');
        }
        setHoverSoundHint(sizeCheck.message);
        openTrimForSound(staged.sound);
        return;
      }
      if (!sizeCheck.ok) {
        throw new Error(sizeCheck.message || 'File is too large');
      }

      const name = file.name.replace(/\.[^/.]+$/, '');

      const addResult = await addSound('channelHover', file, name);
      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add sound');
      }

      let sound = addResult.sound;
      if (!sound) {
        await loadSoundLibrary();
        const channelHoverSounds = getSoundsByCategory('channelHover');
        sound = channelHoverSounds.find((s) => s.name === name);
      }

      if (!sound) {
        throw new Error('Sound uploaded but could not be found in the library');
      }

      applyUploadedSound(sound);

      const duration = await probeAudioDuration(sound.url);
      const check = validateSoundDuration('channelHover', duration);
      if (!check.ok) {
        setHoverSoundHint(check.error);
        openTrimForSound(sound);
        return;
      }
      if (check.warn) {
        setHoverSoundHint(check.warn);
        openTrimForSound(sound);
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
    applyUploadedSound,
    openTrimForSound,
    reportError,
  ]);

  const handleHoverSoundDelete = useCallback(
    async (soundId) => {
      if (!soundId || !removeSound) return;
      try {
        setDeletingHoverSoundId(soundId);
        setHoverSoundError('');
        if (previewingSoundId === soundId) {
          stopHoverPreview();
        }
        await removeSound('channelHover', soundId);
        if (selectedHoverSoundId === soundId) {
          setHoverSound(null);
          setHoverSoundName('');
          setHoverSoundUrl('');
          setSelectedHoverSoundId(null);
        }
      } catch (error) {
        console.error('[ChannelModal] Error deleting hover sound:', error);
        reportError('Failed to delete hover sound: ' + (error?.message || 'Unknown error'));
      } finally {
        setDeletingHoverSoundId(null);
      }
    },
    [
      removeSound,
      previewingSoundId,
      selectedHoverSoundId,
      stopHoverPreview,
      reportError,
    ]
  );

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopHoverPreview();
      setTrimSound(null);
    }
  }, [isOpen, stopHoverPreview]);

  const handleTestHoverSound = useCallback(async () => {
    if (hoverSoundPreviewPlaying && (!previewingSoundId || previewingSoundId === selectedHoverSoundId)) {
      stopHoverPreview();
      return;
    }
    if (!hoverSoundUrl) return;
    setHoverSoundPreviewPlaying(true);
    setPreviewingSoundId(selectedHoverSoundId);
    try {
      await playPreview(hoverSoundUrl, hoverSoundVolume, {
        maxDurationSec: SOUND_PREVIEW_MAX_SEC,
        onEnded: () => {
          setHoverSoundPreviewPlaying(false);
          setPreviewingSoundId(null);
        },
      });
    } catch (e) {
      console.error('[ChannelModal] Preview play error:', e);
      setHoverSoundPreviewPlaying(false);
      setPreviewingSoundId(null);
      reportError(e?.message || 'Preview failed — the file may be corrupt or unsupported.');
    }
  }, [
    hoverSoundPreviewPlaying,
    previewingSoundId,
    selectedHoverSoundId,
    hoverSoundUrl,
    hoverSoundVolume,
    stopHoverPreview,
    reportError,
  ]);

  const handleTestLibraryHoverSound = useCallback(
    async (sound) => {
      if (!sound?.url) return;
      if (hoverSoundPreviewPlaying && previewingSoundId === sound.id) {
        stopHoverPreview();
        return;
      }
      setHoverSoundPreviewPlaying(true);
      setPreviewingSoundId(sound.id);
      try {
        await playPreview(sound.url, hoverSoundVolume, {
          maxDurationSec: SOUND_PREVIEW_MAX_SEC,
          onEnded: () => {
            setHoverSoundPreviewPlaying(false);
            setPreviewingSoundId(null);
          },
        });
      } catch (e) {
        console.error('[ChannelModal] Library preview play error:', e);
        setHoverSoundPreviewPlaying(false);
        setPreviewingSoundId(null);
      }
    },
    [hoverSoundPreviewPlaying, previewingSoundId, hoverSoundVolume, stopHoverPreview]
  );

  const handleHoverSoundVolumeChange = useCallback(
    (value) => {
      setHoverSoundVolume(value);
      setHoverSound((prev) => (prev ? { ...prev, volume: value } : prev));
      if (hoverSoundPreviewPlaying) {
        setPreviewVolume(value);
      }
    },
    [hoverSoundPreviewPlaying]
  );

  const clearHoverSoundSelection = useCallback(() => {
    stopHoverPreview();
    setHoverSound(null);
    setHoverSoundName('');
    setHoverSoundUrl('');
    setSelectedHoverSoundId(null);
    setHoverSoundEnabled(false);
    setHoverSoundHint('');
  }, [stopHoverPreview]);

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

  const openTrimForSelected = useCallback(() => {
    const channelHoverSounds = getSoundsByCategory('channelHover') || [];
    const selected =
      channelHoverSounds.find((s) => s.id === selectedHoverSoundId) ||
      channelHoverSounds.find((s) => s.url === hoverSoundUrl);
    if (selected) {
      openTrimForSound(selected);
      return;
    }
    if (hoverSoundUrl) {
      openTrimForSound({
        id: selectedHoverSoundId,
        name: hoverSoundName || 'Custom hover',
        url: hoverSoundUrl,
        isDefault: false,
      });
    }
  }, [
    getSoundsByCategory,
    selectedHoverSoundId,
    hoverSoundUrl,
    hoverSoundName,
    openTrimForSound,
  ]);

  return {
    setHoverSound,
    hydrateFromSaved,
    hoverSoundName,
    hoverSoundUrl,
    hoverSoundVolume,
    hoverSoundEnabled,
    setHoverSoundEnabled,
    hoverSoundPreviewPlaying,
    previewingSoundId,
    selectedHoverSoundId,
    uploadingHoverSound,
    deletingHoverSoundId,
    hoverSoundError,
    hoverSoundHint,
    trimSound,
    closeTrimDialog,
    handleTrimSaved,
    openTrimForSelected,
    openTrimForSound,
    handleHoverSoundSelect,
    handleHoverSoundUpload,
    handleHoverSoundDelete,
    handleTestHoverSound,
    handleTestLibraryHoverSound,
    handleHoverSoundVolumeChange,
    clearHoverSoundSelection,
    resetHoverSoundFields,
  };
}
