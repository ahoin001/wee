import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';
import JSZip from 'jszip';
import Button from '../ui/Button';
import '../styles/design-system.css';
import Text from '../ui/Text';
import Card from '../ui/Card';

function PresetsModal({ isOpen, onClose, presets, onSavePreset, onDeletePreset, onApplyPreset, onUpdatePreset, onRenamePreset, onImportPresets }) {
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

  // Helper to get presets to export
  const getPresetsToExport = () => {
    if (selectedPresets.length > 0) {
      return presets.filter(p => selectedPresets.includes(p.name));
    }
    return presets;
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

  if (!isOpen) return null;

  // Add animation CSS (can be in a <style> tag or a CSS file, but for now inline for clarity)
  const presetPulseStyle = `
@keyframes presetPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 #0099ff44; }
  50% { transform: scale(1.06); box-shadow: 0 0 16px 4px #0099ff88; }
  100% { transform: scale(1); box-shadow: 0 0 0 0 #0099ff44; }
}
`;

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
     
      <Card style={{ marginBottom: 18 }} title="Save Current as Preset" separator>
        <div className="wee-card-desc">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              placeholder="Preset name"
              value={newPresetName}
              onChange={e => { setNewPresetName(e.target.value); setError(''); }}
              style={{ flex: 1, padding: 8, borderRadius: 6, border: '1.5px solid #bbb', fontSize: 15, background: '#fff', color: '#222' }}
              maxLength={32}
              disabled={presets.length >= 6}
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
      <Card style={{ marginBottom: 18 }} title="Saved Presets" separator>
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
          {presets.map((preset, idx) => (
            <li
              key={preset.name}
              className={selectMode && selectedPresets.includes(preset.name) ? 'pulse-blue' : ''}
              style={{
                display: 'flex', alignItems: 'center', marginBottom: 10, padding: '12px 24px', borderBottom: '1px solid #f0f0f0',
                cursor: selectMode ? 'pointer' : 'default',
                background: selectMode && selectedPresets.includes(preset.name) ? '#e6f3ff' : '#fff',
                borderRadius: selectMode && selectedPresets.includes(preset.name) ? 10 : 8,
                boxShadow: !selectMode || !selectedPresets.includes(preset.name)
                  ? '0 1.5px 6px #0099ff08'
                  : undefined,
                border: !selectMode || !selectedPresets.includes(preset.name)
                  ? '1.5px solid #e0e6ef'
                  : undefined,
                transition: 'background 0.2s, box-shadow 0.2s, border 0.2s, transform 0.2s',
              }}
              onClick={selectMode ? () => handleToggleSelectPreset(preset.name) : undefined}
            >
              {/* Title left, buttons right */}
              <span style={{ fontWeight: 500, flex: 1, textAlign: 'left', fontSize: 16 }}>{preset.name}</span>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                {editingPreset === preset.name ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      style={{ fontSize: 16, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #ccc', marginRight: 8, flex: 1, background: '#fff' }}
                      autoFocus
                    />
                    <Button style={{ minWidth: 70, marginRight: 8 }} onClick={handleSaveEdit}>Save</Button>
                    <Button style={{ minWidth: 70 }} onClick={handleCancelEdit}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); handleApplyPreset(preset); }}>Apply</Button>
                    <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); handleUpdate(preset.name); }}>
                      {justUpdated === preset.name ? 'Updated!' : 'Update'}
                    </Button>
                    <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); handleStartEdit(preset); }}>Rename</Button>
                    <Button style={{ minWidth: 70 }} onClick={e => { e.stopPropagation(); onDeletePreset(preset.name); }}>Delete</Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
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
};

export default PresetsModal; 