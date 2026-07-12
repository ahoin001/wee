import React, { useState, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Bookmark, Home, Library, Music, Palette, Users } from 'lucide-react';
import { AuthModal } from '../modals';
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
import { normalizePresetRecord, sanitizePresetCollection, toVisualOnlyPreset } from '../../utils/presets/presetThemeData';
import { createDefaultSpotifyMatchPreset, SPOTIFY_MATCH_PRESET_NAME } from '../../utils/presets/spotifyMatchPreset';
import { importCommunityPresetFlow } from '../../utils/presets/importCommunityPresetFlow';
import { runSceneTransition } from '../../utils/workspaces/runSceneTransition';
import { buildWorkspaceDataFromStore } from '../../utils/workspaces/buildWorkspaceSnapshot';
import { normalizeWorkspacesState } from '../../utils/workspaces/workspaceState';
import { createPresetId } from '../../utils/presets/presetIds';
import {
  PRESET_SCOPE_VISUAL,
  PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
  normalizePresetScope,
} from '../../utils/presets/presetScopes';
import {
  isSupportedPresetCoverImageUpload,
  SUPPORTED_GALLERY_HINT,
} from '../../utils/supportedUploadMedia';
import './surfaceStyles.css';

import PresetsSaveCurrentCard from './presets/PresetsSaveCurrentCard';
import PresetsSpotifyMatchSection from './presets/PresetsSpotifyMatchSection';
import PresetsSavedListCard from './presets/PresetsSavedListCard';
import PresetsCommunityCard from './presets/PresetsCommunityCard';
import {
  WeeButton,
  WeeModalFieldCard,
  WeeModalShell,
  WeeSectionEyebrow,
  WeeSettingsCollapsibleSection,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';

const MAX_CUSTOM_PRESETS = 5;
const normalizePresetName = (value) => value.trim().toLowerCase();

const PRESET_UPDATE_SCOPE_OPTIONS = [
  {
    value: PRESET_SCOPE_VISUAL,
    title: 'Visual only',
    subtitle: 'Colors, wallpaper, dock & chrome. Shareable.',
    Icon: Palette,
  },
  {
    value: PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
    title: 'Visuals + Home channels',
    subtitle: 'Also overwrite this preset’s Home channel layout.',
    Icon: Home,
  },
];

const PresetsSettingsTab = React.memo(() => {
  const { presets, spotifyMatchEnabled, workspaces } = useConsolidatedAppStore(
    useShallow((state) => ({
      presets: state.presets,
      spotifyMatchEnabled: state.ui.spotifyMatchEnabled,
      workspaces: state.workspaces,
    }))
  );
  const { setPresets, setUIState, setWorkspacesState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setPresets: state.actions.setPresets,
      setUIState: state.actions.setUIState,
      setWorkspacesState: state.actions.setWorkspacesState,
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
    custom_image_name: null,
    selectedPreset: null,
  });
  const [includeHomeChannels, setIncludeHomeChannels] = useState(false);
  const [immersiveModeState, setImmersiveModeState] = useState({});
  const [updateScopeDialog, setUpdateScopeDialog] = useState(null);
  const [updateScopeModalOpen, setUpdateScopeModalOpen] = useState(false);
  const [updateScopeModalMounted, setUpdateScopeModalMounted] = useState(false);
  const [selectedUpdateScope, setSelectedUpdateScope] = useState(PRESET_SCOPE_VISUAL);
  const [isUpdatingPreset, setIsUpdatingPreset] = useState(false);

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
        }

        const { presets: sanitizedPresets, changed } = sanitizePresetCollection(currentPresets);
        currentPresets = sanitizedPresets;
        if (!spotifyMatchExists || changed) {
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
          localKey: preset.id,
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
    const unsubscribe = useConsolidatedAppStore.subscribe(
      (state) => state.spotify?.immersiveMode,
      (immersive) => {
        setImmersiveModeState(immersive || {});
      }
    );
    setImmersiveModeState(useConsolidatedAppStore.getState().spotify.immersiveMode || {});
    return unsubscribe;
  }, []);

  const customPresetCount = presets.filter((p) => p.name !== SPOTIFY_MATCH_PRESET_NAME).length;
  const normalizedProfiles = normalizeWorkspacesState(workspaces);
  const hasActiveProfile = Boolean(normalizedProfiles.activeWorkspaceId);
  const selectedCaptureScope = includeHomeChannels
    ? PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS
    : PRESET_SCOPE_VISUAL;
  const hasPresetName = useCallback(
    (name, excludeId = null) => {
      const normalized = normalizePresetName(name);
      if (!normalized) return false;
      return presets.some((preset) => {
        const presetKey = preset.id || preset.name;
        return normalizePresetName(preset.name || '') === normalized && presetKey !== excludeId;
      });
    },
    [presets]
  );

  const handleDragStart = (e, presetId) => {
    setDraggingPreset(presetId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, presetId) => {
    if (!draggingPreset) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(presetId);
  };

  const handleDragEnter = (e, presetId) => {
    if (!draggingPreset) return;
    e.preventDefault();
    setDropTarget(presetId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDropTarget(null);
  };

  const handleDrop = (e, targetPresetId) => {
    if (!draggingPreset || draggingPreset === targetPresetId) {
      setDraggingPreset(null);
      setDropTarget(null);
      return;
    }
    e.preventDefault();
    const currentPresets = [...presets];
    const draggedIndex = currentPresets.findIndex((p) => p.id === draggingPreset);
    const targetIndex = currentPresets.findIndex((p) => p.id === targetPresetId);
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
    if (hasPresetName(newPresetName)) {
      setError('A preset with this name already exists.');
      return;
    }
    if (customPresetCount >= MAX_CUSTOM_PRESETS) return;

    const presetData = buildPresetDataFromStore({ captureScope: selectedCaptureScope });
    const thumbnailDataUrl = await capturePresetThumbnailDataUrl();
    if (thumbnailDataUrl) {
      setCaptureNotice({ type: 'success', text: 'Captured preset preview ✨' });
    } else {
      setCaptureNotice({ type: 'warning', text: 'Could not capture preview, using default thumbnail.' });
    }

    const newPreset = {
      id: createPresetId(),
      name: newPresetName.trim(),
      data: presetData,
      captureScope: selectedCaptureScope,
      includesHomeChannels: selectedCaptureScope === PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
      shareable: selectedCaptureScope === PRESET_SCOPE_VISUAL,
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

  const commitPresetUpdate = useCallback(
    async (presetId, updateScope) => {
      if (!presetId || isUpdatingPreset) return false;
      setIsUpdatingPreset(true);
      try {
        const currentPresets = useConsolidatedAppStore.getState().presets || [];
        const targetExists = currentPresets.some((p) => p.id === presetId);
        if (!targetExists) {
          setCaptureNotice({ type: 'warning', text: 'Could not find that preset to update.' });
          setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2200);
          return false;
        }

        const scope = normalizePresetScope(updateScope);
        const presetData = buildPresetDataFromStore({ captureScope: scope });
        const thumbnailDataUrl = await capturePresetThumbnailDataUrl();
        if (thumbnailDataUrl) {
          setCaptureNotice({ type: 'success', text: 'Preset updated with a fresh preview ✨' });
        } else {
          setCaptureNotice({
            type: 'warning',
            text: 'Preset updated. Could not refresh preview — kept the previous thumbnail.',
          });
        }

        const updatedPresets = currentPresets.map((p) =>
          p.id === presetId
            ? {
                ...p,
                data: presetData,
                captureScope: scope,
                includesHomeChannels: scope === PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
                shareable: scope === PRESET_SCOPE_VISUAL,
                timestamp: new Date().toISOString(),
                thumbnailDataUrl: thumbnailDataUrl || p.thumbnailDataUrl || null,
              }
            : p
        );
        setPresets(updatedPresets);
        await savePresetsToBackend(updatedPresets);
        setJustUpdated(presetId);
        setTimeout(() => setJustUpdated(null), 1800);
        setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2400);
        return true;
      } catch (e) {
        console.error('[PresetsSettingsTab] Failed to update preset:', e);
        setCaptureNotice({ type: 'warning', text: 'Update failed. Please try again.' });
        setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2400);
        return false;
      } finally {
        setIsUpdatingPreset(false);
      }
    },
    [isUpdatingPreset, savePresetsToBackend, setPresets]
  );

  const handleUpdate = useCallback(
    (presetId) => {
      const targetPreset = presets.find((p) => p.id === presetId);
      if (!targetPreset) return;
      const currentScope = normalizePresetScope(targetPreset.captureScope);
      setUpdateScopeDialog({
        presetId,
        presetName: targetPreset.name || 'Preset',
        currentScope,
      });
      setSelectedUpdateScope(currentScope);
      setUpdateScopeModalOpen(true);
    },
    [presets]
  );

  useLayoutEffect(() => {
    if (updateScopeModalOpen) setUpdateScopeModalMounted(true);
  }, [updateScopeModalOpen]);

  const handleCloseUpdateScopeDialog = useCallback(() => {
    if (isUpdatingPreset) return;
    setUpdateScopeModalOpen(false);
  }, [isUpdatingPreset]);

  const handleUpdateScopeExitComplete = useCallback(() => {
    setUpdateScopeModalMounted(false);
    setUpdateScopeDialog(null);
  }, []);

  const handleConfirmUpdateScope = useCallback(async () => {
    if (!updateScopeDialog?.presetId || isUpdatingPreset) return;
    const ok = await commitPresetUpdate(updateScopeDialog.presetId, selectedUpdateScope);
    if (ok) setUpdateScopeModalOpen(false);
  }, [updateScopeDialog, selectedUpdateScope, isUpdatingPreset, commitPresetUpdate]);

  const updateScopeChoiceLabel = useMemo(() => {
    const match = PRESET_UPDATE_SCOPE_OPTIONS.find((o) => o.value === selectedUpdateScope);
    return match?.title || 'this scope';
  }, [selectedUpdateScope]);

  const handleStartEdit = (preset) => {
    setEditingPreset(preset.id);
    setEditName(preset.name);
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
    setEditName('');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    if (hasPresetName(editName, editingPreset)) return;

    const updatedPresets = presets.map((preset) => {
      const presetKey = preset.id || preset.name;
      return presetKey === editingPreset ? { ...preset, name: editName.trim() } : preset;
    });
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setEditingPreset(null);
    setEditName('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSaveEdit();
    else if (e.key === 'Escape') handleCancelEdit();
  };

  const handleDeletePreset = async (presetId) => {
    const target = presets.find((preset) => (preset.id || preset.name) === presetId);
    if (!target) return;
    const confirmed = window.confirm(`Delete preset "${target.name}"? This cannot be undone.`);
    if (!confirmed) return;

    const updatedPresets = presets.filter((preset) => (preset.id || preset.name) !== presetId);
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
  };

  const handleApplyPreset = async (preset) => {
    const normalizedPreset = normalizePresetRecord(preset);
    if (!normalizedPreset) return;
    await runSceneTransition(`Applying preset: ${preset?.name || 'Theme'}`, async () => {
      await applyPresetData(normalizedPreset);
    });
  };

  const handleApplyPresetToActiveProfile = async (preset) => {
    const normalizedPreset = normalizePresetRecord(preset);
    if (!normalizedPreset || !normalizedProfiles.activeWorkspaceId) return;

    await runSceneTransition(`Applying ${preset?.name || 'preset'} to active profile`, async () => {
      await applyPresetData(normalizedPreset);
    });

    const nextItems = normalizedProfiles.items.map((profile) =>
      profile.id === normalizedProfiles.activeWorkspaceId
        ? {
            ...profile,
            data: buildWorkspaceDataFromStore(),
            timestamp: new Date().toISOString(),
          }
        : profile
    );
    setWorkspacesState({
      items: nextItems,
      activeWorkspaceId: normalizedProfiles.activeWorkspaceId,
    });
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
      captureScope: PRESET_SCOPE_VISUAL,
      includeSpotifyPalette: true,
    });

    const thumbnailDataUrl = await capturePresetThumbnailDataUrl();
    const newPreset = {
      id: createPresetId(),
      name: name.trim(),
      data: presetData,
      captureScope: PRESET_SCOPE_VISUAL,
      includesHomeChannels: false,
      shareable: true,
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
    const selectedScope = uploadFormData.selectedPreset.captureScope || PRESET_SCOPE_VISUAL;
    if (selectedScope !== PRESET_SCOPE_VISUAL) {
      setUploadMessage({
        type: 'error',
        text: 'Only visual presets can be shared. Update this preset as visual-only first.',
      });
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
            preset.id === uploadFormData.selectedPreset.id
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
            custom_image_name: null,
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
    if (field === 'presetId') {
      const selected = presets.find((p) => (p.id || p.name) === value);
      setUploadFormData((prev) => ({
        ...prev,
        name: selected?.name || '',
        selectedPreset: selected || null,
      }));
      if (uploadMessage.text) setUploadMessage({ type: '', text: '' });
      return;
    }
    if (field === 'file' && value) {
      if (!isSupportedPresetCoverImageUpload(value)) {
        setUploadMessage({ type: 'error', text: SUPPORTED_GALLERY_HINT });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setUploadFormData((prev) => ({
          ...prev,
          custom_image: reader.result,
          custom_image_name: value.name,
        }));
      };
      reader.readAsDataURL(value);
      if (uploadMessage.text) setUploadMessage({ type: '', text: '' });
      return;
    }
    if (field === 'custom_image') {
      setUploadFormData((prev) => ({
        ...prev,
        custom_image: value,
        custom_image_name: value ? prev.custom_image_name : null,
      }));
      if (uploadMessage.text) setUploadMessage({ type: '', text: '' });
      return;
    }
    setUploadFormData((prev) => ({ ...prev, [field]: value }));
    if (uploadMessage.text) setUploadMessage({ type: '', text: '' });
  };

  const showSpotifySection = presets.some((p) => p.name === SPOTIFY_MATCH_PRESET_NAME);
  const selectedPresetNeedsShareableCopy = Boolean(
    uploadFormData.selectedPreset?.captureScope === PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS
  );

  const handleCreateShareableVisualCopy = async () => {
    const selected = uploadFormData.selectedPreset;
    if (!selected) return;
    if (customPresetCount >= MAX_CUSTOM_PRESETS) {
      setUploadMessage({
        type: 'error',
        text: `You can save up to ${MAX_CUSTOM_PRESETS} custom presets. Delete one before creating a shareable copy.`,
      });
      return;
    }
    const visualCopy = toVisualOnlyPreset(selected);
    if (!visualCopy) return;

    const baseName = `${selected.name} (Visual)`;
    let nextName = baseName;
    let suffix = 2;
    const hasName = (name) => hasPresetName(name);
    while (hasName(nextName)) {
      nextName = `${baseName} ${suffix}`;
      suffix += 1;
    }

    const nextPreset = {
      ...visualCopy,
      id: createPresetId(),
      name: nextName,
      timestamp: new Date().toISOString(),
      communityId: undefined,
      communityRootId: undefined,
      communityVersion: undefined,
      isCommunity: false,
    };

    const updatedPresets = [...presets, nextPreset];
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setUploadFormData((prev) => ({
      ...prev,
      name: nextPreset.name,
      selectedPreset: nextPreset,
    }));
    setUploadMessage({
      type: 'success',
      text: `Created "${nextPreset.name}". You can share this visual-only copy now.`,
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-6 pb-12">
      <SettingsTabPageHeader title="Presets" subtitle="Preset themes & customization" />

      <WeeSettingsCollapsibleSection
        icon={Bookmark}
        title="Save current look"
        description="Capture the active appearance as a named preset."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <PresetsSaveCurrentCard
            newPresetName={newPresetName}
            onNewPresetNameChange={(v) => {
              setNewPresetName(v);
              setError('');
            }}
            onSave={handleSave}
            error={error}
            captureNotice={captureNotice}
            includeHomeChannels={includeHomeChannels}
            onIncludeHomeChannelsChange={setIncludeHomeChannels}
            onOpenHomeProfiles={() => setUIState({ showSettingsModal: true, settingsActiveTab: 'workspaces' })}
            customPresetCount={customPresetCount}
            maxCustomPresets={MAX_CUSTOM_PRESETS}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      {showSpotifySection ? (
        <WeeSettingsCollapsibleSection
          icon={Music}
          title="Spotify Match"
          description="Album-driven colors, immersive mode, and gradient tools."
          defaultOpen
        >
          <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
            <PresetsSpotifyMatchSection
              show={showSpotifySection}
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
          </WeeModalFieldCard>
        </WeeSettingsCollapsibleSection>
      ) : null}

      <WeeSettingsCollapsibleSection
        icon={Library}
        title="Saved presets"
        description="Drag the ⋮⋮ handle to reorder. Visual presets are shareable; channel presets are local."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
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
            onApplyToActiveProfile={handleApplyPresetToActiveProfile}
            hasActiveProfile={hasActiveProfile}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Users}
        title="Community"
        description="Browse shared presets or upload your own."
        defaultOpen={false}
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
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
                custom_image_name: null,
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
                custom_image_name: null,
                selectedPreset: null,
              });
              setUploadMessage({ type: '', text: '' });
            }}
            onUploadField={onUploadField}
            onUpload={handleUpload}
            selectedPresetNeedsShareableCopy={selectedPresetNeedsShareableCopy}
            onCreateShareableVisualCopy={handleCreateShareableVisualCopy}
            onImportCommunityPreset={handleImportCommunityPreset}
          />
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <AuthModal />

      {updateScopeModalMounted ? (
        <WeeModalShell
          isOpen={updateScopeModalOpen}
          onClose={handleCloseUpdateScopeDialog}
          headerTitle="Update preset"
          showRail={false}
          maxWidth="min(760px, 94vw)"
          onExitAnimationComplete={handleUpdateScopeExitComplete}
          footerContent={() => (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <WeeButton
                variant="secondary"
                onClick={handleCloseUpdateScopeDialog}
                disabled={isUpdatingPreset}
              >
                Cancel
              </WeeButton>
              <WeeButton
                variant="primary"
                onClick={handleConfirmUpdateScope}
                disabled={isUpdatingPreset || !updateScopeDialog?.presetId}
              >
                {isUpdatingPreset ? 'Updating…' : 'Update preset'}
              </WeeButton>
            </div>
          )}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <WeeSectionEyebrow>Overwrite with current look</WeeSectionEyebrow>
              <h3 className="m-0 text-xl font-black uppercase italic tracking-tight text-[hsl(var(--wee-text-header))] md:text-2xl">
                {updateScopeDialog?.presetName || 'Preset'}
              </h3>
              <p className="m-0 max-w-xl text-sm font-medium leading-relaxed text-[hsl(var(--text-secondary))]">
                This replaces the saved preset with what you see right now. Pick how much to capture,
                then confirm.
              </p>
            </div>

            <div role="group" aria-label="What to capture" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PRESET_UPDATE_SCOPE_OPTIONS.map(({ value, title, subtitle, Icon }) => {
                const selected = selectedUpdateScope === value;
                const isCurrent = updateScopeDialog?.currentScope === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    disabled={isUpdatingPreset}
                    onClick={() => setSelectedUpdateScope(value)}
                    className={`flex flex-col items-start gap-4 rounded-[2rem] border-4 p-6 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      selected
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--surface-wii-tint)/0.65)]'
                        : 'border-[hsl(var(--wee-border-card))] hover:border-[hsl(var(--border-secondary))]'
                    }`}
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${
                        selected
                          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                          : 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-tertiary))]'
                      }`}
                    >
                      <Icon size={28} strokeWidth={1.8} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`m-0 font-black uppercase italic tracking-wide ${
                          selected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--wee-text-header))]'
                        }`}
                      >
                        {title}
                      </p>
                      <p className="m-0 mt-2 text-[11px] font-bold uppercase leading-relaxed tracking-[0.08em] text-[hsl(var(--text-tertiary))]">
                        {subtitle}
                      </p>
                      {isCurrent ? (
                        <p className="m-0 mt-3 inline-flex rounded-full bg-[hsl(var(--surface-secondary))] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
                          Current scope
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
              Will save as: {updateScopeChoiceLabel}
            </p>
          </div>
        </WeeModalShell>
      ) : null}
    </div>
  );
});

PresetsSettingsTab.displayName = 'PresetsSettingsTab';

export default PresetsSettingsTab;

