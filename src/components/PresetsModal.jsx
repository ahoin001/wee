import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';
import JSZip from 'jszip';
import Button from '../ui/Button';
import '../styles/design-system.css';
import Text from '../ui/Text';
import Card from '../ui/Card';
import { GITHUB_CONFIG, getContentsUrl, getFileUrl, testGitHubConnection } from '../config/github-presets';

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
  const handleCloseRef = useRef(null); // ref to store BaseModal's handleClose function
  const [draggingPreset, setDraggingPreset] = useState(null); // name of preset being dragged
  const [dropTarget, setDropTarget] = useState(null); // name of preset being hovered over for drop

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
    onSavePreset(newPresetName.trim(), includeChannels, includeSounds);
    setNewPresetName('');
    setError('');
  };

  const handleUpdate = (name) => {
    onUpdatePreset(name);
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

  // Wrapper function to handle apply preset with proper modal closing
  const handleApplyPreset = (preset) => {
    // Call onApplyPreset (which will set showPresetsModal to false)
    onApplyPreset(preset);
    
    // Use BaseModal's handleClose for proper fade-out
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

  // Community presets state
  const [communityPresets, setCommunityPresets] = useState([
    // Sample community presets for demonstration
    {
      name: 'Retro Gaming Setup',
      description: 'A nostalgic gaming theme with retro colors and classic gaming icons. Perfect for gamers who love the old-school aesthetic.',
      tags: 'retro, gaming, classic, red',
      author: 'GameMaster',
      createdAt: '2024-01-15T10:30:00Z',
      downloads: 127,
      rating: 4.8,
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZmY2YjZiIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuOSIvPgo8dGV4dCB4PSIyMDAiIHk9IjE2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5HYW1pbmcgU2V0dXANCjwvdGV4dD4KPC9zdmc+',
      presetData: null
    },
    {
      name: 'Minimalist Blue',
      description: 'Clean and minimal design with a calming blue color scheme. Great for productivity and focus.',
      tags: 'minimal, blue, clean, productivity',
      author: 'DesignPro',
      createdAt: '2024-01-10T14:20:00Z',
      downloads: 89,
      rating: 4.6,
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMDA5OWZmIi8+CjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuOSIvPgo8dGV4dCB4PSIyMDAiIHk9IjE2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMDA5OWZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NaW5pbWFsaXN0DQo8L3RleHQ+Cjwvc3ZnPg==',
      presetData: null
    },
    {
      name: 'Dark Mode Pro',
      description: 'Professional dark theme with high contrast and easy on the eyes. Perfect for late-night computing.',
      tags: 'dark, professional, contrast, night',
      author: 'NightCoder',
      createdAt: '2024-01-08T22:15:00Z',
      downloads: 156,
      rating: 4.9,
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjIyMjIyIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiMzMzMzMzMiLz4KPHRleHQgeD0iMjAwIiB5PSIxNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RGFyayBNb2RlDQo8L3RleHQ+Cjwvc3ZnPg==',
      presetData: null
    }
  ]);
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [communityLoading, setCommunityLoading] = useState(false);
  const [uploadingPreset, setUploadingPreset] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    tags: '',
    author: '',
    isPublic: true
  });

  // Generate thumbnail from current app state
  const generateThumbnail = async () => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 300;

      // Get current app state for thumbnail generation
      const currentSettings = await window.api.settings.get();
      
      // Draw background (wallpaper or theme color)
      if (currentSettings.wallpaper && currentSettings.wallpaper.url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = currentSettings.wallpaper.url;
        });
        
        // Draw and scale the wallpaper
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      } else {
        // Use theme color as background
        const themeColor = currentSettings.theme?.primaryColor || '#0099ff';
        ctx.fillStyle = themeColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Add overlay with preset info
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('WiiDesktop Preset', canvas.width / 2, canvas.height - 50);
      
      ctx.font = '14px Arial';
      ctx.fillText('Click to preview', canvas.width / 2, canvas.height - 25);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  };

  // Upload to community with real backend
  const handleUploadToCommunity = async () => {
    if (!uploadFormData.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a preset name.' });
      return;
    }

    setUploadingPreset(true);
    setMessage({ type: 'info', text: 'Generating thumbnail and uploading...' });

    try {
      // Generate thumbnail
      const thumbnail = await generateThumbnail();
      
      // Create preset data
      const presetData = {
        name: uploadFormData.name,
        description: uploadFormData.description || '',
        tags: uploadFormData.tags || '',
        author: uploadFormData.author || 'Anonymous',
        public: uploadFormData.public !== false,
        createdAt: new Date().toISOString(),
        downloads: 0,
        rating: 0,
        thumbnail: thumbnail,
        presetData: await getCurrentPresetData() // Get current app state
      };

      // Upload to backend (choose one implementation)
      const uploadResult = await uploadPresetToBackend(presetData);
      
      if (uploadResult.success) {
        setMessage({ type: 'success', text: 'Preset uploaded successfully!' });
        setShowUploadForm(false);
        setUploadFormData({ name: '', description: '', tags: '', author: '', public: true });
        
        // Refresh community presets
        await loadCommunityPresets();
      } else {
        setMessage({ type: 'error', text: uploadResult.error || 'Upload failed.' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Upload failed: ' + error.message });
    } finally {
      setUploadingPreset(false);
    }
  };

  // Get current app state as preset data
  const getCurrentPresetData = async () => {
    try {
      // Get current settings and channel configurations
      const currentSettings = await window.api.settings.get();
      const channelsData = await window.api.channels.get();
      
      return {
        settings: currentSettings,
        channels: channelsData.channels || [],
        version: '2.7.0', // App version for compatibility
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to get current preset data:', error);
      return null;
    }
  };

  // Upload to backend (implement one of these methods)
  const uploadPresetToBackend = async (presetData) => {
    // Option 1: GitHub-based sharing
    return await uploadToGitHub(presetData);
    
    // Option 2: Firebase backend
    // return await uploadToFirebase(presetData);
    
    // Option 3: Custom API
    // return await uploadToCustomAPI(presetData);
  };

  // GitHub-based sharing implementation
  const uploadToGitHub = async (presetData) => {
    try {
      // Check if GitHub token is configured
      if (!GITHUB_CONFIG.TOKEN || GITHUB_CONFIG.TOKEN === 'your_github_token_here') {
        return { 
          success: false, 
          error: 'GitHub token not configured. Please update src/config/github-presets.js with your token.' 
        };
      }

      // Create unique filename
      const timestamp = Date.now();
      const safeName = presetData.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeName}_${timestamp}.json`;

      const response = await fetch(getContentsUrl(), {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'WiiDesktop-Launcher'
        },
        body: JSON.stringify({
          message: `Add preset: ${presetData.name}`,
          content: btoa(JSON.stringify(presetData)),
          branch: GITHUB_CONFIG.BRANCH
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Preset uploaded successfully:', result);
        return { success: true, id: filename };
      } else {
        const error = await response.json();
        console.error('GitHub upload error:', error);
        return { success: false, error: error.message || 'Upload failed' };
      }
    } catch (error) {
      console.error('GitHub upload exception:', error);
      return { success: false, error: error.message };
    }
  };

  // Firebase implementation (example)
  const uploadToFirebase = async (presetData) => {
    try {
      // This would require Firebase setup
      const docRef = await addDoc(collection(db, 'presets'), {
        ...presetData,
        createdAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Custom API implementation (example)
  const uploadToCustomAPI = async (presetData) => {
    try {
      const response = await fetch('https://your-api.com/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presetData)
      });
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, id: result.id };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Load community presets from backend
  const loadCommunityPresets = async () => {
    setCommunityLoading(true);
    try {
      // Load from backend (implement one method)
      const presets = await loadPresetsFromBackend();
      setCommunityPresets(presets);
    } catch (error) {
      console.error('Failed to load community presets:', error);
      setMessage({ type: 'error', text: 'Failed to load community presets.' });
    } finally {
      setCommunityLoading(false);
    }
  };

  // Load presets from backend (implement one of these)
  const loadPresetsFromBackend = async () => {
    // Option 1: GitHub-based loading
    return await loadFromGitHub();
    
    // Option 2: Firebase loading
    // return await loadFromFirebase();
    
    // Option 3: Custom API loading
    // return await loadFromCustomAPI();
  };

  // GitHub-based loading
  const loadFromGitHub = async () => {
    try {
      const response = await fetch(getContentsUrl(), {
        headers: {
          'User-Agent': 'WiiDesktop-Launcher'
        }
      });
      
      if (response.ok) {
        const files = await response.json();
        const presetFiles = files.filter(file => file.name.endsWith('.json'));
        
        console.log(`Found ${presetFiles.length} preset files on GitHub`);
        
        const presets = [];
        for (const file of presetFiles) {
          try {
            const contentResponse = await fetch(file.download_url);
            if (contentResponse.ok) {
              const presetData = await contentResponse.json();
              presets.push(presetData);
            }
          } catch (fileError) {
            console.error(`Failed to load preset file ${file.name}:`, fileError);
          }
        }
        
        console.log(`Successfully loaded ${presets.length} presets from GitHub`);
        return presets;
      }
      return [];
    } catch (error) {
      console.error('Failed to load from GitHub:', error);
      return [];
    }
  };

  // Download and install community preset
  const handleDownloadCommunityPreset = async (preset) => {
    try {
      setMessage({ type: 'info', text: 'Downloading preset...' });
      
      // Download from backend (implement one method)
      const downloadedPreset = await downloadPresetFromBackend(preset.id);
      
      if (downloadedPreset) {
        // Migrate the preset data for compatibility
        const migratedData = migratePresetData(downloadedPreset.presetData);
        
        const newPreset = {
          name: preset.name,
          data: migratedData
        };
        
        // Add to local presets
        if (onImportPresets) {
          onImportPresets([...presets, newPreset]);
        }
        
        // Update download count on backend
        await updateDownloadCount(preset.id);
        
        // Show migration notification if changes were made
        if (JSON.stringify(downloadedPreset.presetData) !== JSON.stringify(migratedData)) {
          setMessage({ 
            type: 'success', 
            text: 'Preset installed successfully with compatibility updates!' 
          });
        } else {
          setMessage({ type: 'success', text: 'Preset installed successfully!' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to download preset data.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download preset: ' + error.message });
    }
  };

  // Download preset from backend (implement one of these)
  const downloadPresetFromBackend = async (presetId) => {
    // Option 1: GitHub-based download
    return await downloadFromGitHub(presetId);
    
    // Option 2: Firebase download
    // return await downloadFromFirebase(presetId);
    
    // Option 3: Custom API download
    // return await downloadFromCustomAPI(presetId);
  };

  // GitHub-based download
  const downloadFromGitHub = async (presetId) => {
    try {
      const response = await fetch(getFileUrl(presetId), {
        headers: {
          'User-Agent': 'WiiDesktop-Launcher'
        }
      });
      
      if (response.ok) {
        const fileData = await response.json();
        const contentResponse = await fetch(fileData.download_url);
        if (contentResponse.ok) {
          return await contentResponse.json();
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to download from GitHub:', error);
      return null;
    }
  };

  // Update download count on backend
  const updateDownloadCount = async (presetId) => {
    try {
      // This would update the download count on the backend
      // Implementation depends on the chosen backend
      console.log('Updating download count for preset:', presetId);
    } catch (error) {
      console.error('Failed to update download count:', error);
    }
  };

  // Preset compatibility migration function
  const migratePresetData = (presetData) => {
    if (!presetData) return presetData;
    
    const migrated = { ...presetData };
    
    // Ensure channel sizing compatibility
    if (migrated.channels) {
      migrated.channels = migrated.channels.map(channel => {
        const migratedChannel = { ...channel };
        
        // Ensure minimum channel size properties exist
        if (!migratedChannel.minWidth) {
          migratedChannel.minWidth = 460;
        }
        if (!migratedChannel.minHeight) {
          migratedChannel.minHeight = 215;
        }
        if (!migratedChannel.aspectRatio) {
          migratedChannel.aspectRatio = '2.14 / 1';
        }
        
        // Migrate old sizing if present
        if (migratedChannel.width && migratedChannel.width < 460) {
          migratedChannel.minWidth = 460;
          console.log(`[Preset Migration] Upgraded channel width from ${migratedChannel.width} to 460px`);
        }
        if (migratedChannel.height && migratedChannel.height < 215) {
          migratedChannel.minHeight = 215;
          console.log(`[Preset Migration] Upgraded channel height from ${migratedChannel.height} to 215px`);
        }
        
        return migratedChannel;
      });
    }
    
    // Ensure settings compatibility
    if (migrated.settings) {
      // Add missing settings with defaults
      if (migrated.settings.channelSizing === undefined) {
        migrated.settings.channelSizing = {
          minWidth: 460,
          minHeight: 215,
          aspectRatio: '2.14 / 1',
          responsive: true
        };
      }
      
      // Migrate old channel sizing settings
      if (migrated.settings.channelMinWidth && migrated.settings.channelMinWidth < 460) {
        migrated.settings.channelSizing.minWidth = 460;
        console.log(`[Preset Migration] Upgraded global channel min-width from ${migrated.settings.channelMinWidth} to 460px`);
      }
      if (migrated.settings.channelMinHeight && migrated.settings.channelMinHeight < 215) {
        migrated.settings.channelSizing.minHeight = 215;
        console.log(`[Preset Migration] Upgraded global channel min-height from ${migrated.settings.channelMinHeight} to 215px`);
      }
    }
    
    return migrated;
  };

  // Apply preset with compatibility migration
  const handleApplyPresetWithMigration = (preset) => {
    console.log('[Preset Migration] Applying preset:', preset.name);
    
    // Migrate the preset data
    const migratedData = migratePresetData(preset.data);
    
    // Create migrated preset
    const migratedPreset = {
      ...preset,
      data: migratedData
    };
    
    // Apply the migrated preset
    handleApplyPreset(migratedPreset);
    
    // Show migration notification if changes were made
    if (JSON.stringify(preset.data) !== JSON.stringify(migratedData)) {
      setMessage({ 
        type: 'success', 
        text: `Preset "${preset.name}" applied with compatibility updates for channel sizing.` 
      });
    }
  };

  // Load community presets when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCommunityPresets();
    }
  }, [isOpen]);

  // Test GitHub connection
  const handleTestGitHubConnection = async () => {
    setMessage({ type: 'info', text: 'Testing GitHub connection...' });
    const result = await testGitHubConnection();
    if (result.success) {
      setMessage({ type: 'success', text: 'GitHub connection successful!' });
    } else {
      setMessage({ type: 'error', text: 'GitHub connection failed: ' + result.error });
    }
  };

  // Filter community presets based on search
  const filteredCommunityPresets = communityPresets.filter(preset =>
    preset.name.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
    preset.description.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
    preset.tags.toLowerCase().includes(communitySearchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  // Add animation CSS (can be in a <style> tag or a CSS file, but for now inline for clarity)
  const presetPulseStyle = `
@keyframes presetPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 #0099ff44; }
  50% { transform: scale(1.06); box-shadow: 0 0 16px 4px #0099ff88; }
  100% { transform: scale(1); box-shadow: 0 0 0 0 #0099ff44; }
}
`;

  // Channel sizing compatibility notice
  const showChannelSizingNotice = () => {
    const hasOldPresets = presets.some(preset => {
      if (!preset.data?.channels) return false;
      return preset.data.channels.some(channel => 
        (channel.width && channel.width < 460) || 
        (channel.height && channel.height < 215) ||
        !channel.minWidth || !channel.minHeight
      );
    });

    if (hasOldPresets) {
      return (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: 8, 
          padding: 12, 
          marginBottom: 16,
          fontSize: 14,
          color: '#856404'
        }}>
          <strong>📏 Channel Sizing Update:</strong> Some of your presets were created with older channel sizing. 
          They will be automatically updated to use the new minimum size (460×215px) when applied. 
          This ensures consistent channel appearance across all presets.
        </div>
      );
    }
    return null;
  };

  return (
    <BaseModal
      title="Save Presets"
      onClose={onClose}
      maxWidth="720px"
      footerContent={({ handleClose }) => {
        handleCloseRef.current = handleClose;
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="cancel-button" onClick={handleClose}>Close</button>
          </div>
        );
      }}
    >
      {importError && <div style={{ color: 'red', marginBottom: 12 }}>{importError}</div>}
      
      {/* Channel sizing compatibility notice */}
      {showChannelSizingNotice()}
     
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
                border: '1.5px solid #bbb', 
                fontSize: 15, 
                background: '#fff', 
                color: '#222',
              
                opacity: presets.length >= 6 ? 0.6 : 1
              }}
              maxLength={32}
              
              tabIndex={presets.length >= 6 ? -1 : 0}
            />
            <Button variant="primary" style={{ minWidth: 90 }} onClick={handleSave} disabled={presets.length >= 6}>
              Save Preset
            </Button>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label className="toggle-switch" style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={includeChannels}
                  onChange={(e) => setIncludeChannels(e.target.checked)}
                />
                <span className="slider" />
              </label>
              <Text size="md" color="#666">Include channel data (apps and media)</Text>
            </div>
            <Text size="sm" color="#888" style={{ marginTop: 4, marginLeft: 0, display: 'block' }}>
              When enabled, this preset will also save your current channel apps and media files.
            </Text>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="toggle-switch" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={includeSounds}
                    onChange={(e) => setIncludeSounds(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
                <Text size="md" color="#666">Include sound settings (enabled sounds and volumes)</Text>
              </div>
              <Text size="sm" color="#888" style={{ marginTop: 4, marginLeft: 0, display: 'block' }}>
                When enabled, this preset will also save your current sound settings and volume levels.
              </Text>
            </div>
          </div>
          {error && <Text size="sm" color={"#dc3545"} style={{ marginTop: 6 }}>{error}</Text>}
          {presets.length >= 6 && <Text size="sm" color="#888" style={{ marginTop: 6 }}>You can save up to 6 presets.</Text>}
        </div>
      </Card>
      <Card 
        style={{ marginBottom: 18 }} 
        title="Saved Presets" 
        separator
        desc={!selectMode ? "Drag presets by the ⋮⋮ handle to reorder them. Apply presets to change your appearance settings." : "Select presets to export them as a ZIP file."}
      >
        {/* Import/Export controls now above the preset list */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 18 }}>
          <Button variant="secondary" onClick={handleImportClick}>
            Import
          </Button>
          <Button variant="primary" onClick={() => { setSelectMode(true); setSelectedPresets([]); }}>
            Export
          </Button>
          <input
            type="file"
            accept=".json,.zip,application/json,application/zip"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              if (file.name.endsWith('.zip')) {
                handleImportZip(file);
              } else {
                handleFileChange(e);
              }
            }}
          />
        </div>
        {selectMode && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, justifyContent: 'flex-end' }}>
            <Text size="md" weight={500} style={{ color: '#222', marginRight: 'auto' }}>
              Click presets to select for export
            </Text>
            <Button variant="primary" onClick={() => { handleExportZip(getPresetsToExport()); setSelectMode(false); }} disabled={selectedPresets.length === 0}>
              Export Selected
            </Button>
            <Button variant="secondary" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="secondary" onClick={handleDeselectAll}>
              Deselect All
            </Button>
            <Button variant="tertiary" onClick={() => { setSelectMode(false); setSelectedPresets([]); }}>
              Cancel
            </Button>
          </div>
        )}
        <hr style={{ border: 'none', borderTop: '1.5px solid #e0e6ef', margin: '0 0 18px 0' }} />
        
         {showImportPreview && importedPresets && (
        <div className="import-preview-modal" style={{ background: '#f7fafd', border: '1.5px solid #0099ff', borderRadius: 12, padding: 24, marginBottom: 18 }}>
          <h3>Preview Imported Presets</h3>
          <ul style={{ textAlign: 'left', margin: '12px 0 18px 0' }}>
            {importedPresets.map((preset, idx) => {
              const exists = presets.some(p => p.name === preset.name);
              return (
                <li key={idx} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <b>{preset.name}</b> {preset.data ? '' : <span style={{ color: 'red' }}>(Invalid)</span>}
                  {exists && (
                    <label style={{ fontSize: 13, color: '#0099ff', marginLeft: 8, cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={overwriteMap[preset.name]}
                        onChange={() => handleToggleOverwrite(preset.name)}
                        style={{ marginRight: 4 }}
                      />
                      Overwrite existing
                    </label>
                  )}
                  {exists && !overwriteMap[preset.name] && <span style={{ color: '#888', fontSize: 13 }}>(Will skip)</span>}
                </li>
              );
            })}
          </ul>
          <button onClick={handleConfirmImport} style={{ marginRight: 12, padding: '8px 24px', borderRadius: 8, background: '#0099ff', color: 'white', fontWeight: 600 }}>Import</button>
          <button onClick={handleCancelImport} style={{ padding: '8px 24px', borderRadius: 8 }}>Cancel</button>
        </div>
      )}
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 0 }}>
          {presets.map((preset, idx) => {
            const isDragging = draggingPreset === preset.name;
            const isDropTarget = dropTarget === preset.name;
            const isSelected = selectMode && selectedPresets.includes(preset.name);
            
            return (
            <li
              key={preset.name}
              className={isSelected ? 'pulse-blue' : ''}
              draggable={!selectMode}
              onDragStart={(e) => handleDragStart(e, preset.name)}
              onDragOver={(e) => handleDragOver(e, preset.name)}
              onDragEnter={(e) => handleDragEnter(e, preset.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, preset.name)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex', alignItems: 'center', marginBottom: 10, padding: '12px 24px', borderBottom: '1px solid #f0f0f0',
                cursor: selectMode ? 'pointer' : (isDragging ? 'grabbing' : 'grab'),
                background: isSelected ? '#e6f3ff' : (isDropTarget ? '#f0f9ff' : '#fff'),
                borderRadius: isSelected ? 10 : 8,
                boxShadow: !selectMode || !isSelected
                  ? '0 1.5px 6px #0099ff08'
                  : undefined,
                border: !selectMode || !isSelected
                  ? (isDropTarget ? '2px solid #0099ff' : '1.5px solid #e0e6ef')
                  : undefined,
                transition: 'background 0.2s, box-shadow 0.2s, border 0.2s, transform 0.2s',
                opacity: isDragging ? 0.5 : 1,
                transform: isDragging ? 'scale(0.98)' : (isDropTarget ? 'scale(1.02)' : 'scale(1)'),
              }}
              onClick={selectMode ? () => handleToggleSelectPreset(preset.name) : undefined}
            >
              {/* Title left, buttons right */}
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {!selectMode && (
                  <span 
                    style={{ 
                      fontSize: 14, 
                      color: '#999', 
                      marginRight: 8, 
                      cursor: 'grab',
                      userSelect: 'none'
                    }}
                    title="Drag to reorder"
                  >
                    ⋮⋮
                  </span>
                )}
                <span style={{ fontWeight: 500, textAlign: 'left', fontSize: 16 }}>{preset.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                {editingPreset === preset.name ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      style={{ fontSize: 16, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #ccc', marginRight: 8, flex: 1, background: '#fff', color: '#222' }}
                      autoFocus
                    />
                    <Button style={{ minWidth: 70, marginRight: 8 }} onClick={handleSaveEdit}>Save</Button>
                    <Button style={{ minWidth: 70 }} onClick={handleCancelEdit}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); handleApplyPresetWithMigration(preset); }}>Apply</Button>
                    <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); handleUpdate(preset.name); }}>
                      {justUpdated === preset.name ? 'Updated!' : 'Update'}
                    </Button>
                    <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); handleStartEdit(preset); }}>Rename</Button>
                    <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); onDeletePreset(preset.name); }}>Delete</Button>
                  </>
                )}
              </div>
            </li>
            );
          })}
        </ul>
      </Card>

      {/* Community Presets Card */}
      <Card 
        style={{ marginBottom: 18 }} 
        title="Community Presets" 
        separator
        desc="Discover and share presets with the community. Upload your own presets or download ones created by others."
      >
        {/* Community controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search community presets..."
              value={communitySearchQuery}
              onChange={(e) => setCommunitySearchQuery(e.target.value)}
              style={{ 
                padding: '8px 12px', 
                borderRadius: 6, 
                border: '1.5px solid #ddd', 
                fontSize: 14,
                minWidth: 250
              }}
            />
          </div>
          <Button variant="primary" onClick={() => setShowUploadForm(true)}>
            Upload Preset
          </Button>
        </div>

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div style={{ 
            background: '#f7fafd', 
            border: '1.5px solid #0099ff', 
            borderRadius: 12, 
            padding: 24, 
            marginBottom: 18 
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#222' }}>Upload Preset to Community</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#333' }}>
                  Preset Name *
                </label>
                <select
                  value={uploadFormData.name}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: '1.5px solid #ddd', 
                    fontSize: 14 
                  }}
                >
                  <option value="">Select a preset to upload...</option>
                  {presets.map(preset => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#333' }}>
                  Description
                </label>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your preset..."
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: '1.5px solid #ddd', 
                    fontSize: 14,
                    minHeight: 80,
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#333' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadFormData.tags}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="wii, gaming, retro, blue..."
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: '1.5px solid #ddd', 
                    fontSize: 14 
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#333' }}>
                  Author Name
                </label>
                <input
                  type="text"
                  value={uploadFormData.author}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Your name or username"
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: '1.5px solid #ddd', 
                    fontSize: 14 
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadFormData.isPublic}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <label htmlFor="isPublic" style={{ fontSize: 14, color: '#666' }}>
                  Make this preset public
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button 
                variant="primary" 
                onClick={handleUploadToCommunity}
                disabled={uploadingPreset || !uploadFormData.name}
              >
                {uploadingPreset ? 'Uploading...' : 'Upload to Community'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadFormData({ name: '', description: '', tags: '', author: '', isPublic: true });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Community Presets List */}
        {communityLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            Loading community presets...
          </div>
        ) : filteredCommunityPresets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            {communitySearchQuery ? 'No presets found matching your search.' : 'No community presets available yet. Be the first to upload one!'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredCommunityPresets.map((preset, index) => (
              <div
                key={index}
                style={{
                  background: '#fff',
                  border: '1.5px solid #e0e6ef',
                  borderRadius: 12,
                  padding: 16,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                }}
              >
                {/* Thumbnail */}
                {preset.thumbnail && (
                  <div style={{ marginBottom: 12 }}>
                    <img
                      src={preset.thumbnail}
                      alt={preset.name}
                      style={{
                        width: '100%',
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #e0e6ef'
                      }}
                    />
                  </div>
                )}
                
                {/* Preset Info */}
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: '#222' }}>
                    {preset.name}
                  </h4>
                  {preset.description && (
                    <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#666', lineHeight: 1.4 }}>
                      {preset.description}
                    </p>
                  )}
                  {preset.tags && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {preset.tags.split(',').map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          style={{
                            background: '#f0f9ff',
                            color: '#0099ff',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500
                          }}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Metadata */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: 12,
                  color: '#888',
                  marginBottom: 12
                }}>
                  <span>By {preset.author || 'Anonymous'}</span>
                  <span>{new Date(preset.createdAt).toLocaleDateString()}</span>
                </div>
                
                {/* Stats */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 12
                }}>
                  <span>⭐ {preset.rating || 0} ({preset.downloads || 0} downloads)</span>
                </div>
                
                {/* Action Button */}
                <Button
                  variant="primary"
                  style={{ width: '100%' }}
                  onClick={() => handleDownloadCommunityPreset(preset)}
                >
                  Download & Install
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
     
    </BaseModal>
  );
}

PresetsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  presets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
  })).isRequired,
  onSavePreset: PropTypes.func.isRequired, // (name, includeChannels, includeSounds) => void
  onDeletePreset: PropTypes.func.isRequired,
  onApplyPreset: PropTypes.func.isRequired,
  onUpdatePreset: PropTypes.func.isRequired,
  onRenamePreset: PropTypes.func,
  onImportPresets: PropTypes.func, // (presets: Preset[]) => void
  onReorderPresets: PropTypes.func, // (reorderedPresets: Preset[]) => void
};

export default PresetsModal; 