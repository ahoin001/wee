import React from 'react';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WInput from '../../../ui/WInput';
import WSelect from '../../../ui/WSelect';
import { CommunityPresets } from '../../app-library';
import { PRESET_SCOPE_VISUAL } from '../../../utils/presets/presetScopes';
import { ACCEPT_GALLERY_STILLS, SUPPORTED_GALLERY_HINT } from '../../../utils/supportedUploadMedia';

const UPLOAD_SHELL =
  'mb-4 rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.55)] p-4 md:p-5';

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
    selectedPresetNeedsShareableCopy,
    onCreateShareableVisualCopy,
    onImportCommunityPreset,
  }) => {
    const shareablePresets = presets.filter((preset) => (preset.captureScope || PRESET_SCOPE_VISUAL) === PRESET_SCOPE_VISUAL);
    const selectedPresetValue = uploadFormData.selectedPreset
      ? uploadFormData.selectedPreset.id || uploadFormData.selectedPreset.name
      : '';
    const presetOptions = shareablePresets.map((preset) => ({
      value: preset.id || preset.name,
      label: preset.name,
    }));

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onToggleCommunitySection}>
            {showCommunitySection ? 'Hide community' : 'Browse community'}
          </Button>
          {shareablePresets.length > 0 ? (
            <Button variant="primary" onClick={onOpenUploadForm}>
              Share my preset
            </Button>
          ) : null}
        </div>
        {shareablePresets.length === 0 ? (
          <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
            Save a visual preset first to share it with the community.
          </Text>
        ) : null}

        {showUploadForm ? (
          <div className={UPLOAD_SHELL}>
            {uploadMessage.text ? (
              <div
                className={`mb-4 rounded-xl border p-3 text-sm font-medium ${
                  uploadMessage.type === 'success'
                    ? 'border-[hsl(var(--state-success))] bg-[hsl(var(--state-success-light))] text-[hsl(var(--state-success))]'
                    : 'border-[hsl(var(--state-error))] bg-[hsl(var(--state-error-light))] text-[hsl(var(--state-error))]'
                }`}
              >
                {uploadMessage.text}
              </div>
            ) : null}

            <div className="mb-3">
              <Text variant="label" className="mb-2">
                Select preset to share *
              </Text>
              <WSelect
                value={selectedPresetValue}
                onChange={(value) => onUploadField('presetId', value)}
                options={presetOptions}
                placeholder="Select a preset to share..."
              />
            </div>
            {selectedPresetNeedsShareableCopy ? (
              <div className="mb-4 rounded-xl border border-[hsl(var(--state-warning))] bg-[hsl(var(--state-warning-light))] p-3">
                <Text variant="caption" className="!m-0 text-[hsl(var(--state-warning))]">
                  This preset includes Home channels and cannot be shared directly.
                </Text>
                <div className="mt-2">
                  <Button variant="secondary" onClick={onCreateShareableVisualCopy}>
                    Create shareable visual copy
                  </Button>
                </div>
              </div>
            ) : null}

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
                Tags (optional)
              </Text>
              <WInput
                variant="wee"
                type="text"
                value={uploadFormData.tags}
                onChange={(e) => onUploadField('tags', e.target.value)}
                placeholder="e.g. dark, minimal, blue"
              />
            </div>

            <div className="mb-4">
              <Text variant="label" className="mb-2">
                Your name (optional)
              </Text>
              <WInput
                variant="wee"
                type="text"
                value={uploadFormData.creator_name}
                onChange={(e) => onUploadField('creator_name', e.target.value)}
                placeholder="Anonymous"
              />
            </div>

            <div className="mb-4">
              <Text variant="label" className="mb-2">
                Custom image (optional)
              </Text>
              <Text variant="caption" className="!mb-2 !mt-0 block text-[hsl(var(--text-tertiary))]">
                Upload a cover image ({SUPPORTED_GALLERY_HINT.trim()}). If omitted, a thumbnail is auto-generated.
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
                  Choose image
                </Button>
                {uploadFormData.custom_image ? (
                  <Button variant="secondary" onClick={() => onUploadField('custom_image', null)}>
                    Remove
                  </Button>
                ) : null}
              </div>
              {uploadFormData.custom_image ? (
                <div className="mt-2 space-y-1">
                  {uploadFormData.custom_image_name ? (
                    <Text variant="caption" className="block text-[hsl(var(--text-secondary))]">
                      {uploadFormData.custom_image_name}
                    </Text>
                  ) : null}
                  <img
                    src={uploadFormData.custom_image}
                    alt="Custom preview"
                    className="max-h-[120px] w-full max-w-[200px] rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] object-contain"
                  />
                </div>
              ) : null}
            </div>

            <div className="surface-actions justify-end">
              <Button variant="secondary" onClick={onCloseUploadForm} disabled={uploading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={onUpload} disabled={uploading || !uploadFormData.selectedPreset}>
                {uploading ? 'Uploading...' : 'Share preset'}
              </Button>
            </div>
          </div>
        ) : null}

        {showCommunitySection ? (
          <CommunityPresets onImportPreset={onImportCommunityPreset} onClose={onToggleCommunitySection} />
        ) : null}
      </div>
    );
  }
);

PresetsCommunityCard.displayName = 'PresetsCommunityCard';

export default PresetsCommunityCard;
