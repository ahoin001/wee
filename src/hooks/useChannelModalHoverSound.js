import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hover sound state, library integration, preview audio, and handlers for ChannelModal.
 */
export function useChannelModalHoverSound({
  currentHoverSound,
  isOpen,
  addSound,
  selectSoundFile,
  getSoundsByCategory,
  loadSoundLibrary,
  soundLibrary,
}) {
  const [hoverSound, setHoverSound] = useState(currentHoverSound || null);
  const hoverSoundInputRef = useRef();
  const [hoverSoundName, setHoverSoundName] = useState(hoverSound ? hoverSound.name : '');
  const [hoverSoundUrl, setHoverSoundUrl] = useState(hoverSound ? hoverSound.url : '');
  const [hoverSoundVolume, setHoverSoundVolume] = useState(hoverSound ? hoverSound.volume : 0.7);
  const [hoverSoundEnabled, setHoverSoundEnabled] = useState(!!hoverSound);
  const [hoverSoundAudio, setHoverSoundAudio] = useState(null);
  const [selectedHoverSoundId, setSelectedHoverSoundId] = useState(null);
  const [uploadingHoverSound, setUploadingHoverSound] = useState(false);

  const handleHoverSoundFile = async (file) => {
    if (!file) return;
    if (file.path) {
      const result = await window.api.channels.copyHoverSound({ filePath: file.path, filename: file.name });
      if (result.success) {
        setHoverSound({ url: result.url, name: file.name, volume: hoverSoundVolume });
        setHoverSoundName(file.name);
        setHoverSoundUrl(result.url);
        setHoverSoundEnabled(true);
      } else {
        alert('Failed to save hover sound: ' + result.error);
      }
    } else {
      const url = URL.createObjectURL(file);
      setHoverSound({ url, name: file.name, volume: hoverSoundVolume });
      setHoverSoundName(file.name);
      setHoverSoundUrl(url);
      setHoverSoundEnabled(true);
    }
  };

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
      alert('Failed to upload hover sound: ' + error.message);
    } finally {
      setUploadingHoverSound(false);
    }
  }, [selectSoundFile, addSound, loadSoundLibrary, getSoundsByCategory, handleHoverSoundSelect]);

  useEffect(() => {
    return () => {
      if (hoverSoundAudio) {
        if (hoverSoundAudio._fadeInterval) {
          clearInterval(hoverSoundAudio._fadeInterval);
        }
        hoverSoundAudio.pause();
        hoverSoundAudio.src = '';
        hoverSoundAudio.load();
      }
    };
  }, [hoverSoundAudio]);

  const handleTestHoverSound = () => {
    if (hoverSoundAudio) {
      hoverSoundAudio.pause();
      hoverSoundAudio.currentTime = 0;
      setHoverSoundAudio(null);
    } else if (hoverSoundUrl) {
      const audio = new Audio(hoverSoundUrl);
      audio.volume = hoverSoundVolume;
      audio
        .play()
        .then(() => {
          setHoverSoundAudio(audio);
        })
        .catch((e) => {
          console.error('[DEBUG] Audio play error:', e);
        });

      audio.onended = () => {
        setHoverSoundAudio(null);
      };
    }
  };

  const handleHoverSoundVolumeChange = (value) => {
    setHoverSoundVolume(value);
    if (hoverSoundAudio) {
      hoverSoundAudio.volume = value;
    }
  };

  const clearHoverSoundSelection = useCallback(() => {
    setHoverSound(null);
    setHoverSoundName('');
    setHoverSoundUrl('');
    setSelectedHoverSoundId(null);
    setHoverSoundEnabled(false);
  }, []);

  /** Full reset for “clear channel” and similar flows */
  const resetHoverSoundFields = useCallback(() => {
    setHoverSound(null);
    setHoverSoundName('');
    setHoverSoundUrl('');
    setHoverSoundVolume(0.7);
    setHoverSoundEnabled(false);
    setSelectedHoverSoundId(null);
    setHoverSoundAudio(null);
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
    hoverSoundInputRef,
    hoverSoundName,
    hoverSoundUrl,
    hoverSoundVolume,
    hoverSoundEnabled,
    setHoverSoundEnabled,
    hoverSoundAudio,
    selectedHoverSoundId,
    uploadingHoverSound,
    handleHoverSoundFile,
    handleHoverSoundSelect,
    handleHoverSoundUpload,
    handleTestHoverSound,
    handleHoverSoundVolumeChange,
    clearHoverSoundSelection,
    resetHoverSoundFields,
  };
}
