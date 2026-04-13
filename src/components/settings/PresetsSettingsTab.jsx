import React, { useState, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import AuthModal from '../AuthModal';
import { getCommunityPresetUpdates, uploadPreset } from '../../utils/supabase';
import {
  capturePresetThumbnailDataUrl,
  parseTags,
  resolveCustomImageFileForShare,
  resolveWallpaperFileForShare,
} from '../../utils/presetSharing';
import {
  loadUnifiedSettingsSnapshot,
  saveUnifiedAppearancePatch,
  saveUnifiedSettingsSnapshot,
} from '../../utils/electronApi';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { buildPresetDataFromStore } from '../../utils/presets/buildPresetSnapshot';
import { applyPresetData } from '../../utils/presets/applyPresetData';
import { createDefaultSpotifyMatchPreset, SPOTIFY_MATCH_PRESET_NAME } from '../../utils/presets/spotifyMatchPreset';
import { importCommunityPresetFlow } from '../../utils/presets/importCommunityPresetFlow';
import '../surfaceStyles.css';

import PresetsSaveCurrentCard from './presets/PresetsSaveCurrentCard';
import PresetsSpotifyMatchSection from './presets/PresetsSpotifyMatchSection';
import PresetsSavedListCard from './presets/PresetsSavedListCard';
import PresetsCommunityCard from './presets/PresetsCommunityCard';

const MAX_CUSTOM_PRESETS = 5;

const PresetsSettingsTab = React.memo(() => {
  const { presets, spotifyMatchEnabled } = useConsolidatedAppStore(
    useShallow((state) => ({
      presets: state.presets,
      spotifyMatchEnabled: state.ui.spotifyMatchEnabled,
    }))
  );
  const { setPresets, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setPresets: state.actions.setPresets,
      setUIState: state.actions.setUIState,
    }))
  );

  const [newPresetName, setNewPresetName] = useState('');
  const [error, setError] = useState('');
  const [draggingPreset, setDraggingPreset] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [editingPreset, setEditingPreset] = useState(null);
  const [editName, setEditName] = useState('');
  const [justUpdated, setJustUpdated] = useState(null);
  const [showCommunitySection, setShowCommunitySection] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  const [communityUpdateMap, setCommunityUpdateMap] = useState({});
  const [captureNotice, setCaptureNotice] = useState({ type: '', text: '' });
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    creator_name: '',
    tags: '',
    custom_image: null,
    selectedPreset: null,
  });
  const [includeChannels, setIncludeChannels] = useState(false);
  const [includeSounds, setIncludeSounds] = useState(false);
  const [immersiveModeState, setImmersiveModeState] = useState({});

  const savePresetsToBackend = useCallback(async (updatedPresets) => {
    try {
      await saveUnifiedSettingsSnapshot({ presets: updatedPresets });
    } catch (e) {
      console.error('[PresetsSettingsTab] Failed to save presets:', e);
    }
  }, []);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const unifiedSettings = await loadUnifiedSettingsSnapshot();
        let currentPresets = Array.isArray(unifiedSettings?.presets) ? unifiedSettings.presets : [];

        const spotifyMatchExists = currentPresets.some((p) => p.name === SPOTIFY_MATCH_PRESET_NAME);
        if (!spotifyMatchExists) {
          currentPresets = [...currentPresets, createDefaultSpotifyMatchPreset()];
          await savePresetsToBackend(currentPresets);
        }

        setPresets(currentPresets);

        const sm = currentPresets.find((p) => p.name === SPOTIFY_MATCH_PRESET_NAME);
        if (sm?.data?.ui && typeof sm.data.ui.spotifyMatchEnabled === 'boolean') {
          setUIState({ spotifyMatchEnabled: sm.data.ui.spotifyMatchEnabled });
        }
      } catch (e) {
        console.error('[PresetsSettingsTab] Load presets failed:', e);
      }
    };
    loadPresets();
  }, [setPresets, setUIState, savePresetsToBackend]);

  useEffect(() => {
    const loadCommunityUpdates = async () => {
      const communityPresets = presets
        .filter((preset) => preset.name !== SPOTIFY_MATCH_PRESET_NAME && (preset.communityId || preset.communityRootId))
        .map((preset) => ({
          localKey: preset.name,
          rootPresetId: preset.communityRootId || preset.communityId,
          installedVersion: Number(preset.communityVersion) || 1,
        }));

      if (communityPresets.length === 0) {
        setCommunityUpdateMap({});
        return;
      }

      const result = await getCommunityPresetUpdates(communityPresets);
      if (result.success) {
        setCommunityUpdateMap(result.data || {});
      }
    };
    loadCommunityUpdates();
  }, [presets]);

  useEffect(() => {
    const unsubscribe = useConsolidatedAppStore.subscribe((state) => {
      setImmersiveModeState(state.spotify.immersiveMode || {});
    });
    setImmersiveModeState(useConsolidatedAppStore.getState().spotify.immersiveMode || {});
    return unsubscribe;
  }, []);

  const customPresetCount = presets.filter((p) => p.name !== SPOTIFY_MATCH_PRESET_NAME).length;

  const handleDragStart = (e, presetName) => {
    setDraggingPreset(presetName);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, presetName) => {
    if (!draggingPreset) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(presetName);
  };

  const handleDragEnter = (e, presetName) => {
    if (!draggingPreset) return;
    e.preventDefault();
    setDropTarget(presetName);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDropTarget(null);
  };

  const handleDrop = (e, targetPresetName) => {
    if (!draggingPreset || draggingPreset === targetPresetName) {
      setDraggingPreset(null);
      setDropTarget(null);
      return;
    }
    e.preventDefault();
    const currentPresets = [...presets];
    const draggedIndex = currentPresets.findIndex((p) => p.name === draggingPreset);
    const targetIndex = currentPresets.findIndex((p) => p.name === targetPresetName);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedPreset] = currentPresets.splice(draggedIndex, 1);
      currentPresets.splice(targetIndex, 0, draggedPreset);
      setPresets(currentPresets);
      savePresetsToBackend(currentPresets);
    }
    setDraggingPreset(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggingPreset(null);
    setDropTarget(null);
  };

  const handleSave = async () => {
    if (!newPresetName.trim()) {
      setError('Please enter a name for the preset.');
      return;
    }
    if (presets.some((p) => p.name === newPresetName.trim())) {
      setError('A preset with this name already exists.');
      return;
    }
    if (customPresetCount >= MAX_CUSTOM_PRESETS) return;

    const presetData = buildPresetDataFromStore({ includeChannels, includeSounds });
    const thumbnailDataUrl = await capturePresetThumbnailDataUrl();
    if (thumbnailDataUrl) {
      setCaptureNotice({ type: 'success', text: 'Captured preset preview ✨' });
    } else {
      setCaptureNotice({ type: 'warning', text: 'Could not capture preview, using default thumbnail.' });
    }

    const newPreset = {
      name: newPresetName.trim(),
      data: presetData,
      timestamp: new Date().toISOString(),
      thumbnailDataUrl: thumbnailDataUrl || null,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setNewPresetName('');
    setError('');
    setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2200);
  };

  const handleUpdate = async (name) => {
    const presetData = buildPresetDataFromStore({ includeChannels, includeSounds });
    const thumbnailDataUrl = await capturePresetThumbnailDataUrl();
    if (thumbnailDataUrl) {
      setCaptureNotice({ type: 'success', text: 'Updated preset preview ✨' });
    } else {
      setCaptureNotice({ type: 'warning', text: 'Could not refresh preview, keeping previous thumbnail.' });
    }

    const updatedPresets = presets.map((p) =>
      p.name === name
        ? {
            ...p,
            data: presetData,
            timestamp: new Date().toISOString(),
            thumbnailDataUrl: thumbnailDataUrl || p.thumbnailDataUrl || null,
          }
        : p
    );
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setJustUpdated(name);
    setTimeout(() => setJustUpdated(null), 1500);
    setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2200);
  };

  const handleStartEdit = (preset) => {
    setEditingPreset(preset.name);
    setEditName(preset.name);
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
    setEditName('');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    if (presets.some((p) => p.name === editName.trim() && p.name !== editingPreset)) return;

    const updatedPresets = presets.map((p) => (p.name === editingPreset ? { ...p, name: editName.trim() } : p));
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setEditingPreset(null);
    setEditName('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSaveEdit();
    else if (e.key === 'Escape') handleCancelEdit();
  };

  const handleDeletePreset = async (name) => {
    const updatedPresets = presets.filter((p) => p.name !== name);
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
  };

  const handleApplyPreset = async (preset) => {
    await applyPresetData(preset);
  };

  const handleSpotifyMatchToggle = async (enabled) => {
    setUIState({ spotifyMatchEnabled: enabled });
    await saveUnifiedAppearancePatch({ spotifyMatchEnabled: enabled });

    const updatedPresets = presets.map((preset) => {
      if (preset.name === SPOTIFY_MATCH_PRESET_NAME) {
        return {
          ...preset,
          data: {
            ...preset.data,
            ui: {
              ...preset.data?.ui,
              spotifyMatchEnabled: enabled,
            },
          },
          timestamp: new Date().toISOString(),
        };
      }
      return preset;
    });

    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);

    if (enabled) {
      const sm = updatedPresets.find((p) => p.name === SPOTIFY_MATCH_PRESET_NAME);
      if (sm) await applyPresetData(sm);
    }
  };

  const handleSaveSpotifyLookAsPreset = async () => {
    if (customPresetCount >= MAX_CUSTOM_PRESETS) {
      alert(`You can save up to ${MAX_CUSTOM_PRESETS} custom presets.`);
      return;
    }
    const suggested = `Spotify look ${new Date().toLocaleString()}`;
    const name = window.prompt('Name this preset (saves frozen colors + layout)', suggested);
    if (!name?.trim()) return;

    const extracted = useConsolidatedAppStore.getState().spotify?.extractedColors;
    if (!extracted) {
      alert('No album colors yet. Start playback or enable Spotify Match until colors appear.');
      return;
    }

    const presetData = buildPresetDataFromStore({
      includeChannels: false,
      includeSounds: false,
      includeSpotifyPalette: true,
    });

    const thumbnailDataUrl = await capturePresetThumbnailDataUrl();
    const newPreset = {
      name: name.trim(),
      data: presetData,
      timestamp: new Date().toISOString(),
      thumbnailDataUrl: thumbnailDataUrl || null,
      frozenSpotifyLook: true,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setCaptureNotice({ type: 'success', text: `Saved preset "${name.trim()}" with frozen colors.` });
    setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2500);
  };

  const handleImmersiveModeToggle = (enabled) => {
    const { setSpotifyState } = useConsolidatedAppStore.getState().actions;
    const currentImmersiveMode = useConsolidatedAppStore.getState().spotify.immersiveMode || {};
    setSpotifyState({
      immersiveMode: {
        ...currentImmersiveMode,
        enabled,
      },
    });
  };

  const handleAmbientLightingToggle = (enabled) => {
    const { setSpotifyState } = useConsolidatedAppStore.getState().actions;
    const currentImmersiveMode = useConsolidatedAppStore.getState().spotify.immersiveMode || {};
    setSpotifyState({
      immersiveMode: { ...currentImmersiveMode, ambientLighting: enabled },
    });
  };

  const handlePulseEffectsToggle = (enabled) => {
    const { setSpotifyState } = useConsolidatedAppStore.getState().actions;
    const currentImmersiveMode = useConsolidatedAppStore.getState().spotify.immersiveMode || {};
    setSpotifyState({
      immersiveMode: { ...currentImmersiveMode, pulseEffects: enabled },
    });
  };

  const handleLiveGradientWallpaperToggle = (enabled) => {
    const { setSpotifyState } = useConsolidatedAppStore.getState().actions;
    const currentImmersiveMode = useConsolidatedAppStore.getState().spotify.immersiveMode || {};
    setSpotifyState({
      immersiveMode: { ...currentImmersiveMode, liveGradientWallpaper: enabled },
    });
  };

  const handleImmersiveModeSettingChange = (setting, value) => {
    const { setSpotifyState } = useConsolidatedAppStore.getState().actions;
    const currentImmersiveMode = useConsolidatedAppStore.getState().spotify.immersiveMode || {};
    setSpotifyState({
      immersiveMode: { ...currentImmersiveMode, [setting]: value },
    });
  };

  const handleImportCommunityPreset = async (presetData) => {
    await importCommunityPresetFlow(presetData, {
      getPresets: () => useConsolidatedAppStore.getState().presets,
      setPresets,
      savePresetsToBackend,
    });
  };

  const handleUpload = async () => {
    if (!uploadFormData.selectedPreset) {
      setUploadMessage({ type: 'error', text: 'Please select a preset to share' });
      return;
    }

    try {
      setUploading(true);
      setUploadMessage({ type: '', text: '' });

      const warnings = [];
      const { file: wallpaperFile, warning: wallpaperWarning } = await resolveWallpaperFileForShare(uploadFormData.selectedPreset);
      if (wallpaperWarning) warnings.push(wallpaperWarning);
      const autoThumbnailDataUrl = uploadFormData.selectedPreset.thumbnailDataUrl || null;
      const { file: customImageFile, warning: customImageWarning } = resolveCustomImageFileForShare(
        uploadFormData.custom_image,
        autoThumbnailDataUrl
      );
      if (customImageWarning) warnings.push(customImageWarning);

      const presetData = {
        settings: uploadFormData.selectedPreset.data,
        wallpaper: wallpaperFile,
        customImage: customImageFile,
      };

      const formData = {
        name: uploadFormData.name || uploadFormData.selectedPreset.name,
        description: uploadFormData.description,
        tags: parseTags(uploadFormData.tags),
        creator_name: uploadFormData.creator_name || 'Anonymous',
      };
      const sourceRootId =
        uploadFormData.selectedPreset.communityRootId || uploadFormData.selectedPreset.communityId || null;
      if (sourceRootId) {
        formData.parent_preset_id = sourceRootId;
      }

      const result = await uploadPreset(presetData, formData);

      if (result) {
        if (uploadFormData.selectedPreset?.name) {
          const updatedPresets = presets.map((preset) =>
            preset.name === uploadFormData.selectedPreset.name
              ? {
                  ...preset,
                  isCommunity: true,
                  communityId: result.id,
                  communityRootId: result.parent_preset_id || result.id,
                  communityVersion: result.version || 1,
                }
              : preset
          );
          setPresets(updatedPresets);
          await savePresetsToBackend(updatedPresets);
        }
        const allWarnings = [...warnings, ...(result.warnings || [])];
        if (allWarnings.length > 0) {
          setUploadMessage({ type: 'success', text: `Preset uploaded with notes: ${allWarnings.join(' ')}` });
        } else {
          setUploadMessage({ type: 'success', text: 'Preset uploaded successfully!' });
        }
        setTimeout(() => {
          setShowUploadForm(false);
          setUploadFormData({
            name: '',
            description: '',
            creator_name: '',
            tags: '',
            custom_image: null,
            selectedPreset: null,
          });
          setUploadMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setUploadMessage({ type: 'error', text: 'Failed to upload preset' });
      }
    } catch (err) {
      console.error('[PresetsSettingsTab] Upload error:', err);
      setUploadMessage({ type: 'error', text: `Upload failed: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  const onUploadField = (field, value) => {
    if (field === 'presetName') {
      const selected = presets.find((p) => p.name === value);
      setUploadFormData((prev) => ({
        ...prev,
        name: selected?.name || '',
        selectedPreset: selected || null,
      }));
      if (uploadMessage.text) setUploadMessage({ type: '', text: '' });
      return;
    }
    if (field === 'file' && value) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadFormData((prev) => ({ ...prev, custom_image: reader.result }));
      };
      reader.readAsDataURL(value);
      return;
    }
    setUploadFormData((prev) => ({ ...prev, [field]: value }));
    if (uploadMessage.text) setUploadMessage({ type: '', text: '' });
  };

  return (
    <div className="surface-stack">
      <PresetsSaveCurrentCard
        newPresetName={newPresetName}
        onNewPresetNameChange={(v) => {
          setNewPresetName(v);
          setError('');
        }}
        onSave={handleSave}
        error={error}
        captureNotice={captureNotice}
        includeChannels={includeChannels}
        onIncludeChannelsChange={setIncludeChannels}
        includeSounds={includeSounds}
        onIncludeSoundsChange={setIncludeSounds}
        customPresetCount={customPresetCount}
        maxCustomPresets={MAX_CUSTOM_PRESETS}
      />

      <PresetsSpotifyMatchSection
        show={presets.some((p) => p.name === SPOTIFY_MATCH_PRESET_NAME)}
        spotifyMatchEnabled={spotifyMatchEnabled}
        onSpotifyMatchToggle={handleSpotifyMatchToggle}
        immersiveModeState={immersiveModeState}
        onImmersiveModeToggle={handleImmersiveModeToggle}
        onLiveGradientWallpaperToggle={handleLiveGradientWallpaperToggle}
        onAmbientLightingToggle={handleAmbientLightingToggle}
        onPulseEffectsToggle={handlePulseEffectsToggle}
        onImmersiveModeSettingChange={handleImmersiveModeSettingChange}
        onSaveLookAsPreset={handleSaveSpotifyLookAsPreset}
      />

      <PresetsSavedListCard
        presets={presets}
        excludeName={SPOTIFY_MATCH_PRESET_NAME}
        draggingPreset={draggingPreset}
        dropTarget={dropTarget}
        editingPreset={editingPreset}
        editName={editName}
        justUpdated={justUpdated}
        communityUpdateMap={communityUpdateMap}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onApply={handleApplyPreset}
        onUpdate={handleUpdate}
        onStartEdit={handleStartEdit}
        onDelete={handleDeletePreset}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onEditNameChange={(e) => setEditName(e.target.value)}
        onKeyPress={handleKeyPress}
      />

      <PresetsCommunityCard
        showCommunitySection={showCommunitySection}
        onToggleCommunitySection={() => setShowCommunitySection((s) => !s)}
        presets={presets}
        showUploadForm={showUploadForm}
        uploadFormData={uploadFormData}
        uploadMessage={uploadMessage}
        uploading={uploading}
        onOpenUploadForm={() => {
          setUploadFormData({
            name: '',
            description: '',
            creator_name: '',
            tags: '',
            custom_image: null,
            selectedPreset: null,
          });
          setShowUploadForm(true);
          setUploadMessage({ type: '', text: '' });
        }}
        onCloseUploadForm={() => {
          setShowUploadForm(false);
          setUploadFormData({
            name: '',
            description: '',
            creator_name: '',
            tags: '',
            custom_image: null,
            selectedPreset: null,
          });
          setUploadMessage({ type: '', text: '' });
        }}
        onUploadField={onUploadField}
        onUpload={handleUpload}
        onImportCommunityPreset={handleImportCommunityPreset}
      />

      <AuthModal />
    </div>
  );
});

PresetsSettingsTab.displayName = 'PresetsSettingsTab';

export default PresetsSettingsTab;
