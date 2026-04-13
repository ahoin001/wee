import React from 'react';
import Card from '../../../ui/Card';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import { CommunityPresets } from '../../app-library';
import { ACCEPT_GALLERY_STILLS, SUPPORTED_GALLERY_HINT } from '../../../utils/supportedUploadMedia';

const PresetsCommunityCard = React.memo(
  ({
    showCommunitySection,
    onToggleCommunitySection,
    presets,
    showUploadForm,
    uploadFormData,
    uploadMessage,
    uploading,
    onOpenUploadForm,
    onCloseUploadForm,
    onUploadField,
    onUpload,
    onImportCommunityPreset,
  }) => (
    <Card className="mb-[18px]" title="Community Presets" separator desc="Browse and download presets shared by the community.">
      <div className="mb-4">
        <Button variant="secondary" onClick={onToggleCommunitySection} className="mr-3">
          {showCommunitySection ? 'Hide Community' : 'Browse Community'}
        </Button>
        {presets.length > 0 && (
          <Button variant="primary" onClick={onOpenUploadForm}>
            Share My Preset
          </Button>
        )}
      </div>

      {showUploadForm && (
        <Card className="mb-4 p-4">
          {uploadMessage.text && (
            <div
              className={`p-3 rounded-[6px] mb-4 border ${
                uploadMessage.type === 'success'
                  ? 'bg-[hsl(var(--success-light))] text-[hsl(var(--success))] border-[hsl(var(--success))]'
                  : 'bg-[hsl(var(--error-light))] text-[hsl(var(--error))] border-[hsl(var(--error))]'
              }`}
            >
              {uploadMessage.text}
            </div>
          )}

          <div className="mb-3">
            <Text variant="label" className="mb-2">
              Select Preset to Share *
            </Text>
            <select
              value={uploadFormData.selectedPreset ? uploadFormData.selectedPreset.name : ''}
              onChange={(e) => onUploadField('presetName', e.target.value)}
              className="surface-select"
            >
              <option value="">Select a preset to share...</option>
              {presets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <Text variant="label" className="mb-2">
              Description
            </Text>
            <textarea
              value={uploadFormData.description}
              onChange={(e) => onUploadField('description', e.target.value)}
              placeholder="Describe your preset..."
              rows={3}
              className="surface-textarea"
            />
          </div>

          <div className="mb-4">
            <Text variant="label" className="mb-2">
              Your Name (Optional)
            </Text>
            <input
              type="text"
              value={uploadFormData.creator_name}
              onChange={(e) => onUploadField('creator_name', e.target.value)}
              placeholder="Anonymous"
              className="surface-input"
            />
          </div>

          <div className="mb-4">
            <Text variant="label" className="mb-2">
              Custom Image (Optional)
            </Text>
            <Text size="sm" color="hsl(var(--text-secondary))" className="mb-2">
              Upload a custom image to represent your preset ({SUPPORTED_GALLERY_HINT.trim()}). If not provided, a
              thumbnail will be auto-generated.
            </Text>
            <div className="surface-actions">
              <input
                type="file"
                accept={ACCEPT_GALLERY_STILLS}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (e.target) e.target.value = '';
                  if (f) onUploadField('file', f);
                }}
                className="hidden"
                id="presets-custom-image-upload"
              />
              <Button
                variant="secondary"
                onClick={() => document.getElementById('presets-custom-image-upload')?.click()}
                className="flex-1"
              >
                Choose Image
              </Button>
              {uploadFormData.custom_image && (
                <Button variant="secondary" onClick={() => onUploadField('custom_image', null)}>
                  Remove
                </Button>
              )}
            </div>
            {uploadFormData.custom_image && (
              <div className="mt-2 space-y-1">
                {uploadFormData.custom_image_name ? (
                  <Text variant="small" className="block">
                    {uploadFormData.custom_image_name}
                  </Text>
                ) : null}
                <img
                  src={uploadFormData.custom_image}
                  alt="Custom preview"
                  className="w-full max-w-[200px] max-h-[120px] object-contain rounded border border-primary bg-[hsl(var(--surface-secondary))]"
                />
              </div>
            )}
          </div>

          <div className="surface-actions justify-end">
            <Button variant="secondary" onClick={onCloseUploadForm} disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onUpload}
              disabled={uploading || !uploadFormData.selectedPreset}
            >
              {uploading ? 'Uploading...' : 'Share Preset'}
            </Button>
          </div>
        </Card>
      )}

      {showCommunitySection && (
        <CommunityPresets onImportPreset={onImportCommunityPreset} onClose={onToggleCommunitySection} />
      )}
    </Card>
  )
);

PresetsCommunityCard.displayName = 'PresetsCommunityCard';

export default PresetsCommunityCard;
