import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';

import JSZip from 'jszip';
import Button from '../ui/WButton';
import '../styles/design-system.css';
import Text from '../ui/Text';
import Card from '../ui/Card';
import PresetListItem from './PresetListItem';
import WToggle from '../ui/WToggle';
import CommunityPresets from './CommunityPresets';
import './presets-modal.css';

import { uploadPreset } from '../utils/supabase';
import { parseTags, resolveCustomImageFileForShare, resolveWallpaperFileForShare } from '../utils/presetSharing';

function PresetsModal({ isOpen, onClose, presets, onSavePreset, onDeletePreset, onApplyPreset, onUpdatePreset, onRenamePreset, onImportPresets, onReorderPresets }) {
  const fileInputRef = useRef();
  const [importedPresets, setImportedPresets] = useState(null);
  const [importError, setImportError] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [error, setError] = useState('');
  const [justUpdated, setJustUpdated] = useState(null); // name of last updated preset
  const [editingPreset, setEditingPreset] = useState(null); // preset being edited
  const [editName, setEditName] = useState(''); // temporary edit name
  const [editError, setEditError] = useState(''); // error for edit mode
  const [includeChannels, setIncludeChannels] = useState(false); // toggle for including channel data
  const [includeSounds, setIncludeSounds] = useState(false); // toggle for including sound settings
  const [overwriteMap, setOverwriteMap] = useState({});
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [draggingPreset, setDraggingPreset] = useState(null); // name of preset being dragged
  const [dropTarget, setDropTarget] = useState(null); // name of preset being hovered over for drop
  
  // ✅ DATA LAYER: Use local state for modal-specific UI state to prevent infinite loops
  const [showCommunitySection, setShowCommunitySection] = useState(false);
  const [confirmDeleteState, setConfirmDeleteState] = useState(false);
  
  const toggleCommunitySection = () => {
    setShowCommunitySection(prev => !prev);
  };
  
  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    creator_name: '',
    tags: '',
    custom_image: null,
    selectedPreset: null
  });

  // Helper to get presets to export
  const getPresetsToExport = () => {
    if (selectedPresets.length > 0) {
      return presets.filter(p => selectedPresets.includes(p.name));
    }
    return presets;
  };

  // Drag and drop handlers for preset reordering
  const handleDragStart = (e, presetName) => {
    if (selectMode) return; // Don't allow dragging in select mode
    setDraggingPreset(presetName);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, presetName) => {
    if (!draggingPreset || selectMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(presetName);
  };

  const handleDragEnter = (e, presetName) => {
    if (!draggingPreset || selectMode) return;
    e.preventDefault();
    setDropTarget(presetName);
  };

  const handleDragLeave = (e) => {
    if (selectMode) return;
    e.preventDefault();
    setDropTarget(null);
  };

  const handleDrop = (e, targetPresetName) => {
    if (!draggingPreset || draggingPreset === targetPresetName || selectMode) {
      setDraggingPreset(null);
      setDropTarget(null);
      return;
    }
    
    e.preventDefault();
    
    // Reorder the presets array
    const currentPresets = [...presets];
    const draggedIndex = currentPresets.findIndex(p => p.name === draggingPreset);
    const targetIndex = currentPresets.findIndex(p => p.name === targetPresetName);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedPreset] = currentPresets.splice(draggedIndex, 1);
      currentPresets.splice(targetIndex, 0, draggedPreset);
      
      // Call the reorder callback to update the parent state
      if (onReorderPresets) {
        onReorderPresets(currentPresets);
      }
    }
    
    setDraggingPreset(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggingPreset(null);
    setDropTarget(null);
  };

  // Export presets as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(presets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wiidesktop-presets.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export presets as zip (optionally only selected)
  const handleExportZip = async (presetsToExport = null) => {
    const zip = new JSZip();
    const exportPresets = presetsToExport || getPresetsToExport();
    // 1. Gather all referenced wallpaper URLs
    const allWallpapers = new Set();
    exportPresets.forEach(preset => {
      if (preset.data && preset.data.wallpaper && preset.data.wallpaper.url && preset.data.wallpaper.url.startsWith('userdata://wallpapers/')) {
        allWallpapers.add(preset.data.wallpaper.url);
      }
      if (preset.data && Array.isArray(preset.data.savedWallpapers)) {
        preset.data.savedWallpapers.forEach(wp => {
          if (wp.url && wp.url.startsWith('userdata://wallpapers/')) {
            allWallpapers.add(wp.url);
          }
        });
      }
    });
    // 2. Add preset JSON
    zip.file('presets.json', JSON.stringify(exportPresets, null, 2));
    // 3. Add wallpaper files
    for (const url of allWallpapers) {
      const result = await window.api.wallpapers.getFile(url);
      if (result.success) {
        zip.file(`wallpapers/${result.filename}`, result.data, { base64: true });
      }
    }
    // 4. Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportPresets.length === 1 ? `wiidesktop-preset-${exportPresets[0].name}.zip` : 'wiidesktop-presets.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import presets from file
  const handleImportClick = () => {
    setImportError('');
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    setImportError('');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid preset file format.');
        // Build overwrite map: default to overwrite if name exists
        const map = {};
        imported.forEach(preset => {
          if (preset && preset.name && presets.some(p => p.name === preset.name)) {
            map[preset.name] = true;
          }
        });
        setOverwriteMap(map);
        setImportedPresets(imported);
        setShowImportPreview(true);
      } catch (err) {
        setImportError('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Import presets from zip
  const handleImportZip = async (file) => {
    setImportError('');
    try {
      const zip = await JSZip.loadAsync(file);
      const jsonFile = zip.file('presets.json');
      if (!jsonFile) throw new Error('No presets.json found in zip');
      const jsonStr = await jsonFile.async('string');
      const imported = JSON.parse(jsonStr);
      // 1. Extract wallpapers
      const wallpaperFiles = zip.folder('wallpapers');
      const urlMap = {};
      if (wallpaperFiles) {
        const files = Object.values(wallpaperFiles.files || {});
        for (const fileObj of files) {
          if (!fileObj.dir) {
            const data = await fileObj.async('base64');
            const filename = fileObj.name.split('/').pop();
            const saveResult = await window.api.wallpapers.saveFile({ filename, data });
            if (saveResult.success) {
              urlMap[`userdata://wallpapers/${filename}`] = saveResult.url;
            }
          }
        }
      }
      // 2. Update preset JSON to use new URLs
      imported.forEach(preset => {
        if (preset.data && preset.data.wallpaper && urlMap[preset.data.wallpaper.url]) {
          preset.data.wallpaper.url = urlMap[preset.data.wallpaper.url];
        }
        if (preset.data && Array.isArray(preset.data.savedWallpapers)) {
          preset.data.savedWallpapers.forEach(wp => {
            if (urlMap[wp.url]) wp.url = urlMap[wp.url];
          });
        }
      });
      // 3. Continue with import preview as before
      // Build overwrite map: default to overwrite if name exists
      const map = {};
      imported.forEach(preset => {
        if (preset && preset.name && presets.some(p => p.name === preset.name)) {
          map[preset.name] = true;
        }
      });
      setOverwriteMap(map);
      setImportedPresets(imported);
      setShowImportPreview(true);
    } catch (err) {
      setImportError('Failed to import: ' + err.message);
    }
  };

  const handleToggleOverwrite = (name) => {
    setOverwriteMap(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Confirm import: replace or skip duplicates
  const handleConfirmImport = () => {
    if (importedPresets && Array.isArray(importedPresets)) {
      let updated = [...presets];
      importedPresets.forEach(preset => {
        if (preset && preset.name && preset.data) {
          const existsIdx = updated.findIndex(p => p.name === preset.name);
          if (existsIdx !== -1) {
            if (overwriteMap[preset.name]) {
              updated[existsIdx] = preset; // Overwrite
            } // else skip
          } else {
            updated.push(preset);
          }
        }
      });
      
      // Call the import handler with the processed presets
      if (onImportPresets) {
        onImportPresets(updated.slice(0, 6));
      }
      
      setShowImportPreview(false);
      setImportedPresets(null);
      setOverwriteMap({});
    }
  };

  const handleCancelImport = () => {
    setShowImportPreview(false);
    setImportedPresets(null);
    setOverwriteMap({});
  };

  const handleSave = () => {
    if (!newPresetName.trim()) {
      setError('Please enter a name for the preset.');
      return;
    }
    if (presets.some(p => p.name === newPresetName.trim())) {
      setError('A preset with this name already exists.');
      return;
    }
    console.log('[PresetsModal] Saving preset with includeChannels:', includeChannels, 'includeSounds:', includeSounds);
    onSavePreset(newPresetName.trim(), includeChannels, includeSounds);
    setNewPresetName('');
    setError('');
  };

  const handleUpdate = (name) => {
    console.log('[PresetsModal] Updating preset with includeChannels:', includeChannels, 'includeSounds:', includeSounds);
    onUpdatePreset(name, includeChannels, includeSounds);
    setJustUpdated(name);
    setTimeout(() => setJustUpdated(null), 1500);
  };

  const handleStartEdit = (preset) => {
    setEditingPreset(preset.name);
    setEditName(preset.name);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
    setEditName('');
    setEditError('');
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      setEditError('Please enter a name for the preset.');
      return;
    }
    if (presets.some(p => p.name === editName.trim() && p.name !== editingPreset)) {
      setEditError('A preset with this name already exists.');
      return;
    }
    if (onRenamePreset) {
      onRenamePreset(editingPreset, editName.trim());
    }
    setEditingPreset(null);
    setEditName('');
    setEditError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (preset) => {
    // For now, directly delete the preset
    // TODO: Implement proper confirmation dialog
    onDeletePreset(preset.name);
  };

  // Wrapper function to handle apply preset with proper modal closing
  const handleApplyPreset = (preset) => {
    // Call onApplyPreset (which will set showPresetsModal to false)
    onApplyPreset(preset);
  };

  // Checkbox toggle for export selection
  const handleToggleSelectPreset = (name) => {
    setSelectedPresets(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };
  const handleSelectAll = () => {
    setSelectedPresets(presets.map(p => p.name));
  };
  const handleDeselectAll = () => {
    setSelectedPresets([]);
  };

  // Community sharing handlers
  const handleSharePreset = (preset) => {
    setUploadFormData({
      name: preset.name,
      description: '',
      creator_name: '',
      selectedPreset: preset
    });
    setShowUploadForm(true);
    setUploadMessage({ type: '', text: '' });
  };

  const handleImportCommunityPreset = async (presetData) => {
    console.log('[PresetsModal] Importing community preset:', presetData);
    console.log('[PresetsModal] PresetData type:', typeof presetData, Array.isArray(presetData) ? 'array' : 'object');
    
    // Handle both single preset and array of presets
    const presetsToImport = Array.isArray(presetData) ? presetData : [presetData];
    
    for (let index = 0; index < presetsToImport.length; index++) {
      const preset = presetsToImport[index];
      console.log(`[PresetsModal] Processing preset ${index}:`, preset);
      console.log(`[PresetsModal] Preset has settings:`, !!preset.settings);
      console.log(`[PresetsModal] Settings keys:`, preset.settings ? Object.keys(preset.settings) : 'no settings');
      
      // Convert the downloaded preset structure to the expected format
      // Community presets have 'settings', local presets have 'data'
      // App.jsx handleApplyPreset expects preset.data.timeColor, not preset.settings.timeColor
      let presetSettings = {
        ...preset.settings,
      };
      
      // Check if this is using the old flat structure (properties at top level)
      const hasOldStructure = presetSettings.timeColor !== undefined ||
        presetSettings.enableTimePill !== undefined ||
        presetSettings.ribbonColor !== undefined ||
        presetSettings.glassWiiRibbon !== undefined ||
        presetSettings.wallpaperOpacity !== undefined;
      
      if (hasOldStructure) {
        console.log(`[PresetsModal] Converting old flat structure to new nested structure for preset ${index}`);
        
        // Convert old flat structure to new nested structure
        presetSettings = {
          time: {
            color: presetSettings.timeColor,
            enablePill: presetSettings.enableTimePill,
            pillBlur: presetSettings.timePillBlur,
            pillOpacity: presetSettings.timePillOpacity,
            font: presetSettings.timeFont
          },
          ribbon: {
            ribbonColor: presetSettings.ribbonColor,
            ribbonGlowColor: presetSettings.ribbonGlowColor,
            ribbonGlowStrength: presetSettings.ribbonGlowStrength,
            ribbonGlowStrengthHover: presetSettings.ribbonGlowStrengthHover,
            glassWiiRibbon: presetSettings.glassWiiRibbon,
            glassOpacity: presetSettings.glassOpacity,
            glassBlur: presetSettings.glassBlur,
            glassBorderOpacity: presetSettings.glassBorderOpacity,
            glassShineOpacity: presetSettings.glassShineOpacity,
            ribbonButtonConfigs: presetSettings.ribbonButtonConfigs,
            recentRibbonColors: presetSettings.recentRibbonColors,
            recentRibbonGlowColors: presetSettings.recentRibbonGlowColors
          },
          wallpaper: {
            current: presetSettings.wallpaper,
            opacity: presetSettings.wallpaperOpacity,
            blur: presetSettings.wallpaperBlur,
            cycleWallpapers: presetSettings.cycleWallpapers,
            cycleInterval: presetSettings.cycleInterval,
            cycleAnimation: presetSettings.cycleAnimation,
            savedWallpapers: presetSettings.savedWallpapers,
            likedWallpapers: presetSettings.likedWallpapers,
            slideDirection: presetSettings.slideDirection,
            slideDuration: presetSettings.slideDuration,
            slideEasing: presetSettings.slideEasing,
            slideRandomDirection: presetSettings.slideRandomDirection,
            crossfadeDuration: presetSettings.crossfadeDuration,
            crossfadeEasing: presetSettings.crossfadeEasing
          },
          ui: {
            presetsButtonConfig: presetSettings.presetsButtonConfig
          }
        };
      }
      
      // Handle wallpaper download and conversion
      if (preset.wallpaper && preset.wallpaper.data) {
        try {
          console.log(`[PresetsModal] Processing wallpaper for preset ${index}:`, preset.wallpaper);
          
          // Check if wallpaper data is properly structured
          if (preset.wallpaper.data && (preset.wallpaper.data instanceof ArrayBuffer || preset.wallpaper.data.byteLength > 0)) {
            console.log(`[PresetsModal] Wallpaper data is ArrayBuffer with size:`, preset.wallpaper.data.byteLength);
            
            // Convert ArrayBuffer to base64 string for the saveFile API
            const arrayBuffer = preset.wallpaper.data;
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
            const base64Data = btoa(binaryString);
            
            const fileName = preset.wallpaper.fileName || `community-wallpaper-${Date.now()}.jpg`;
            const mimeType = preset.wallpaper.mimeType || 'image/jpeg';
            
            console.log(`[PresetsModal] Converting wallpaper to base64, size:`, base64Data.length);
            
            // Save wallpaper to local storage
            if (window.api?.wallpapers?.saveFile) {
              const saveResult = await window.api.wallpapers.saveFile({
                filename: fileName,
                data: base64Data,
                mimeType: mimeType
              });
              
              if (saveResult.success) {
                console.log(`[PresetsModal] Wallpaper saved locally:`, saveResult.url);
                
                // Update wallpaper URL in settings to use local path
                if (presetSettings.wallpaper) {
                  presetSettings.wallpaper.url = saveResult.url;
                  presetSettings.wallpaper.name = fileName;
                }
                
                // Update savedWallpapers array if it exists
                if (presetSettings.savedWallpapers && Array.isArray(presetSettings.savedWallpapers)) {
                  presetSettings.savedWallpapers = presetSettings.savedWallpapers.map(wp => {
                    if (wp.url && wp.url.includes('userdata://wallpapers/')) {
                      // This is a local wallpaper reference, keep it
                      return wp;
                    } else {
                      // This might be a community wallpaper, we'll need to handle it
                      // For now, keep the original URL as fallback
                      return wp;
                    }
                  });
                }
              } else {
                console.warn(`[PresetsModal] Failed to save wallpaper locally:`, saveResult.error);
                // Fallback: keep the original wallpaper data
                presetSettings.wallpaper = preset.wallpaper;
              }
            } else {
              console.warn(`[PresetsModal] Wallpaper API not available, keeping original data`);
              presetSettings.wallpaper = preset.wallpaper;
            }
          } else {
            console.warn(`[PresetsModal] Wallpaper data is empty or invalid:`, preset.wallpaper.data);
            // If wallpaper data is empty, try to use the original wallpaper from settings
            if (presetSettings.wallpaper) {
              console.log(`[PresetsModal] Using original wallpaper from settings:`, presetSettings.wallpaper);
            } else {
              console.warn(`[PresetsModal] No wallpaper data available`);
            }
          }
        } catch (error) {
          console.error(`[PresetsModal] Error processing wallpaper for preset ${index}:`, error);
          // Fallback: keep the original wallpaper data
          presetSettings.wallpaper = preset.wallpaper;
        }
      } else {
        console.log(`[PresetsModal] No wallpaper data in preset ${index}`);
      }
      
      const convertedPreset = {
        name: preset.name,
        data: presetSettings, // Convert 'settings' to 'data' for compatibility with App.jsx handleApplyPreset
        timestamp: new Date().toISOString(),
        isCommunity: true,
        communityId: preset.id,
        communityRootId: preset.rootPresetId || preset.parentPresetId || preset.id,
        communityVersion: preset.version || 1
      };
      
      console.log(`[PresetsModal] Converted preset ${index} structure:`, convertedPreset);
      console.log(`[PresetsModal] Preset ${index} data structure check:`, {
        hasData: !!convertedPreset.data,
        hasTimeColor: !!convertedPreset.data?.time?.color,
        timeColorValue: convertedPreset.data?.time?.color,
        dataKeys: convertedPreset.data ? Object.keys(convertedPreset.data) : 'no data',
        hasWallpaper: !!convertedPreset.data?.wallpaper,
        wallpaperUrl: convertedPreset.data?.wallpaper?.url
      });
      
      if (onImportPresets) {
        onImportPresets(convertedPreset);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFormData.selectedPreset) {
      setUploadMessage({ type: 'error', text: 'Please select a preset to share' });
      return;
    }

    try {
      setUploading(true);
      setUploadMessage({ type: '', text: '' });

      console.log('[UPLOAD] Starting preset upload...');
      console.log('[UPLOAD] Selected preset:', uploadFormData.selectedPreset);
      console.log('[UPLOAD] Wallpaper URL:', uploadFormData.selectedPreset.data?.wallpaper?.url);
      console.log('[UPLOAD] Custom image:', uploadFormData.custom_image ? 'Present' : 'None');

      const warnings = [];
      const { file: wallpaperFile, warning: wallpaperWarning } = await resolveWallpaperFileForShare(uploadFormData.selectedPreset);
      if (wallpaperWarning) warnings.push(wallpaperWarning);
      const autoThumbnailDataUrl = uploadFormData.selectedPreset.thumbnailDataUrl || null;
      const { file: customImageFile, warning: customImageWarning } = resolveCustomImageFileForShare(
        uploadFormData.custom_image,
        autoThumbnailDataUrl
      );
      if (customImageWarning) warnings.push(customImageWarning);

      // Create preset data for new schema
      const presetData = {
        settings: uploadFormData.selectedPreset.data,
        wallpaper: wallpaperFile,
        customImage: customImageFile
      };

      console.log('[UPLOAD] Preset data created:', {
        hasSettings: !!presetData.settings,
        hasWallpaper: !!presetData.wallpaper,
        hasCustomImage: !!presetData.customImage,
        wallpaperSize: presetData.wallpaper?.size,
        customImageSize: presetData.customImage?.size
      });

      // Create form data for new schema
      const formData = {
        name: uploadFormData.name,
        description: uploadFormData.description,
        tags: parseTags(uploadFormData.tags),
        creator_name: uploadFormData.creator_name || 'Anonymous'
      };
      const sourceRootId =
        uploadFormData.selectedPreset.communityRootId ||
        uploadFormData.selectedPreset.communityId ||
        null
      if (sourceRootId) {
        formData.parent_preset_id = sourceRootId
      }

      console.log('[UPLOAD] Form data:', formData);
      console.log('[UPLOAD] Calling uploadPreset...');
      
      const result = await uploadPreset(presetData, formData);
      
      console.log('[UPLOAD] Upload result:', result);
      
      if (result) {
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
            selectedPreset: null
          });
          setUploadMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setUploadMessage({ type: 'error', text: 'Failed to upload preset' });
      }
    } catch (error) {
      console.error('[UPLOAD] Upload error:', error);
      setUploadMessage({ type: 'error', text: `Upload failed: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadInputChange = (field, value) => {
    setUploadFormData(prev => ({ ...prev, [field]: value }));
    if (uploadMessage.text) setUploadMessage({ type: '', text: '' });
  };

  // ✅ DATA LAYER: Memoize footerContent to prevent infinite loops
  const footerContent = useCallback(({ handleClose }) => (
    <div className="preset-modal-footer">
        <Button variant="secondary" onClick={handleClose}>Close</Button>
    </div>
  ), []);

  if (!isOpen) return null;

  return (
    <>
    <WBaseModal
        isOpen={isOpen}
      title="Save Presets"
      onClose={onClose}
        maxWidth="1400px"
      footerContent={footerContent}
    >
      {importError && <div className="text-red-600 mb-3">{importError}</div>}
     
      <Card className="preset-card-mb" title="Save Current as Preset" separator>
        <div className="wee-card-desc">
          <div className="preset-form-row">
            <input
              type="text"
              placeholder="Preset name"
              value={newPresetName}
              onChange={e => { setNewPresetName(e.target.value); setError(''); }}
              className={`preset-form-input ${presets.length >= 6 ? 'preset-form-input--dimmed' : ''}`}
              maxLength={32}
              
              
            />
                {/* tabIndex={presets.length >= 6 ? -1 : 0} */}
            <Button variant="primary" className="preset-btn-min" onClick={handleSave} disabled={presets.length >= 6}>
              Save Preset
            </Button>
          </div>
            
            {/* Include Channel Data Toggle */}
            <div className="preset-toggle-row">
              <WToggle
                  checked={includeChannels}
                onChange={setIncludeChannels}
                label="Include Channel Data"
              />
              <Text size="sm" color="hsl(var(--text-secondary))" className="preset-toggle-hint">
                Save channels, their media, and app paths for workspace switching
            </Text>
              </div>
            
            {/* Include Sound Settings Toggle */}
            <div className="preset-toggle-row preset-toggle-row--tight">
              <WToggle
                  checked={includeSounds}
                onChange={setIncludeSounds}
                label="Include Sound Settings"
              />
              <Text size="sm" color="hsl(var(--text-secondary))" className="preset-toggle-hint">
                Save sound library and audio preferences
            </Text>
              </div>
            
            {/* Help text for channel data feature */}
            {includeChannels && (
              <div className="preset-workspace-hint">
                <Text size="sm" color="hsl(var(--primary))" className="preset-workspace-hint-title">
                  🎯 Workspace Mode Enabled
                </Text>
                <Text size="sm" color="hsl(var(--text-secondary))">
                  This preset will save your current channels, apps, and settings. Perfect for switching between "Gaming" and "Work" workspaces. 
                  <strong>Note:</strong> Channel data is never included when sharing presets.
              </Text>
            </div>
            )}
            
          {error && <Text size="sm" className="preset-text-error">{error}</Text>}
            {presets.length >= 6 && <Text size="sm" color="hsl(var(--text-secondary))" className="preset-text-muted-mt">You can save up to 6 presets.</Text>}
        </div>
      </Card>
      <Card 
        className="preset-card-mb"
        title="Saved Presets" 
        separator
        desc={!selectMode ? "Drag presets by the ⋮⋮ handle to reorder them. Apply presets to change your appearance settings." : "Select presets to export them as a ZIP file."}
      >
          

          <hr className="preset-divider" />
        
         {showImportPreview && importedPresets && (
          <div className="import-preview-modal preset-import-preview">
          <h3>Preview Imported Presets</h3>
          <ul className="preset-import-list">
            {importedPresets.map((preset, idx) => {
              const exists = presets.some(p => p.name === preset.name);
              return (
                <li key={idx} className="preset-import-li">
                  <b>{preset.name}</b> {preset.data ? '' : <span className="preset-invalid">(Invalid)</span>}
                  {exists && (
                    <WToggle
                      checked={overwriteMap[preset.name]}
                      onChange={() => handleToggleOverwrite(preset.name)}
                      label="Overwrite existing"
                      containerClassName="preset-toggle-inline"
                    />
                  )}
                    {exists && !overwriteMap[preset.name] && <span className="preset-skip-hint">(Will skip)</span>}
                </li>
              );
            })}
          </ul>
            <Button variant="primary" onClick={handleConfirmImport} className="preset-btn-mr">Import</Button>
            <Button variant="secondary" onClick={handleCancelImport}>Cancel</Button>
        </div>
      )}
        
        <ul className="preset-list-plain">
          {presets.map((preset, idx) => {
            const isDragging = draggingPreset === preset.name;
            const isDropTarget = dropTarget === preset.name;
            const isSelected = selectMode && selectedPresets.includes(preset.name);
            
            return (
                <PresetListItem
              key={preset.name}
                  preset={preset}
                  isDragging={isDragging}
                  isDropTarget={isDropTarget}
                  isSelected={isSelected}
                  selectMode={selectMode}
                  editingPreset={editingPreset}
                  editName={editName}
                  justUpdated={justUpdated}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
              onDragEnd={handleDragEnd}
                  onToggleSelect={handleToggleSelectPreset}
                  onApply={handleApplyPreset}
                  onUpdate={handleUpdate}
                  onStartEdit={handleStartEdit}
                  onDelete={handleDeleteClick}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditNameChange={e => setEditName(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              );
            })}
          </ul>
        </Card>

        {/* Community Presets Section */}
        <Card 
          className="preset-card-mb"
          title="Community Presets" 
          separator
          desc="Browse and download presets shared by the community."
        >
          <div className="preset-community-actions">
            <Button 
              variant="secondary" 
              onClick={toggleCommunitySection}
              className="preset-btn-mr"
            >
              {showCommunitySection ? 'Hide Community' : 'Browse Community'}
            </Button>
            {presets.length > 0 && (
              <Button 
                variant="primary" 
                onClick={() => {
                  setUploadFormData({ 
                    name: '', 
                    description: '', 
                    creator_name: '', 
                    tags: '',
                    custom_image: null,
                    selectedPreset: null
                  });
                  setShowUploadForm(true);
                  setUploadMessage({ type: '', text: '' });
                }}
              >
                Share My Preset
              </Button>
            )}
          </div>

          {/* Upload Form Section */}
          {showUploadForm && (
            <Card className="preset-upload-card">
              {uploadMessage.text && (
                <div
                  className={`preset-upload-msg ${
                    uploadMessage.type === 'success' ? 'preset-upload-msg--success' : 'preset-upload-msg--error'
                  }`}
                >
                  {uploadMessage.text}
                </div>
              )}

              <div className="preset-field-block">
                <Text variant="label" className="preset-label-mb block">Select Preset to Share *</Text>
                <select
                  value={uploadFormData.selectedPreset ? uploadFormData.selectedPreset.name : ''}
                  onChange={(e) => {
                    const selectedPreset = presets.find(p => p.name === e.target.value);
                    setUploadFormData(prev => ({
                      ...prev,
                      name: selectedPreset ? selectedPreset.name : '',
                      selectedPreset: selectedPreset || null
                    }));
                  }}
                  className="preset-select"
                >
                  <option value="">Select a preset to share...</option>
                  {presets.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="preset-field-block">
                <Text variant="label" className="preset-label-mb block">Description</Text>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) => handleUploadInputChange('description', e.target.value)}
                  placeholder="Describe your preset..."
                  rows={3}
                  className="preset-textarea"
                />
              </div>

              <div className="preset-field-block">
                <Text variant="label" className="preset-label-mb block">Tags (Optional)</Text>
                <Text size="sm" color="hsl(var(--text-secondary))" className="preset-label-mb block">
                  Add tags to help others find your preset. Separate with commas.
                </Text>
                    <input
                      type="text"
                  value={uploadFormData.tags}
                  onChange={(e) => handleUploadInputChange('tags', e.target.value)}
                  placeholder="gaming, dark theme, minimal, etc."
                  className="preset-input-full"
                />
              </div>

              <div className="preset-field-block--lg">
                <Text variant="label" className="preset-label-mb block">Your Name (Optional)</Text>
                <input
                  type="text"
                  value={uploadFormData.creator_name}
                  onChange={(e) => handleUploadInputChange('creator_name', e.target.value)}
                  placeholder="Anonymous"
                  className="preset-input-full"
                />
              </div>

              <div className="preset-field-block--lg">
                <Text variant="label" className="preset-label-mb block">Custom Image (Optional)</Text>
                <Text size="sm" color="hsl(var(--text-secondary))" className="preset-label-mb block">
                  Upload a custom image to represent your preset. If not provided, a thumbnail will be auto-generated.
                </Text>
                <div className="preset-image-row">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          handleUploadInputChange('custom_image', reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="preset-hidden-input"
                    id="custom-image-upload"
                  />
                  <Button
                    variant="secondary"
                    className="preset-btn-flex"
                    onClick={() => document.getElementById('custom-image-upload').click()}
                  >
                    Choose Image
                    </Button>
                  {uploadFormData.custom_image && (
                    <Button
                      variant="secondary"
                      onClick={() => handleUploadInputChange('custom_image', null)}
                    >
                      Remove
                    </Button>
                )}
              </div>
                {uploadFormData.custom_image && (
                  <div className="preset-img-preview-wrap">
                    <img
                      src={uploadFormData.custom_image}
                      alt="Custom image preview"
                      className="preset-img-preview"
                    />
                  </div>
                )}
              </div>





              <div className="preset-form-actions">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadFormData({ name: '', description: '', creator_name: '', tags: '' });
                    setUploadMessage({ type: '', text: '' });
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleUpload} 
                  disabled={uploading || !uploadFormData.name.trim()}
                >
                  {uploading ? 'Uploading...' : 'Share Preset'}
                </Button>
              </div>
            </Card>
          )}

          {showCommunitySection && (
            <CommunityPresets 
              onImportPreset={handleImportCommunityPreset}
              onClose={() => toggleCommunitySection()}
            />
          )}
      </Card>
     
    </WBaseModal>
    </>
  );
}

PresetsModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  presets: PropTypes.array.isRequired,
  onSavePreset: PropTypes.func.isRequired, // (name: string, includeChannels: boolean, includeSounds: boolean) => void
  onDeletePreset: PropTypes.func.isRequired, // (name: string) => void
  onApplyPreset: PropTypes.func.isRequired, // (preset: Preset) => void
  onUpdatePreset: PropTypes.func.isRequired, // (name: string, includeChannels: boolean, includeSounds: boolean) => void
  onRenamePreset: PropTypes.func.isRequired, // (oldName: string, newName: string) => void
  onImportPresets: PropTypes.func.isRequired, // (presets: Preset[]) => void
  onReorderPresets: PropTypes.func, // (reorderedPresets: Preset[]) => void
};

export default PresetsModal; 