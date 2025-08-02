import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import './BaseModal.css';
import JSZip from 'jszip';
import Button from '../ui/WButton';
import '../styles/design-system.css';
import Text from '../ui/Text';
import Card from '../ui/Card';
import PresetListItem from './PresetListItem';
import Toggle from '../ui/Toggle';
import CommunityPresets from './CommunityPresets';
import useUIStore from '../utils/useUIStore';
import { uploadPreset } from '../utils/supabase';

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
  const handleCloseRef = useRef(null); // ref to store WBaseModal's handleClose function
  const [draggingPreset, setDraggingPreset] = useState(null); // name of preset being dragged
  const [dropTarget, setDropTarget] = useState(null); // name of preset being hovered over for drop
  
  // Get Zustand store state and actions
  const { 
    showCommunitySection, 
    toggleCommunitySection,
    confirmDelete
  } = useUIStore();
  
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
    confirmDelete(
      preset.name,
      () => onDeletePreset(preset.name)
    );
  };

  // Wrapper function to handle apply preset with proper modal closing
  const handleApplyPreset = (preset) => {
    // Call onApplyPreset (which will set showPresetsModal to false)
    onApplyPreset(preset);
    
            // Use WBaseModal's handleClose for proper fade-out
    if (handleCloseRef.current) {
      handleCloseRef.current();
    }
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
    setIncludeChannelsUpload(false);
    setIncludeSoundsUpload(false);
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
        communityId: preset.id
      };
      
      console.log(`[PresetsModal] Converted preset ${index} structure:`, convertedPreset);
      console.log(`[PresetsModal] Preset ${index} data structure check:`, {
        hasData: !!convertedPreset.data,
        hasTimeColor: !!convertedPreset.data?.timeColor,
        timeColorValue: convertedPreset.data?.timeColor,
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

      // Get current wallpaper if it exists
      let wallpaperFile = null;
      if (uploadFormData.selectedPreset.data?.wallpaper?.url) {
        try {
          console.log('[UPLOAD] Processing wallpaper...');
          // For local wallpaper URLs, we need to get the file data from the filesystem
          if (uploadFormData.selectedPreset.data.wallpaper.url.startsWith('userdata://')) {
            console.log('[UPLOAD] Getting local wallpaper file...');
            // Use Electron API to get the file data
            const wallpaperResult = await window.api.wallpapers.getFile(uploadFormData.selectedPreset.data.wallpaper.url);
            console.log('[UPLOAD] Wallpaper result:', wallpaperResult);
            if (wallpaperResult.success) {
              // Convert base64 data to File object
              const binaryString = atob(wallpaperResult.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              wallpaperFile = new File([bytes], wallpaperResult.filename, { 
                type: uploadFormData.selectedPreset.data.wallpaper.mimeType || 'image/jpeg' 
              });
              console.log('[UPLOAD] Created wallpaper file:', wallpaperFile.name, wallpaperFile.size);
            }
          } else {
            console.log('[UPLOAD] Getting external wallpaper...');
            // For external URLs, try to fetch
            const response = await fetch(uploadFormData.selectedPreset.data.wallpaper.url);
            const blob = await response.blob();
            wallpaperFile = new File([blob], 'wallpaper.jpg', { type: 'image/jpeg' });
            console.log('[UPLOAD] Created external wallpaper file:', wallpaperFile.name, wallpaperFile.size);
          }
        } catch (error) {
          console.warn('[UPLOAD] Could not load wallpaper for upload:', error);
        }
      } else {
        console.log('[UPLOAD] No wallpaper found in preset');
      }

      // Process custom image if provided
      let customImageFile = null;
      if (uploadFormData.custom_image) {
        try {
          console.log('[UPLOAD] Processing custom image...');
          // Convert base64 to File object
          const base64Data = uploadFormData.custom_image.split(',')[1]; // Remove data URL prefix
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          customImageFile = new File([bytes], 'custom-display.jpg', { type: 'image/jpeg' });
          console.log('[UPLOAD] Created custom image file:', customImageFile.name, customImageFile.size);
        } catch (error) {
          console.warn('[UPLOAD] Could not process custom image:', error);
        }
      } else {
        console.log('[UPLOAD] No custom image provided');
      }

      // Create preset data for new schema
      const presetData = {
        settings: uploadFormData.selectedPreset.data,
        wallpaper: wallpaperFile,
        customImage: customImageFile
      };

      // CRITICAL: Remove channel data from shared presets for security and compatibility
      if (presetData.settings) {
        // Remove all channel-related data
        delete presetData.settings.channels;
        delete presetData.settings.mediaMap;
        delete presetData.settings.appPathMap;
        delete presetData.settings.channelData;
        
        // Also remove sound library data for security
        delete presetData.settings.soundLibrary;
      }

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
        tags: uploadFormData.tags ? uploadFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        creator_name: uploadFormData.creator_name || 'Anonymous'
      };

      console.log('[UPLOAD] Form data:', formData);
      console.log('[UPLOAD] Calling uploadPreset...');
      
      const result = await uploadPreset(presetData, formData);
      
      console.log('[UPLOAD] Upload result:', result);
      
      if (result) {
        setUploadMessage({ type: 'success', text: 'Preset uploaded successfully!' });
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

  if (!isOpen) return null;

  return (
    <>
    <WBaseModal
        isOpen={isOpen}
      title="Save Presets"
      onClose={onClose}
        maxWidth="980px"
      footerContent={({ handleClose }) => {
        handleCloseRef.current = handleClose;
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="secondary" onClick={handleClose}>Close</Button>
          </div>
        );
      }}
    >
      {importError && <div style={{ color: 'red', marginBottom: 12 }}>{importError}</div>}
     
      <Card style={{ marginBottom: 18 }} title="Save Current as Preset" separator>
        <div className="wee-card-desc">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              placeholder="Preset name"
              value={newPresetName}
              onChange={e => { setNewPresetName(e.target.value); setError(''); }}
              style={{ 
                flex: 1, 
                padding: 8, 
                borderRadius: 6, 
                  border: '1.5px solid hsl(var(--border-primary))', 
                fontSize: 15, 
                  background: 'hsl(var(--surface-primary))', 
                  color: 'hsl(var(--text-primary))',
              
                opacity: presets.length >= 6 ? 0.6 : 1
              }}
              maxLength={32}
              
              
            />
                {/* tabIndex={presets.length >= 6 ? -1 : 0} */}
            <Button variant="primary" style={{ minWidth: 90 }} onClick={handleSave} disabled={presets.length >= 6}>
              Save Preset
            </Button>
          </div>
            
            {/* Include Channel Data Toggle */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Toggle
                  checked={includeChannels}
                onChange={setIncludeChannels}
                label="Include Channel Data"
              />
              <Text size="sm" color="hsl(var(--text-secondary))" style={{ marginLeft: 8 }}>
                Save channels, their media, and app paths for workspace switching
            </Text>
              </div>
            
            {/* Help text for channel data feature */}
            {includeChannels && (
              <div style={{ 
                marginTop: 8, 
                padding: 8, 
                background: 'hsl(var(--primary) / 0.1)', 
                border: '1px solid hsl(var(--primary) / 0.2)', 
                borderRadius: 6,
                fontSize: 12
              }}>
                <Text size="sm" color="hsl(var(--primary))" style={{ fontWeight: 500, marginBottom: 4 }}>
                  🎯 Workspace Mode Enabled
                </Text>
                <Text size="sm" color="hsl(var(--text-secondary))">
                  This preset will save your current channels, apps, and settings. Perfect for switching between "Gaming" and "Work" workspaces. 
                  <strong>Note:</strong> Channel data is never included when sharing presets.
              </Text>
            </div>
            )}
            
          {error && <Text size="sm" color={"#dc3545"} style={{ marginTop: 6 }}>{error}</Text>}
            {presets.length >= 6 && <Text size="sm" color="hsl(var(--text-secondary))" style={{ marginTop: 6 }}>You can save up to 6 presets.</Text>}
        </div>
      </Card>
      <Card 
        style={{ marginBottom: 18 }} 
        title="Saved Presets" 
        separator
        desc={!selectMode ? "Drag presets by the ⋮⋮ handle to reorder them. Apply presets to change your appearance settings." : "Select presets to export them as a ZIP file."}
      >
          

          <hr style={{ border: 'none', borderTop: '1.5px solid hsl(var(--border-primary))', margin: '10px 0 18px 0' }} />
        
         {showImportPreview && importedPresets && (
          <div className="import-preview-modal" style={{ background: 'hsl(var(--surface-secondary))', border: '1.5px solid hsl(var(--wii-blue))', borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3>Preview Imported Presets</h3>
          <ul style={{ textAlign: 'left', margin: '12px 0 18px 0' }}>
            {importedPresets.map((preset, idx) => {
              const exists = presets.some(p => p.name === preset.name);
              return (
                <li key={idx} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <b>{preset.name}</b> {preset.data ? '' : <span style={{ color: 'red' }}>(Invalid)</span>}
                  {exists && (
                      <label style={{ fontSize: 13, color: 'hsl(var(--wii-blue))', marginLeft: 8, cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={overwriteMap[preset.name]}
                        onChange={() => handleToggleOverwrite(preset.name)}
                        style={{ marginRight: 4 }}
                      />
                      Overwrite existing
                    </label>
                  )}
                    {exists && !overwriteMap[preset.name] && <span style={{ color: 'hsl(var(--text-secondary))', fontSize: 13 }}>(Will skip)</span>}
                </li>
              );
            })}
          </ul>
            <Button variant="primary" onClick={handleConfirmImport} style={{ marginRight: 12 }}>Import</Button>
            <Button variant="secondary" onClick={handleCancelImport}>Cancel</Button>
        </div>
      )}
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 0 }}>
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
          style={{ marginBottom: 18 }} 
          title="Community Presets" 
          separator
          desc="Browse and download presets shared by the community."
        >
          <div style={{ marginBottom: '16px' }}>
            <Button 
              variant="secondary" 
              onClick={toggleCommunitySection}
              style={{ marginRight: '12px' }}
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
            <Card style={{ marginBottom: '16px', padding: '16px' }}>
              {uploadMessage.text && (
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginBottom: '16px',
                  background: uploadMessage.type === 'success' ? 'hsl(var(--success-light))' : 'hsl(var(--error-light))',
                  color: uploadMessage.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--error))',
                  border: `1px solid ${uploadMessage.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--error))'}`
                }}>
                  {uploadMessage.text}
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <Text variant="label" style={{ marginBottom: '8px' }}>Select Preset to Share *</Text>
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
                    style={{ 
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid hsl(var(--border-primary))',
                    borderRadius: '6px',
                    background: 'hsl(var(--surface-primary))',
                    color: 'hsl(var(--text-primary))'
                  }}
                >
                  <option value="">Select a preset to share...</option>
                  {presets.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <Text variant="label" style={{ marginBottom: '8px' }}>Description</Text>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) => handleUploadInputChange('description', e.target.value)}
                  placeholder="Describe your preset..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid hsl(var(--border-primary))',
                    borderRadius: '6px',
                    background: 'hsl(var(--surface-primary))',
                    color: 'hsl(var(--text-primary))',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <Text variant="label" style={{ marginBottom: '8px' }}>Tags (Optional)</Text>
                <Text size="sm" color="hsl(var(--text-secondary))" style={{ marginBottom: '8px' }}>
                  Add tags to help others find your preset. Separate with commas.
                </Text>
                    <input
                      type="text"
                  value={uploadFormData.tags}
                  onChange={(e) => handleUploadInputChange('tags', e.target.value)}
                  placeholder="gaming, dark theme, minimal, etc."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid hsl(var(--border-primary))',
                    borderRadius: '6px',
                    background: 'hsl(var(--surface-primary))',
                    color: 'hsl(var(--text-primary))'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text variant="label" style={{ marginBottom: '8px' }}>Your Name (Optional)</Text>
                <input
                  type="text"
                  value={uploadFormData.creator_name}
                  onChange={(e) => handleUploadInputChange('creator_name', e.target.value)}
                  placeholder="Anonymous"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid hsl(var(--border-primary))',
                    borderRadius: '6px',
                    background: 'hsl(var(--surface-primary))',
                    color: 'hsl(var(--text-primary))'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text variant="label" style={{ marginBottom: '8px' }}>Custom Image (Optional)</Text>
                <Text size="sm" color="hsl(var(--text-secondary))" style={{ marginBottom: '8px' }}>
                  Upload a custom image to represent your preset. If not provided, a thumbnail will be auto-generated.
                </Text>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                    style={{ display: 'none' }}
                    id="custom-image-upload"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => document.getElementById('custom-image-upload').click()}
                    style={{ flex: 1 }}
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
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={uploadFormData.custom_image}
                      alt="Custom image preview"
                      style={{
                        width: '100px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid hsl(var(--border-primary))'
                      }}
                    />
                  </div>
                )}
              </div>





              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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