import React, { useState, useCallback, useEffect } from 'react';
import { GripVertical, Headphones, Heart, MousePointer2, Music, Trash2, Volume2 } from 'lucide-react';
import useSoundManager from '../../utils/useSoundManager';
import useSoundLibrary from '../../utils/useSoundLibrary';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import WToggle from '../../ui/WToggle';
import Text from '../../ui/Text';
import Button from '../../ui/WButton';
import { ResourceUsageIndicator } from '../widgets';
import Slider from '../../ui/Slider';
import '../audio/sound-management.css';
import './surfaceStyles.css';
import { WeeModalFieldCard, WeeSettingsCollapsibleSection } from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import { IS_DEV } from '../../utils/env';

const SOUND_CATEGORY_ICONS = {
  backgroundMusic: Music,
  channelClick: MousePointer2,
  channelHover: Headphones,
};

const SOUND_CATEGORY_DESCRIPTIONS = {
  backgroundMusic: 'Continuous background audio — playlist, loop, and library.',
  channelClick: 'One-shot when you activate a channel tile.',
  channelHover: 'Optional hover feedback — can add overhead with many tiles.',
};

/**
 * Sound Settings Tab - Complete sound management interface
 * Manages background music, channel click sounds, and channel hover sounds
 */
const SoundsSettingsTab = React.memo(({ settingsActiveTabId } = {}) => {
  // Sound management hooks
  const {
    soundSettings,
    playChannelClickSound,
    playChannelHoverSound,
    stopAllSounds,
    updateChannelClickSound,
    updateChannelHoverSound,
    saveSoundSettings,
    updateBackgroundMusic
  } = useSoundManager();

  const {
    soundLibrary,
    loading,
    error,
    SOUND_CATEGORIES,
    addSound,
    removeSound,
    updateSound,
    toggleLike,
    selectSoundFile,
    getSoundsByCategory,
    getEnabledSoundsByCategory,
    getLikedSoundsByCategory,
    clearError,
    loadSoundLibrary
  } = useSoundLibrary();

  // Local state
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState({});
  const [testing, setTesting] = useState({});
  const [audioRefs, setAudioRefs] = useState({});
  const audioRefsRef = React.useRef({});
  React.useEffect(() => {
    audioRefsRef.current = audioRefs;
  }, [audioRefs]);

  const [draggedItem, setDraggedItem] = useState(null);
  const [_dragOverItem, setDragOverItem] = useState(null);

  /** When `undefined`, treat as active (standalone / tests). */
  const isSoundsTabActive = settingsActiveTabId == null || settingsActiveTabId === 'sounds';

  const stopAllPreviewAudio = useCallback(() => {
    Object.values(audioRefsRef.current).forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setAudioRefs({});
    setTesting({});
  }, []);

  // Stop immediately when user selects another settings tab (exit animation keeps this view mounted briefly).
  React.useEffect(() => {
    const onLeaveTab = () => {
      stopAllPreviewAudio();
      stopAllSounds();
    };
    window.addEventListener('wee-settings-leave-sounds-tab', onLeaveTab);
    return () => window.removeEventListener('wee-settings-leave-sounds-tab', onLeaveTab);
  }, [stopAllPreviewAudio, stopAllSounds]);

  // If this view ever stays mounted with a non-sounds active id, stop previews.
  React.useEffect(() => {
    if (isSoundsTabActive) return;
    stopAllPreviewAudio();
    stopAllSounds();
  }, [isSoundsTabActive, stopAllPreviewAudio, stopAllSounds]);

  
  // Global sound preferences (store slice) — do not shadow with per-category lists below.
  const soundPrefs = useConsolidatedAppStore((state) => state.sounds);
  const { setSoundsState } = useConsolidatedAppStore(state => state.actions);
  






  // Clear message after 3 seconds
  React.useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  // Stop all preview audio on unmount (always use ref so we catch the latest instances).
  React.useEffect(() => {
    return () => {
      Object.values(audioRefsRef.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      stopAllSounds();
    };
  }, [stopAllSounds]);

  // Debug: Log current sound library state (only in development)
  useEffect(() => {
    if (IS_DEV) {
      console.log('[SoundsSettingsTab] Current sound library:', soundLibrary);
      console.log('[SoundsSettingsTab] Background music sounds:', soundLibrary.backgroundMusic);
      console.log('[SoundsSettingsTab] Sound settings:', soundSettings);
    }
  }, [soundLibrary, soundSettings]);





  // Show message helper
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
  }, []);

  // Handle file upload
  const handleUploadClick = useCallback(async (category) => {
    try {
      console.log('[SoundsSettingsTab] Starting upload for category:', category);
      setUploading(prev => ({ ...prev, [category]: true }));
      showMessage('info', 'Selecting sound file...');

      const fileResult = await selectSoundFile();
      console.log('[SoundsSettingsTab] File selection result:', fileResult);
      
      if (!fileResult.success) {
        throw new Error(fileResult.error || 'File selection failed');
      }
      
      const { file } = fileResult;
      console.log('[SoundsSettingsTab] Selected file:', file);
      
      // Generate name from filename
      const name = file.name.replace(/\.[^/.]+$/, '');
      console.log('[SoundsSettingsTab] Generated name:', name);
      
      showMessage('info', 'Uploading sound...');
      console.log('[SoundsSettingsTab] Adding sound to library...');
      
      const addResult = await addSound(category, file, name);
      console.log('[SoundsSettingsTab] Add sound result:', addResult);
      
      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add sound');
      }
      
      showMessage('success', 'Sound uploaded successfully!');
      console.log('[SoundsSettingsTab] Sound uploaded successfully');
      
      // Reload the sound library to get the updated state
      console.log('[SoundsSettingsTab] Reloading sound library...');
      await loadSoundLibrary();
      console.log('[SoundsSettingsTab] Sound library reloaded');
      
    } catch (err) {
      console.error('[SoundsSettingsTab] Upload error:', err);
      showMessage('error', err.message || 'Failed to upload sound');
    } finally {
      setUploading(prev => ({ ...prev, [category]: false }));
    }
  }, [selectSoundFile, addSound, loadSoundLibrary, showMessage]);

  // Handle sound deletion
  const handleDeleteSound = useCallback(async (category, soundId) => {
    try {
      await removeSound(category, soundId);
      showMessage('success', 'Sound deleted successfully');
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete sound');
    }
  }, [removeSound, showMessage]);

  // Handle sound testing
  const handleTestSound = useCallback((category, sound) => {
    // Stop all other audio
    Object.values(audioRefsRef.current).forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setAudioRefs({});
    setTesting({});

    // Play new audio
    const audio = new Audio(sound.url);
    audio.volume = sound.volume ?? 0.5;
    audio.play();
    setAudioRefs({ [sound.id]: audio });
    setTesting({ [sound.id]: true });
    
    audio.onended = () => {
      setTesting({});
      setAudioRefs({});
    };
  }, []);

  const handleStopTest = useCallback((soundId) => {
    const audio = audioRefsRef.current[soundId];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setTesting({});
      setAudioRefs({});
    }
  }, []);

  // Handle sound toggle (enable/disable)
  const handleToggleSound = useCallback(async (category, soundId) => {
    try {
      const sounds = getSoundsByCategory(category);
      const sound = sounds.find(s => s.id === soundId);
      
      if (!sound) return;

      // For non-playlist categories, disable all others first
      if (category !== 'backgroundMusic' || !soundSettings.backgroundMusicPlaylistMode) {
        for (const s of sounds) {
          if (s.id !== soundId && s.enabled) {
            await updateSound(category, s.id, { enabled: false });
          }
        }
      }

      // Toggle the selected sound
      await updateSound(category, soundId, { enabled: !sound.enabled });
      
      // Update sound manager settings
      if (category === 'channelClick') {
        const enabledSound = getEnabledSoundsByCategory(category)[0];
        updateChannelClickSound(!!enabledSound, enabledSound?.volume ?? 0.5);
      } else if (category === 'channelHover') {
        const enabledSound = getEnabledSoundsByCategory(category)[0];
        updateChannelHoverSound(!!enabledSound, enabledSound?.volume ?? 0.5);
      } else if (category === 'backgroundMusic') {
        // Update background music when background music settings change
        updateBackgroundMusic();
      }

      showMessage('success', `Sound ${sound.enabled ? 'disabled' : 'enabled'} successfully`);
    } catch (err) {
      showMessage('error', err.message || 'Failed to toggle sound');
    }
  }, [getSoundsByCategory, getEnabledSoundsByCategory, soundSettings.backgroundMusicPlaylistMode, updateSound, updateChannelClickSound, updateChannelHoverSound, updateBackgroundMusic, showMessage]);

  // Handle volume change
  const handleVolumeChange = useCallback(async (category, soundId, volume) => {
    try {
      await updateSound(category, soundId, { volume });
      
      // Update sound manager settings
      if (category === 'channelClick') {
        const enabledSound = getEnabledSoundsByCategory(category)[0];
        updateChannelClickSound(!!enabledSound, enabledSound?.volume ?? volume);
      } else if (category === 'channelHover') {
        const enabledSound = getEnabledSoundsByCategory(category)[0];
        updateChannelHoverSound(!!enabledSound, enabledSound?.volume ?? volume);
      } else if (category === 'backgroundMusic') {
        // Update background music when background music volume changes
        updateBackgroundMusic();
      }

      // Update test audio volume if playing
      const playing = audioRefsRef.current[soundId];
      if (playing) {
        playing.volume = volume;
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to update volume');
    }
  }, [updateSound, getEnabledSoundsByCategory, updateChannelClickSound, updateChannelHoverSound, updateBackgroundMusic, showMessage]);

  // Handle like toggle
  const handleToggleLike = useCallback(async (soundId) => {
    try {
      await toggleLike(soundId);
      showMessage('success', 'Like status updated');
    } catch (err) {
      showMessage('error', err.message || 'Failed to update like status');
    }
  }, [toggleLike, showMessage]);



  // Setting changes — merge into store and persist sounds slice (same path as useSoundManager toggles).
  const handleSettingChange = useCallback(
    async (key, value) => {
      const prev = useConsolidatedAppStore.getState().sounds;
      const next = { ...prev, [key]: value };
      setSoundsState({ [key]: value });
      try {
        await saveSoundSettings(next);
      } catch {
        /* unified persistence also debounces; ignore duplicate errors */
      }
    },
    [setSoundsState, saveSoundSettings],
  );



  // Drag and drop handlers for playlist reordering
  const handleDragStart = useCallback((e, soundId) => {
    if (!(soundPrefs?.backgroundMusicPlaylistMode ?? false)) return;
    setDraggedItem(soundId);
    e.dataTransfer.effectAllowed = 'move';
  }, [soundPrefs?.backgroundMusicPlaylistMode]);

  const handleDragOver = useCallback((e, soundId) => {
    if (!(soundPrefs?.backgroundMusicPlaylistMode ?? false) || !draggedItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(soundId);
  }, [soundPrefs?.backgroundMusicPlaylistMode, draggedItem]);

  const handleDrop = useCallback((e, targetSoundId) => {
    if (!(soundPrefs?.backgroundMusicPlaylistMode ?? false) || !draggedItem || draggedItem === targetSoundId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }
    
    e.preventDefault();
    
    // Reorder the background music array
    const currentSounds = [...getSoundsByCategory('backgroundMusic')];
    const draggedIndex = currentSounds.findIndex(s => s.id === draggedItem);
    const targetIndex = currentSounds.findIndex(s => s.id === targetSoundId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedSound] = currentSounds.splice(draggedIndex, 1);
      currentSounds.splice(targetIndex, 0, draggedSound);
      
      // Update the order in the backend
      currentSounds.forEach((sound, index) => {
        updateSound('backgroundMusic', sound.id, { order: index });
      });
      
      showMessage('success', 'Playlist order updated!');
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  }, [soundPrefs?.backgroundMusicPlaylistMode, draggedItem, getSoundsByCategory, updateSound, showMessage]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
  }, []);

  // Test channel click sound
  const handleTestChannelClick = useCallback(async () => {
    try {
      await playChannelClickSound();
      showMessage('success', 'Channel click sound played');
    } catch (_err) {
      showMessage('error', 'No channel click sound enabled');
    }
  }, [playChannelClickSound, showMessage]);

  // Test channel hover sound
  const handleTestChannelHover = useCallback(async () => {
    try {
      await playChannelHoverSound();
      showMessage('success', 'Channel hover sound played');
    } catch (_err) {
      showMessage('error', 'No channel hover sound enabled');
    }
  }, [playChannelHoverSound, showMessage]);

  // Render sound section body (shell is WeeSettingsCollapsibleSection + WeeModalFieldCard)
  const renderSoundSection = (category) => {
    const categorySounds = getSoundsByCategory(category.key);
    const enabledSounds = getEnabledSoundsByCategory(category.key);
    const likedSounds = getLikedSoundsByCategory(category.key);

    return (
      <div className="sound-card-pad">
        {(category.key === 'backgroundMusic' || category.key === 'channelHover') && (
          <div className="sound-resource-strip">
            {category.key === 'backgroundMusic' && (
              <ResourceUsageIndicator
                level="high"
                tooltip="Background music plays continuously and can use significant CPU and memory resources"
              />
            )}
            {category.key === 'channelHover' && (
              <ResourceUsageIndicator
                level="medium"
                tooltip="Hover sounds play frequently and can impact performance with many channels"
              />
            )}
            <Text variant="caption" className="!m-0 max-w-md text-[hsl(var(--text-tertiary))]">
              {category.key === 'backgroundMusic'
                ? 'Continuous playback uses more resources — pause from the ribbon when you need silence.'
                : 'Hover SFX fire often; keep volumes low or disable on slower machines.'}
            </Text>
          </div>
        )}
          {/* Category-specific settings */}
          {category.key === 'backgroundMusic' && (
          <div className="sound-mb-20">
              <div className="sound-panel-wee">
                <div className="sound-panel-wee__head">
                  <p className="sound-panel-wee__title">Playback</p>
                </div>

                <div className="sound-toggle-stack">
                  <div className="sound-toggle-row">
                    <span className="sound-toggle-row__label">Enable background music</span>
                    <WToggle
                      checked={soundPrefs?.backgroundMusicEnabled ?? true}
                      onChange={(checked) => handleSettingChange('backgroundMusicEnabled', checked)}
                      disableLabelClick
                    />
                  </div>

                  {(soundPrefs?.backgroundMusicEnabled ?? true) && (
                    <>
                      <div className="sound-toggle-row">
                        <span className="sound-toggle-row__label">Loop current track</span>
                        <WToggle
                          checked={soundPrefs?.backgroundMusicLooping ?? true}
                          onChange={(checked) => handleSettingChange('backgroundMusicLooping', checked)}
                          disableLabelClick
                        />
                      </div>

                      <div className="sound-toggle-row">
                        <div>
                          <span className="sound-toggle-row__label">Playlist mode</span>
                          <p className="sound-toggle-row__hint">
                            Liked tracks only, in order — use hearts and drag below when this is on.
                          </p>
                        </div>
                        <WToggle
                          checked={soundPrefs?.backgroundMusicPlaylistMode ?? false}
                          onChange={(checked) => handleSettingChange('backgroundMusicPlaylistMode', checked)}
                          disableLabelClick
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Playlist Mode Info */}
              {(soundPrefs?.backgroundMusicEnabled ?? true) && (soundPrefs?.backgroundMusicPlaylistMode ?? false) && (
                <div className="sound-callout sound-callout--playlist">
                  <div className="sound-callout-head">
                    <span className="sound-emoji-lg">🎵</span>
                    <div className="sound-callout--playlist-title">
                      Playlist Mode Active ({likedSounds.length} liked sounds)
                    </div>
                  </div>
                  <div className="sound-callout--playlist-body">
                    Only liked sounds will play in the order they appear below. 
                    Click the ❤️ to like/unlike sounds and drag items to reorder your playlist.
                  </div>
                </div>
              )}

          {/* Background Music Disabled Warning */}
              {!(soundPrefs?.backgroundMusicEnabled ?? true) && (
            <div className="sound-callout sound-callout--warn-music">
              <div className="sound-callout-head">
                <span className="sound-emoji-lg">🔇</span>
                <div className="sound-callout--warn-music-title">
                  Background Music Disabled
                </div>
              </div>
              <div className="sound-callout--warn-music-body">
                Background music is currently disabled. Enable it above to hear background music sounds.
              </div>
            </div>
          )}
              </div>
          )}

          {/* Channel Click Settings */}
          {category.key === 'channelClick' && (
            <div className="sound-mb-20">
              <div className="sound-panel-wee">
                <div className="sound-panel-wee__head">
                  <p className="sound-panel-wee__title">Channel click</p>
                </div>
                <div className="sound-toggle-row">
                  <span className="sound-toggle-row__label">Enable click sounds</span>
                  <WToggle
                    checked={soundPrefs?.channelClickEnabled ?? true}
                    onChange={(checked) => handleSettingChange('channelClickEnabled', checked)}
                    disableLabelClick
                  />
                </div>
              </div>
            </div>
          )}

          {/* Channel Hover Settings */}
          {category.key === 'channelHover' && (
            <div className="sound-mb-20">
              <div className="sound-panel-wee">
                <div className="sound-panel-wee__head">
                  <p className="sound-panel-wee__title">Channel hover</p>
                </div>
                <div className="sound-toggle-row">
                  <span className="sound-toggle-row__label">Enable hover sounds</span>
                  <WToggle
                    checked={soundPrefs?.channelHoverEnabled ?? true}
                    onChange={(checked) => handleSettingChange('channelHoverEnabled', checked)}
                    disableLabelClick
                  />
                </div>
              </div>
            </div>
          )}

          {/* Other category test buttons */}
          {category.key === 'channelClick' && (
            <div className="sound-mb-16">
              <Button
                variant="secondary"
                size="sm"
                className="sound-test-pill-wee"
                onClick={handleTestChannelClick}
                disabled={!(soundPrefs?.channelClickEnabled ?? true) || enabledSounds.length === 0}
                title={
                  !(soundPrefs?.channelClickEnabled ?? true)
                    ? 'Turn on click sounds above to test.'
                    : enabledSounds.length === 0
                      ? 'Add or enable a sound below to test.'
                      : undefined
                }
              >
                Test click sound
              </Button>
            </div>
          )}

          {category.key === 'channelHover' && (
            <div className="sound-mb-16">
              <Button
                variant="secondary"
                size="sm"
                className="sound-test-pill-wee"
                onClick={handleTestChannelHover}
                disabled={!(soundPrefs?.channelHoverEnabled ?? true) || enabledSounds.length === 0}
                title={
                  !(soundPrefs?.channelHoverEnabled ?? true)
                    ? 'Turn on hover sounds above to test.'
                    : enabledSounds.length === 0
                      ? 'Add or enable a sound below to test.'
                      : undefined
                }
              >
                Test hover sound
              </Button>
            </div>
          )}

          {/* Sound List */}
          <div className="sound-mb-16">
            {categorySounds.length === 0 && (
              <Text variant="help" className="sound-help-italic">No sounds yet. Add your first sound below.</Text>
            )}
            
            {categorySounds.map((sound) => (
              <div
                key={sound.id}
                className={[
                  'sound-item-gooey',
                  sound.enabled ? '' : 'sound-item-gooey--disabled',
                  draggedItem === sound.id ? 'sound-item-gooey--dragging' : '',
                  category.key === 'backgroundMusic' && !(soundPrefs?.backgroundMusicEnabled ?? true)
                    ? 'sound-item-gooey--faded'
                    : '',
                  category.key === 'backgroundMusic' && (soundPrefs?.backgroundMusicPlaylistMode ?? false)
                    ? 'sound-item-gooey--draggable'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                draggable={category.key === 'backgroundMusic' && (soundPrefs?.backgroundMusicPlaylistMode ?? false)}
                onDragStart={(e) => handleDragStart(e, sound.id)}
                onDragOver={(e) => handleDragOver(e, sound.id)}
                onDrop={(e) => handleDrop(e, sound.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="sound-item-gooey__top">
                  <div className="sound-item-gooey__left">
                    {category.key === 'backgroundMusic' && (soundPrefs?.backgroundMusicPlaylistMode ?? false) && (
                      <span className="sound-item-gooey__drag" title="Drag to reorder" aria-hidden>
                        <GripVertical size={18} strokeWidth={2.25} className="text-[hsl(var(--text-tertiary))]" />
                      </span>
                    )}
                    <div className="sound-item-gooey__name-block">
                      <span className="sound-item-gooey__name">{sound.name}</span>
                      <div className="sound-item-gooey__badges">
                        {sound.isDefault ? <span className="sound-badge-wee">Default</span> : null}
                      </div>
                    </div>
                  </div>
                  <WToggle
                    checked={!!sound.enabled}
                    onChange={() => handleToggleSound(category.key, sound.id)}
                    disabled={category.key === 'backgroundMusic' && !(soundPrefs?.backgroundMusicEnabled ?? true)}
                    disabledHint={
                      category.key === 'backgroundMusic' && !(soundPrefs?.backgroundMusicEnabled ?? true)
                        ? 'Turn on background music above to enable or switch tracks.'
                        : undefined
                    }
                    disableLabelClick
                  />
                </div>

                <div
                  className="sound-item-gooey__volume-well"
                  title={
                    category.key === 'backgroundMusic' && !(soundPrefs?.backgroundMusicEnabled ?? true)
                      ? 'Enable background music above to edit volume.'
                      : undefined
                  }
                >
                  <span className="sound-item-gooey__vol-label">Volume</span>
                  <span className="sound-item-gooey__vol-pill">{Math.round((sound.volume ?? 0.5) * 100)}%</span>
                  <div className="sound-item-gooey__slider-wrap">
                    <Slider
                      value={sound.volume ?? 0.5}
                      onChange={(value) => handleVolumeChange(category.key, sound.id, value)}
                      min={0}
                      max={1}
                      step={0.01}
                      disabled={category.key === 'backgroundMusic' && !(soundPrefs?.backgroundMusicEnabled ?? true)}
                      hideValue
                      containerClassName="!mb-0"
                    />
                  </div>
                </div>

                <div className="sound-item-gooey__toolbar">
                  {testing[sound.id] ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="sound-chip-btn"
                      onClick={() => handleStopTest(sound.id)}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="sound-chip-btn"
                      onClick={() => handleTestSound(category.key, sound)}
                      disabled={category.key === 'backgroundMusic' && !(soundPrefs?.backgroundMusicEnabled ?? true)}
                      title={
                        category.key === 'backgroundMusic' && !(soundPrefs?.backgroundMusicEnabled ?? true)
                          ? 'Enable background music above to preview.'
                          : undefined
                      }
                    >
                      Preview
                    </Button>
                  )}

                  {category.key === 'backgroundMusic' ? (
                    <button
                      type="button"
                      className={`sound-icon-btn inline-flex items-center justify-center border-2 border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-primary))] transition-colors hover:bg-[hsl(var(--state-hover))] disabled:opacity-45 ${sound.liked ? 'sound-like-btn--on' : ''}`}
                      onClick={() => handleToggleLike(sound.id)}
                      aria-label={sound.liked ? 'Unlike for playlist' : 'Like for playlist'}
                      disabled={!(soundPrefs?.backgroundMusicEnabled ?? true)}
                      title={
                        !(soundPrefs?.backgroundMusicEnabled ?? true)
                          ? 'Enable background music above to like tracks for the playlist.'
                          : undefined
                      }
                    >
                      <Heart
                        size={18}
                        strokeWidth={2.25}
                        className={sound.liked ? 'fill-current' : ''}
                        aria-hidden
                      />
                    </button>
                  ) : null}

                  {!sound.isDefault ? (
                    <Button
                      variant="danger-secondary"
                      size="sm"
                      className="sound-icon-btn !border-[hsl(var(--state-error)/0.45)] !text-[hsl(var(--state-error))]"
                      onClick={() => handleDeleteSound(category.key, sound.id)}
                      aria-label="Remove sound"
                    >
                      <Trash2 size={16} strokeWidth={2.25} aria-hidden />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          
          <div className="sound-row-actions sound-row-actions--wee">
            <Button
              variant="primary"
              size="sm"
              className="sound-add-gooey"
              onClick={() => handleUploadClick(category.key)}
              disabled={uploading[category.key]}
            >
              {uploading[category.key] ? 'Uploading…' : 'Add sound'}
            </Button>
          </div>
        </div>
    );
  };

  const messageToneClass =
    message.type === 'error'
      ? 'sound-msg--error'
      : message.type === 'success'
        ? 'sound-msg--success'
        : message.type === 'info'
          ? 'sound-msg--info'
          : 'sound-msg--hint';

  return (
    <div className="sound-mgmt mx-auto flex max-w-4xl flex-col space-y-6 pb-12">
      <SettingsTabPageHeader title="Sounds" subtitle="Audio feedback & music" />

      {error ? (
        <WeeModalFieldCard
          hoverAccent="none"
          paddingClassName="p-4"
          className="flex flex-col gap-3 border border-[hsl(var(--state-error)/0.45)] bg-[hsl(var(--state-error-light)/0.45)] sm:flex-row sm:items-center sm:justify-between"
        >
          <Text variant="body" className="!m-0 text-[hsl(var(--state-error))]">
            {error}
          </Text>
          <Button variant="tertiary" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </WeeModalFieldCard>
      ) : null}

      {message.text ? (
        <div className={`sound-msg ${messageToneClass}`}>
          <div className="sound-msg-row">
            <span className="sound-emoji-md">
              {message.type === 'error'
                ? '⚠️'
                : message.type === 'success'
                  ? '✅'
                  : message.type === 'info'
                    ? 'ℹ️'
                    : '💡'}
            </span>
            {message.text}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="sound-loading">
          <div className="sound-loading-spinner" aria-hidden />
          <span className="sound-loading-label">Loading sound library...</span>
        </div>
      ) : null}

      {SOUND_CATEGORIES.map((category) => {
        const CategoryIcon = SOUND_CATEGORY_ICONS[category.key] || Volume2;
        return (
          <WeeSettingsCollapsibleSection
            key={category.key}
            icon={CategoryIcon}
            title={category.label}
            description={SOUND_CATEGORY_DESCRIPTIONS[category.key] || 'Sound library for this slot.'}
            defaultOpen
          >
            <WeeModalFieldCard hoverAccent="none" paddingClassName="p-0" className="overflow-hidden">
              {renderSoundSection(category)}
            </WeeModalFieldCard>
          </WeeSettingsCollapsibleSection>
        );
      })}

      {IS_DEV ? (
        <WeeSettingsCollapsibleSection
          icon={Volume2}
          title="Debug"
          description="Sound manager snapshot (dev only)."
          defaultOpen={false}
        >
          <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6" className="sound-settings-card--tight">
            <Text variant="p" className="sound-debug-pre">
              {JSON.stringify(soundSettings, null, 2)}
            </Text>
          </WeeModalFieldCard>
        </WeeSettingsCollapsibleSection>
      ) : null}
    </div>
  );
});

SoundsSettingsTab.displayName = 'SoundsSettingsTab';

export default SoundsSettingsTab; 