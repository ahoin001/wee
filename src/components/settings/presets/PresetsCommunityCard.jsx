import React, { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WInput from '../../../ui/WInput';
import WSelect from '../../../ui/WSelect';
import WToggle from '../../../ui/WToggle';
import { CommunityPresets } from '../../app-library';
import { PRESET_SCOPE_VISUAL } from '../../../utils/presets/presetScopes';
import { ACCEPT_GALLERY_STILLS, SUPPORTED_GALLERY_HINT } from '../../../utils/supportedUploadMedia';
import { createWeeTransition } from '../../../design/weeMotion';
import { useMotionFeedback } from '../../../hooks/useMotionFeedback';
import { WeeRevealWhen } from '../../../ui/wee';

const UPLOAD_SHELL =
  'mb-1 rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.55)] p-4 md:p-5';

const SEGMENT =
  'inline-flex rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.8)] p-1';

/**
 * Community browse + share — single surface with segmented control (no double-toggle).
 */
const PresetsCommunityCard = React.memo(
  ({
    communityMode,
    onCommunityModeChange,
    presets,
    uploadFormData,
    uploadMessage,
    uploading,
    onUploadField,
    onUpload,
    selectedPresetNeedsShareableCopy,
    onCreateShareableVisualCopy,
    onImportCommunityPreset,
    onCloseUploadForm,
  }) => {
    const shareablePresets = presets.filter(
      (preset) => (preset.captureScope || PRESET_SCOPE_VISUAL) === PRESET_SCOPE_VISUAL
    );
    const selectedPresetValue = uploadFormData.selectedPreset
      ? uploadFormData.selectedPreset.id || uploadFormData.selectedPreset.name
      : '';
    const presetOptions = shareablePresets.map((preset) => ({
      value: preset.id || preset.name,
      label: preset.name,
    }));
    const mf = useMotionFeedback();
    const panelTransition = createWeeTransition('pillOpen', { reducedMotion: !mf.channelReorderSlotMotion });
    const [useCustomCover, setUseCustomCover] = useState(Boolean(uploadFormData.custom_image));

    const autoThumb = uploadFormData.selectedPreset?.thumbnailDataUrl || null;
    const sharePreviewSrc = useCustomCover && uploadFormData.custom_image
      ? uploadFormData.custom_image
      : autoThumb;

    const handleCustomCoverToggle = (checked) => {
      setUseCustomCover(checked);
      if (!checked) {
        onUploadField('custom_image', null);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={SEGMENT} role="tablist" aria-label="Community">
            <button
              type="button"
              role="tab"
              aria-selected={communityMode === 'browse'}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                communityMode === 'browse'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                  : 'text-[hsl(var(--text-secondary))]'
              }`}
              onClick={() => onCommunityModeChange('browse')}
            >
              Browse
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={communityMode === 'share'}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                communityMode === 'share'
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                  : 'text-[hsl(var(--text-secondary))]'
              }`}
              onClick={() => onCommunityModeChange('share')}
            >
              Share
            </button>
          </div>
          {shareablePresets.length === 0 ? (
            <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
              Save a visual preset to share it.
            </Text>
          ) : null}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {communityMode === 'share' ? (
            <m.div
              key="share"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={panelTransition}
              className={UPLOAD_SHELL}
            >
              {uploadMessage.text ? (
                <div
                  className={`mb-4 rounded-xl border p-3 text-sm font-medium ${
                    uploadMessage.type === 'success'
                      ? 'border-[hsl(var(--state-success))] bg-[hsl(var(--state-success-light))] text-[hsl(var(--state-success))]'
                      : uploadMessage.type === 'warning'
                        ? 'border-[hsl(var(--state-warning))] bg-[hsl(var(--state-warning)/0.15)] text-[hsl(var(--state-warning))]'
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
              <WeeRevealWhen when={selectedPresetNeedsShareableCopy}>
                <div className="mb-4 rounded-xl border border-[hsl(var(--state-warning))] bg-[hsl(var(--state-warning)/0.12)] p-3">
                  <Text variant="caption" className="!m-0 text-[hsl(var(--state-warning))]">
                    This preset includes Home channels and cannot be shared directly.
                  </Text>
                  <div className="mt-2">
                    <Button variant="secondary" onClick={onCreateShareableVisualCopy}>
                      Create shareable visual copy
                    </Button>
                  </div>
                </div>
              </WeeRevealWhen>

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

              <div className="mb-4 space-y-3">
                <div>
                  <Text variant="label" className="mb-1">
                    Cover preview
                  </Text>
                  <Text variant="caption" className="!mb-2 !mt-0 block text-[hsl(var(--text-tertiary))]">
                    {useCustomCover && uploadFormData.custom_image
                      ? 'Custom cover will be used when you share.'
                      : 'Auto screenshot from this look — shared when you click Share preset.'}
                  </Text>
                  {sharePreviewSrc ? (
                    <img
                      src={sharePreviewSrc}
                      alt="Share cover preview"
                      className="max-h-[160px] w-full max-w-[280px] rounded-xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] object-cover"
                    />
                  ) : (
                    <div className="flex h-[100px] w-full max-w-[280px] items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary)/0.5)] px-3 text-center">
                      <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                        {uploadFormData.selectedPreset
                          ? 'No thumbnail yet — save or update the look to capture one.'
                          : 'Select a preset to preview its cover.'}
                      </Text>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                  <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                    Use a custom cover instead
                  </Text>
                  <WToggle
                    checked={useCustomCover}
                    onChange={handleCustomCoverToggle}
                    label="Use custom cover"
                    disableLabelClick
                  />
                </div>

                <WeeRevealWhen when={useCustomCover}>
                  <div className="space-y-2">
                      <Text variant="caption" className="!mb-2 !mt-0 block text-[hsl(var(--text-tertiary))]">
                        {SUPPORTED_GALLERY_HINT.trim()}. Wallpaper + colors still upload from the preset.
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
                      {uploadFormData.custom_image_name ? (
                        <Text variant="caption" className="!mt-2 block text-[hsl(var(--text-secondary))]">
                          {uploadFormData.custom_image_name}
                        </Text>
                      ) : null}
                  </div>
                </WeeRevealWhen>
              </div>

              <div className="surface-actions justify-end">
                <Button variant="secondary" onClick={onCloseUploadForm} disabled={uploading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={onUpload}
                  disabled={uploading || !uploadFormData.selectedPreset || shareablePresets.length === 0}
                >
                  {uploading ? 'Uploading…' : 'Share preset'}
                </Button>
              </div>
            </m.div>
          ) : (
            <m.div
              key="browse"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={panelTransition}
            >
              <CommunityPresets onImportPreset={onImportCommunityPreset} />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

PresetsCommunityCard.displayName = 'PresetsCommunityCard';

export default PresetsCommunityCard;
