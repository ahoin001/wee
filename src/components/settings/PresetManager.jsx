import React, { useState, useRef } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WInput from '../../ui/WInput';
import PresetListItem from '../PresetListItem';
import CommunityPresets from '../CommunityPresets';
import JSZip from 'jszip';

const PresetManager = ({ 
  presets, 
  setPresets, 
  localSettings, 
  updateLocalSetting,
  onSettingsChange,
  showCommunitySection,
  toggleCommunitySection
}) => {
  const [importedPresets, setImportedPresets] = useState(null);
  const [importError, setImportError] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [error, setError] = useState('');
  const [justUpdated, setJustUpdated] = useState(null);
  const [editingPreset, setEditingPreset] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [includeChannels, setIncludeChannels] = useState(false);
  const [includeSounds, setIncludeSounds] = useState(false);
  const [overwriteMap, setOverwriteMap] = useState({});
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [draggingPreset, setDraggingPreset] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const fileInputRef = useRef();

  const getPresetsToExport = () => {
    if (selectMode && selectedPresets.length > 0) {
      return presets.filter(preset => selectedPresets.includes(preset.name));
    }
    return presets;
  };

  const handleDragStart = (e, presetName) => {
    setDraggingPreset(presetName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, presetName) => {
    e.preventDefault();
    if (draggingPreset && draggingPreset !== presetName) {
      setDropTarget(presetName);
    }
  };

  const handleDragEnter = (e, presetName) => {
    e.preventDefault();
    if (draggingPreset && draggingPreset !== presetName) {
      setDropTarget(presetName);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  };

  const handleDrop = (e, targetPresetName) => {
    e.preventDefault();
    if (draggingPreset && draggingPreset !== targetPresetName) {
      const newPresets = [...presets];
      const draggedIndex = newPresets.findIndex(p => p.name === draggingPreset);
      const targetIndex = newPresets.findIndex(p => p.name === targetPresetName);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedPreset] = newPresets.splice(draggedIndex, 1);
        newPresets.splice(targetIndex, 0, draggedPreset);
        setPresets(newPresets);
        
        // Update settings
        if (window.settings) {
          window.settings.presets = newPresets;
        }
      }
    }
    setDraggingPreset(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggingPreset(null);
    setDropTarget(null);
  };

  const handleExport = () => {
    const presetsToExport = getPresetsToExport();
    if (presetsToExport.length === 0) {
      setError('No presets to export');
      return;
    }
    handleExportZip(presetsToExport);
  };

  const handleExportZip = async (presetsToExport = null) => {
    try {
      const zip = new JSZip();
      const presetsToProcess = presetsToExport || presets;
      
      presetsToProcess.forEach(preset => {
        zip.file(`${preset.name}.json`, JSON.stringify(preset, null, 2));
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wii-desktop-presets-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setError('');
    } catch (err) {
      setError('Failed to export presets: ' + err.message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.name.endsWith('.zip')) {
      handleImportZip(file);
    } else if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const preset = JSON.parse(e.target.result);
          setImportedPresets([preset]);
          setShowImportPreview(true);
        } catch (err) {
          setImportError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    } else {
      setImportError('Please select a .zip or .json file');
    }
    
    e.target.value = '';
  };

  const handleImportZip = async (file) => {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      const importedPresets = [];
      
      for (const [filename, zipFile] of Object.entries(zipContent.files)) {
        if (filename.endsWith('.json') && !zipFile.dir) {
          const content = await zipFile.async('string');
          try {
            const preset = JSON.parse(content);
            importedPresets.push(preset);
          } catch (err) {
            console.error('Failed to parse preset:', filename, err);
          }
        }
      }
      
      if (importedPresets.length > 0) {
        setImportedPresets(importedPresets);
        setShowImportPreview(true);
        setImportError('');
      } else {
        setImportError('No valid presets found in ZIP file');
      }
    } catch (err) {
      setImportError('Failed to read ZIP file: ' + err.message);
    }
  };

  const handleToggleOverwrite = (name) => {
    setOverwriteMap(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleConfirmImport = () => {
    if (!importedPresets) return;
    
    const newPresets = [...presets];
    let importedCount = 0;
    
    importedPresets.forEach(importedPreset => {
      const existingIndex = newPresets.findIndex(p => p.name === importedPreset.name);
      
      if (existingIndex !== -1) {
        if (overwriteMap[importedPreset.name]) {
          newPresets[existingIndex] = importedPreset;
          importedCount++;
        }
      } else {
        newPresets.push(importedPreset);
        importedCount++;
      }
    });
    
    setPresets(newPresets);
    setShowImportPreview(false);
    setImportedPresets(null);
    setOverwriteMap({});
    setImportError('');
    
    // Update settings
    if (window.settings) {
      window.settings.presets = newPresets;
    }
    
    setError(`Imported ${importedCount} preset(s)`);
    setTimeout(() => setError(''), 3000);
  };

  const handleCancelImport = () => {
    setShowImportPreview(false);
    setImportedPresets(null);
    setOverwriteMap({});
    setImportError('');
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      setError('Please enter a preset name');
      return;
    }
    
    if (presets.some(p => p.name === newPresetName)) {
      setError('A preset with this name already exists');
      return;
    }
    
    const newPreset = {
      name: newPresetName,
      settings: localSettings,
      timestamp: new Date().toISOString(),
      includeChannels,
      includeSounds
    };
    
    const newPresets = [...presets, newPreset];
    setPresets(newPresets);
    setNewPresetName('');
    setError('');
    
    // Update settings
    if (window.settings) {
      window.settings.presets = newPresets;
    }
    
    setJustUpdated(newPresetName);
    setTimeout(() => setJustUpdated(null), 2000);
  };

  const handleUpdate = (name) => {
    const preset = presets.find(p => p.name === name);
    if (!preset) return;
    
    const updatedPreset = {
      ...preset,
      settings: localSettings,
      timestamp: new Date().toISOString()
    };
    
    const newPresets = presets.map(p => p.name === name ? updatedPreset : p);
    setPresets(newPresets);
    
    // Update settings
    if (window.settings) {
      window.settings.presets = newPresets;
    }
    
    setJustUpdated(name);
    setTimeout(() => setJustUpdated(null), 2000);
  };

  const handleStartEdit = (preset) => {
    setEditingPreset(preset);
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
      setEditError('Please enter a preset name');
      return;
    }
    
    if (presets.some(p => p.name === editName && p.name !== editingPreset.name)) {
      setEditError('A preset with this name already exists');
      return;
    }
    
    const newPresets = presets.map(p => 
      p.name === editingPreset.name 
        ? { ...p, name: editName }
        : p
    );
    setPresets(newPresets);
    
    // Update settings
    if (window.settings) {
      window.settings.presets = newPresets;
    }
    
    setEditingPreset(null);
    setEditName('');
    setEditError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (editingPreset) {
        handleSaveEdit();
      } else {
        handleSavePreset();
      }
    } else if (e.key === 'Escape') {
      if (editingPreset) {
        handleCancelEdit();
      }
    }
  };

  const handleApplyPreset = (preset) => {
    // Apply the preset settings
    Object.entries(preset.settings).forEach(([tab, settings]) => {
      Object.entries(settings).forEach(([key, value]) => {
        updateLocalSetting(tab, key, value);
      });
    });
    
    // Notify parent of changes
    if (onSettingsChange) {
      onSettingsChange(preset.settings);
    }
  };

  const handleDeletePreset = (name) => {
    if (window.confirm(`Are you sure you want to delete the preset "${name}"?`)) {
      const newPresets = presets.filter(p => p.name !== name);
      setPresets(newPresets);
      
      // Update settings
      if (window.settings) {
        window.settings.presets = newPresets;
      }
    }
  };

  const handleToggleSelectPreset = (name) => {
    setSelectedPresets(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    setSelectedPresets(presets.map(p => p.name));
  };

  const handleDeselectAll = () => {
    setSelectedPresets([]);
  };

  const handleSharePreset = (preset) => {
    // This would integrate with the community sharing feature

  };

  const handleImportCommunityPreset = (presetData) => {
    console.log('[PresetManager] Importing community preset:', presetData);
    
    // Convert the downloaded preset structure to the expected format
    // Community presets have 'settings', local presets have 'data'
    // App.jsx handleApplyPreset expects preset.data.timeColor, not preset.settings.timeColor
    const presetSettings = {
      ...presetData.settings,
      // Include wallpaper in the data object if present
      ...(presetData.wallpaper && { wallpaper: presetData.wallpaper })
    };
    
    const newPreset = {
      name: presetData.name,
      data: presetSettings, // Convert 'settings' to 'data' for compatibility with App.jsx handleApplyPreset
      timestamp: new Date().toISOString(),
      isCommunity: true,
      communityId: presetData.id
    };
    
    console.log('[PresetManager] Converted preset structure:', newPreset);
    console.log('[PresetManager] Preset data structure check:', {
      hasData: !!newPreset.data,
      hasTimeColor: !!newPreset.data?.timeColor,
      timeColorValue: newPreset.data?.timeColor
    });
    
    const newPresets = [...presets, newPreset];
    setPresets(newPresets);
    
    // Update settings
    if (window.settings) {
      window.settings.presets = newPresets;
    }
    
    setError(`Imported community preset: ${presetData.name}`);
    setTimeout(() => setError(''), 3000);
  };

  return (
    <div>
      {/* Save Current Settings */}
      <Card
        title="Save Current Settings"
        separator
        desc="Save your current settings as a preset for quick access later."
        actions={
          <>
            <div style={{ marginBottom: 16 }}>
              <WInput
                placeholder="Preset name"
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <WToggle
                checked={includeChannels}
                onChange={(checked) => setIncludeChannels(checked)}
                label="Include Channel Settings"
                style={{ fontSize: 14 }}
              />
              <WToggle
                checked={includeSounds}
                onChange={(checked) => setIncludeSounds(checked)}
                label="Include Sound Settings"
                style={{ fontSize: 14 }}
              />
            </div>
            
            <Button 
              variant="primary" 
              onClick={handleSavePreset}
              disabled={!newPresetName.trim()}
            >
              Save Preset
            </Button>
            
            {error && (
              <div style={{ marginTop: 8, color: 'hsl(var(--error))', fontSize: 14 }}>
                {error}
              </div>
            )}
          </>
        }
      />

      {/* Saved Presets */}
      <Card
        title="Saved Presets"
        separator
        desc="Manage your saved presets. Drag to reorder, or use bulk actions."
        actions={
          <>
           
            
            {presets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-secondary))' }}>
                No saved presets yet. Save your first preset above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {presets.map((preset, index) => (
                  <PresetListItem
                    key={preset.name}
                    preset={preset}
                    isSelected={selectedPresets.includes(preset.name)}
                    isEditing={editingPreset?.name === preset.name}
                    editName={editName}
                    onEditNameChange={setEditName}
                    onEditNameKeyPress={handleKeyPress}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onApply={handleApplyPreset}
                    onUpdate={handleUpdate}
                    onDelete={handleDeletePreset}
                    onToggleSelect={handleToggleSelectPreset}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingPreset === preset.name}
                    isDropTarget={dropTarget === preset.name}
                    showSelectCheckbox={selectMode}
                    justUpdated={justUpdated === preset.name}
                  />
                ))}
              </div>
            )}
          </>
        }
      />

      {/* Import/Export */}
      <Card
        title="Import & Export"
        separator
        desc="Import presets from files or export your presets for backup."
        actions={
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Button 
                variant="secondary" 
                onClick={handleImportClick}
              >
                Import Presets
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleExport}
                disabled={presets.length === 0}
              >
                Export All
              </Button>
              {selectMode && selectedPresets.length > 0 && (
                <Button 
                  variant="secondary" 
                  onClick={() => handleExportZip(presets.filter(p => selectedPresets.includes(p.name)))}
                >
                  Export Selected
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            {importError && (
              <div style={{ color: 'hsl(var(--error))', fontSize: 14, marginTop: 8 }}>
                {importError}
              </div>
            )}
          </>
        }
      />

      {/* Community Presets */}
      <CommunityPresets onImportPreset={handleImportCommunityPreset} />
    </div>
  );
};

export default PresetManager; 