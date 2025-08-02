import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import PresetListItem from '../PresetListItem';
import CommunityPresets from '../CommunityPresets';
import AuthModal from '../AuthModal';
import { uploadPreset } from '../../utils/supabase';

const ThemesSettingsTab = ({ 
  localSettings, 
  updateLocalSetting,
  presets,
  setPresets,
  newPresetName,
  setNewPresetName,
  error,
  setError,
  importedPresets,
  setImportedPresets,
  importError,
  setImportError,
  showImportPreview,
  setShowImportPreview,
  overwriteMap,
  setOverwriteMap,
  draggingPreset,
  setDraggingPreset,
  dropTarget,
  setDropTarget,
  selectedPresets,
  setSelectedPresets,
  selectMode,
  setSelectMode,
  editingPreset,
  setEditingPreset,
  editName,
  setEditName,
  justUpdated,
  setJustUpdated,
  showCommunitySection,
  toggleCommunitySection,
  showUploadForm,
  setShowUploadForm,
  uploading,
  setUploading,
  uploadMessage,
  setUploadMessage,
  uploadFormData,
  setUploadFormData,
  handleSavePreset,
  handleUpdate,
  handleStartEdit,
  handleCancelEdit,
  handleSaveEdit,
  handleKeyPress,
  handleApplyPreset,
  handleDeletePreset,
  handleToggleSelectPreset,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleToggleOverwrite,
  handleConfirmImport,
  handleCancelImport,
  handleImportCommunityPreset,
  handleUpload,
  handleUploadInputChange
}) => {
  return (
    <div>
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
              tabIndex={presets.length >= 6 ? -1 : 0}
            />
            <Button variant="primary" style={{ minWidth: 90 }} onClick={handleSavePreset} disabled={presets.length >= 6}>
              Save Preset
            </Button>
          </div>
          
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
        <hr style={{ border: 'none', borderTop: '1.5px solid hsl(var(--border-primary))', margin: '0 0 18px 0' }} />
          
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
                      <WToggle
                        checked={overwriteMap[preset.name]}
                        onChange={() => handleToggleOverwrite(preset.name)}
                        label="Overwrite existing"
                        style={{ fontSize: 13, color: 'hsl(var(--wii-blue))', marginLeft: 8 }}
                      />
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
                onDelete={handleDeletePreset}
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
                  setUploadFormData({ name: '', description: '', creator_name: '' });
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

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
};

export default ThemesSettingsTab; 