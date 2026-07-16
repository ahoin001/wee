import React, { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { Bookmark, Home, Library, Music, Palette, Users } from 'lucide-react';
import { getCommunityPresetUpdates, uploadPreset, downloadPreset } from '../../utils/supabase';
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
import { exportPresetToFile, parsePresetFile, WEE_PRESET_FILE_EXTENSION } from '../../utils/presets/presetFileTransfer';
import { createDefaultSpotifyMatchPreset, SPOTIFY_MATCH_PRESET_NAME } from '../../utils/presets/spotifyMatchPreset';
import {
  defaultFrozenSpotifyLookName,
  MAX_CUSTOM_PRESETS,
  saveFrozenSpotifyLookPreset,
} from '../../utils/presets/saveFrozenSpotifyLookPreset';
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
import { createWeeTransition } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import './surfaceStyles.css';

import PresetsSaveCurrentCard from './presets/PresetsSaveCurrentCard';
import PresetsSpotifyMatchSection from './presets/PresetsSpotifyMatchSection';
import PresetsSavedListCard from './presets/PresetsSavedListCard';
import PresetsCommunityCard from './presets/PresetsCommunityCard';
import {
  WeeButton,
  WeeModalShell,
  WeeRevealWhen,
  WeeSectionEyebrow,
  WeeSettingsCollapsibleSection,
} from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import WInput from '../../ui/WInput';

const normalizePresetName = (value) => value.trim().toLowerCase();

const PRESET_UPDATE_SCOPE_OPTIONS = [
  {
    value: PRESET_SCOPE_VISUAL,
    title: 'Look only',
    subtitle: 'Colors, wallpaper, dock & chrome. Shareable and exportable.',
    Icon: Palette,
  },
  {
    value: PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
    title: 'Look + channel boards',
    subtitle: 'Also overwrite Home + Focus boards (punched holes included). Stays on this PC.',
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
  const [justApplied, setJustApplied] = useState(null);
  const [communityMode, setCommunityMode] = useState('browse');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  const [communityUpdateMap, setCommunityUpdateMap] = useState({});
  const [captureNotice, setCaptureNotice] = useState({ type: '', text: '' });
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    creator_name: '',
    tags: '',
    custom_image: null,
    custom_image_name: null,
    selectedPreset: null,
  });
  /** Local saves default to boards + look; community share stays visual-only. */
  const [includeHomeChannels, setIncludeHomeChannels] = useState(true);
  const [updateScopeDialog, setUpdateScopeDialog] = useState(null);
  const [updateScopeModalOpen, setUpdateScopeModalOpen] = useState(false);
  const [updateScopeModalMounted, setUpdateScopeModalMounted] = useState(false);
  const [selectedUpdateScope, setSelectedUpdateScope] = useState(PRESET_SCOPE_VISUAL);
  const [isUpdatingPreset, setIsUpdatingPreset] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [spotifyNameModalOpen, setSpotifyNameModalOpen] = useState(false);
  const [spotifyNameInput, setSpotifyNameInput] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const importFileInputRef = useRef(null);
  const saveSectionRef = useRef(null);
  const mf = useMotionFeedback();
  const noticeTransition = createWeeTransition('pillOpen', {
    reducedMotion: !mf.channelReorderSlotMotion,
  });

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
    if (isSavingPreset) return;
    if (!newPresetName.trim()) {
      setError('Please enter a name for the preset.');
      return;
    }
    if (hasPresetName(newPresetName)) {
      setError('A preset with this name already exists.');
      return;
    }
    if (customPresetCount >= MAX_CUSTOM_PRESETS) {
      setError(`You can save up to ${MAX_CUSTOM_PRESETS} custom presets. Delete one first.`);
      return;
    }

    setIsSavingPreset(true);
    setCaptureNotice({ type: 'info', text: 'Capturing preview…' });
    try {
      const presetData = buildPresetDataFromStore({ captureScope: selectedCaptureScope });
      const thumbnailDataUrl = await capturePresetThumbnailDataUrl();
      if (thumbnailDataUrl) {
        setCaptureNotice({ type: 'success', text: 'Captured preset preview' });
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
    } catch (e) {
      console.error('[PresetsSettingsTab] Failed to save preset:', e);
      setCaptureNotice({ type: 'warning', text: 'Could not save preset. Please try again.' });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2400);
    } finally {
      setIsSavingPreset(false);
    }
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
          setCaptureNotice({ type: 'success', text: 'Preset updated with a fresh preview' });
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
    setDeleteDialog({ id: presetId, name: target.name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog?.id) return;
    const updatedPresets = presets.filter((preset) => (preset.id || preset.name) !== deleteDialog.id);
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setDeleteModalOpen(false);
    setDeleteDialog(null);
  };

  const handleApplyPreset = async (preset) => {
    const normalizedPreset = normalizePresetRecord(preset);
    if (!normalizedPreset) return;
    const key = preset.id || preset.name;
    await runSceneTransition(`Applying preset: ${preset?.name || 'Theme'}`, async () => {
      await applyPresetData(normalizedPreset);
    });
    setJustApplied(key);
    setTimeout(() => setJustApplied(null), 900);
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
    const extracted = useConsolidatedAppStore.getState().spotify?.extractedColors;
    if (customPresetCount >= MAX_CUSTOM_PRESETS) {
      setCaptureNotice({
        type: 'warning',
        text: `You can save up to ${MAX_CUSTOM_PRESETS} custom presets. Delete one first.`,
      });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 3200);
      return;
    }
    if (!extracted?.primary) {
      setCaptureNotice({
        type: 'warning',
        text: 'No album colors yet. Start playback or enable Color Match until colors appear.',
      });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 3200);
      return;
    }

    setSpotifyNameInput(defaultFrozenSpotifyLookName());
    setSpotifyNameModalOpen(true);
  };

  const handleConfirmSpotifyNameSave = async () => {
    const name = spotifyNameInput.trim();
    if (!name) return;

    const result = await saveFrozenSpotifyLookPreset({ name });
    if (!result.ok) {
      setCaptureNotice({ type: 'warning', text: result.error });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 3200);
      return;
    }

    setSpotifyNameModalOpen(false);
    setCaptureNotice({ type: 'success', text: `Saved preset "${name}" with frozen colors.` });
    setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2500);
  };

  const handleImportCommunityPreset = async (presetData) => {
    const result = await importCommunityPresetFlow(presetData, {
      getPresets: () => useConsolidatedAppStore.getState().presets,
      setPresets,
      savePresetsToBackend,
    });
    if (result?.skippedMax || result?.errors?.length) {
      setCaptureNotice({
        type: result.skippedMax || !result.imported ? 'warning' : 'success',
        text: result.errors?.[0] || 'Import finished with notes.',
      });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 4200);
    } else if (result?.imported) {
      setCaptureNotice({ type: 'success', text: 'Community look installed.' });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2200);
    }
    return result;
  };

  const handleApplyCommunityUpdate = async (localPreset) => {
    const updateInfo = communityUpdateMap[localPreset.id || localPreset.name];
    const latestId = updateInfo?.latestPresetId;
    if (!latestId) return;
    try {
      const result = await downloadPreset(latestId);
      if (!result.success || !result.data) {
        setCaptureNotice({ type: 'warning', text: result.error || 'Could not download update.' });
        setTimeout(() => setCaptureNotice({ type: '', text: '' }), 3200);
        return;
      }
      const presetData = result.data;
      const importData = {
        name: localPreset.name,
        settings: presetData.settings,
        id: presetData.id,
        wallpaper: presetData.wallpaper,
        version: presetData.version || updateInfo.latestVersion || 1,
        rootPresetId: presetData.rootPresetId || localPreset.communityRootId || presetData.id,
        parentPresetId: presetData.parentPresetId || null,
      };

      // Replace in place instead of appending a duplicate.
      let presetSettings = importData.settings;
      const { normalizeWallpaperCurrentShape } = await import('../../utils/presetSharing');
      if (importData.wallpaper?.data && window.api?.wallpapers?.saveFile) {
        try {
          const wd = importData.wallpaper.data;
          const uint8Array = new Uint8Array(wd);
          const binaryString = Array.from(uint8Array, (byte) => String.fromCharCode(byte)).join('');
          const base64Data = btoa(binaryString);
          const fileName = importData.wallpaper.fileName || `community-wallpaper-${Date.now()}.jpg`;
          const mimeType = importData.wallpaper.mimeType || 'image/jpeg';
          const saveResult = await window.api.wallpapers.saveFile({
            filename: fileName,
            data: base64Data,
            mimeType,
          });
          if (saveResult.success) {
            if (!presetSettings.wallpaper || typeof presetSettings.wallpaper !== 'object') {
              presetSettings.wallpaper = {};
            }
            presetSettings.wallpaper = normalizeWallpaperCurrentShape(presetSettings.wallpaper, {
              url: saveResult.url,
              name: fileName,
              mimeType,
              source: 'community',
            });
          }
        } catch (e) {
          console.warn('[PresetsSettingsTab] Community update wallpaper save failed', e);
        }
      } else if (presetSettings?.wallpaper) {
        presetSettings = {
          ...presetSettings,
          wallpaper: normalizeWallpaperCurrentShape(presetSettings.wallpaper),
        };
      }

      const localKey = localPreset.id || localPreset.name;
      const updatedPresets = presets.map((p) =>
        (p.id || p.name) === localKey
          ? {
              ...p,
              data: presetSettings,
              captureScope: PRESET_SCOPE_VISUAL,
              includesHomeChannels: false,
              shareable: true,
              timestamp: new Date().toISOString(),
              isCommunity: true,
              communityId: importData.id,
              communityRootId: importData.rootPresetId,
              communityVersion: importData.version,
            }
          : p
      );
      setPresets(updatedPresets);
      await savePresetsToBackend(updatedPresets);
      setCaptureNotice({ type: 'success', text: `Updated “${localPreset.name}” from community.` });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2600);
    } catch (e) {
      console.error('[PresetsSettingsTab] Community update failed', e);
      setCaptureNotice({ type: 'warning', text: 'Community update failed.' });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 3200);
    }
  };

  const handleExportPresetFile = useCallback((preset) => {
    const result = exportPresetToFile(preset);
    if (result.ok) {
      setCaptureNotice({
        type: 'success',
        text: `Exported “${preset?.name || 'look'}” as a visual-only ${WEE_PRESET_FILE_EXTENSION} file.`,
      });
    } else {
      setCaptureNotice({ type: 'warning', text: result.error || 'Export failed.' });
    }
    setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2600);
  }, []);

  const handleImportFilePick = useCallback(() => {
    importFileInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = parsePresetFile(text);
      if (!result.ok) {
        setCaptureNotice({ type: 'warning', text: result.error });
        setTimeout(() => setCaptureNotice({ type: '', text: '' }), 3600);
        return;
      }
      setImportPreview({ preset: result.preset, meta: result.meta, fileName: file.name });
      setImportModalOpen(true);
    } catch (e) {
      console.error('[PresetsSettingsTab] Import file read failed:', e);
      setCaptureNotice({ type: 'warning', text: 'Could not read that file.' });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 3200);
    }
  }, []);

  const handleConfirmImportFile = useCallback(async () => {
    const incoming = importPreview?.preset;
    if (!incoming) return;

    const currentPresets = useConsolidatedAppStore.getState().presets || [];
    const currentCustomCount = currentPresets.filter((p) => p.name !== SPOTIFY_MATCH_PRESET_NAME).length;
    if (currentCustomCount >= MAX_CUSTOM_PRESETS) {
      setCaptureNotice({
        type: 'warning',
        text: `You can save up to ${MAX_CUSTOM_PRESETS} custom presets. Delete one before importing.`,
      });
      setTimeout(() => setCaptureNotice({ type: '', text: '' }), 3600);
      setImportModalOpen(false);
      return;
    }

    let nextName = incoming.name;
    let suffix = 2;
    while (hasPresetName(nextName)) {
      nextName = `${incoming.name} ${suffix}`;
      suffix += 1;
    }

    const updatedPresets = [...currentPresets, { ...incoming, name: nextName }];
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setImportModalOpen(false);
    setCaptureNotice({ type: 'success', text: `Imported “${nextName}”. Apply it from Saved looks.` });
    setTimeout(() => setCaptureNotice({ type: '', text: '' }), 2600);
  }, [importPreview, hasPresetName, setPresets, savePresetsToBackend]);

  const handleSharePreset = (preset) => {
    setUploadFormData({
      name: preset.name || '',
      description: '',
      creator_name: '',
      tags: '',
      custom_image: null,
      custom_image_name: null,
      selectedPreset: preset,
    });
    setCommunityMode('share');
    setUploadMessage({ type: '', text: '' });
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
          setUploadMessage({
            type: 'warning',
            text: `Shared with notes: ${allWarnings.join(' ')}`,
          });
        } else {
          setUploadMessage({ type: 'success', text: 'Preset uploaded successfully!' });
        }
        setTimeout(() => {
          setCommunityMode('browse');
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
        }, 1800);
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
      <SettingsTabPageHeader title="Looks" subtitle="Save looks, apply themes, and share with the community" />

      <AnimatePresence initial={false}>
        {captureNotice.text ? (
          <m.div
            key={`${captureNotice.type}-${captureNotice.text}`}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={noticeTransition}
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              captureNotice.type === 'success'
                ? 'border-[hsl(var(--state-success))] bg-[hsl(var(--state-success-light))] text-[hsl(var(--state-success))]'
                : captureNotice.type === 'info'
                  ? 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))]'
                  : 'border-[hsl(var(--state-warning))] bg-[hsl(var(--state-warning)/0.14)] text-[hsl(var(--state-warning))]'
            }`}
          >
            {captureNotice.text}
          </m.div>
        ) : null}
      </AnimatePresence>

      <div ref={saveSectionRef}>
        <WeeSettingsCollapsibleSection
          icon={Bookmark}
          title="Save current look"
          description="Capture wallpaper, colors, dock, and Home appearance as a named preset."
          defaultOpen
        >
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
            isSaving={isSavingPreset}
          />
        </WeeSettingsCollapsibleSection>
      </div>

      <WeeRevealWhen when={showSpotifySection} keepMounted={false}>
        <WeeSettingsCollapsibleSection
          icon={Music}
          title="Spotify Match"
          description="Album-driven colors for your look."
          defaultOpen={false}
        >
          <PresetsSpotifyMatchSection
            spotifyMatchEnabled={spotifyMatchEnabled}
            onSpotifyMatchToggle={handleSpotifyMatchToggle}
            onSaveLookAsPreset={handleSaveSpotifyLookAsPreset}
            onOpenColorMatchSettings={() => {
              setUIState({
                showSettingsModal: false,
                homeBoardArrangeMode: true,
                homeBoardPunchMode: false,
              });
              useConsolidatedAppStore.getState().actions.setSpacesState({ activeSpaceId: 'home' });
            }}
          />
        </WeeSettingsCollapsibleSection>
      </WeeRevealWhen>

      <WeeSettingsCollapsibleSection
        icon={Library}
        title="Saved looks"
        description="Thumbnail previews · Apply is primary · More for update, share, rename"
        defaultOpen
      >
        <PresetsSavedListCard
          presets={presets}
          excludeName={SPOTIFY_MATCH_PRESET_NAME}
          draggingPreset={draggingPreset}
          dropTarget={dropTarget}
          editingPreset={editingPreset}
          editName={editName}
          justUpdated={justUpdated}
          justApplied={justApplied}
          communityUpdateMap={communityUpdateMap}
          customPresetCount={customPresetCount}
          maxCustomPresets={MAX_CUSTOM_PRESETS}
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
          onApplyCommunityUpdate={handleApplyCommunityUpdate}
          onShare={handleSharePreset}
          onExport={handleExportPresetFile}
          onImportFile={handleImportFilePick}
          onFocusSaveSection={() => saveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
        <input
          ref={importFileInputRef}
          type="file"
          accept={`${WEE_PRESET_FILE_EXTENSION},application/json`}
          className="hidden"
          onChange={handleImportFileChange}
          aria-hidden
          tabIndex={-1}
        />
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Users}
        title="Community"
        description="Browse shared looks or upload yours (wallpaper + colors included)."
        defaultOpen={false}
      >
        <PresetsCommunityCard
          communityMode={communityMode}
          onCommunityModeChange={(mode) => {
            setCommunityMode(mode);
            if (mode === 'share' && !uploadFormData.selectedPreset) {
              setUploadMessage({ type: '', text: '' });
            }
          }}
          presets={presets}
          uploadFormData={uploadFormData}
          uploadMessage={uploadMessage}
          uploading={uploading}
          onUploadField={onUploadField}
          onUpload={handleUpload}
          selectedPresetNeedsShareableCopy={selectedPresetNeedsShareableCopy}
          onCreateShareableVisualCopy={handleCreateShareableVisualCopy}
          onImportCommunityPreset={handleImportCommunityPreset}
          onCloseUploadForm={() => {
            setCommunityMode('browse');
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
        />
      </WeeSettingsCollapsibleSection>

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
                        <p className="m-0 mt-3 inline-flex rounded-full bg-[hsl(var(--surface-secondary))] px-2.5 py-1 text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
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

      <WeeModalShell
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteDialog(null);
        }}
        headerTitle="Delete preset"
        showRail={false}
        maxWidth="min(480px, 94vw)"
        footerContent={() => (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <WeeButton
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteDialog(null);
              }}
            >
              Cancel
            </WeeButton>
            <WeeButton variant="primary" onClick={handleConfirmDelete}>
              Delete
            </WeeButton>
          </div>
        )}
      >
        <p className="m-0 text-sm font-medium leading-relaxed text-[hsl(var(--text-secondary))]">
          Delete “{deleteDialog?.name}”? This cannot be undone.
        </p>
      </WeeModalShell>

      <WeeModalShell
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        headerTitle="Import look"
        showRail={false}
        maxWidth="min(520px, 94vw)"
        onExitAnimationComplete={() => setImportPreview(null)}
        footerContent={() => (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <WeeButton variant="secondary" onClick={() => setImportModalOpen(false)}>
              Cancel
            </WeeButton>
            <WeeButton variant="primary" onClick={handleConfirmImportFile}>
              Add to my looks
            </WeeButton>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {importPreview?.preset?.thumbnailDataUrl ? (
              <img
                src={importPreview.preset.thumbnailDataUrl}
                alt=""
                className="h-16 w-28 shrink-0 rounded-xl border border-[hsl(var(--border-primary))] object-cover"
              />
            ) : (
              <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border-primary))] text-[hsl(var(--text-tertiary))]">
                <Palette size={20} aria-hidden />
              </div>
            )}
            <div className="min-w-0">
              <p className="m-0 truncate text-base font-black text-[hsl(var(--wee-text-header))]">
                {importPreview?.preset?.name || 'Imported look'}
              </p>
              <p className="m-0 mt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--text-tertiary))]">
                Look · shareable scope · file v{importPreview?.meta?.formatVersion ?? '?'}
              </p>
            </div>
          </div>
          <p className="m-0 text-sm font-medium leading-relaxed text-[hsl(var(--text-secondary))]">
            Adds this look to your saved presets without applying it. Only visual settings
            (wallpaper, colors, dock, chrome) are imported — never Home channels or app paths.
          </p>
        </div>
      </WeeModalShell>

      <WeeModalShell
        isOpen={spotifyNameModalOpen}
        onClose={() => {
          setSpotifyNameModalOpen(false);
        }}
        headerTitle="Freeze matched colors"
        showRail={false}
        maxWidth="min(480px, 94vw)"
        footerContent={() => (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <WeeButton
              variant="secondary"
              onClick={() => {
                setSpotifyNameModalOpen(false);
              }}
            >
              Cancel
            </WeeButton>
            <WeeButton variant="primary" onClick={handleConfirmSpotifyNameSave} disabled={!spotifyNameInput.trim()}>
              Save preset
            </WeeButton>
          </div>
        )}
      >
        <div className="space-y-3">
          <p className="m-0 text-sm font-medium text-[hsl(var(--text-secondary))]">
            Saves frozen album colors with your current visual look.
          </p>
          <WInput
            variant="wee"
            value={spotifyNameInput}
            onChange={(e) => setSpotifyNameInput(e.target.value)}
            placeholder="Preset name"
          />
        </div>
      </WeeModalShell>
    </div>
  );
});

PresetsSettingsTab.displayName = 'PresetsSettingsTab';

export default PresetsSettingsTab;

