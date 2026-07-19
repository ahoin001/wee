import React from 'react';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WInput from '../../../ui/WInput';
import WToggle from '../../../ui/WToggle';

/** "Save current as Look" form — visual-only (shareable). */
const PresetsSaveCurrentCard = React.memo(
  ({
    newPresetName,
    onNewPresetNameChange,
    onSave,
    error,
    captureNotice,
    customPresetCount,
    maxCustomPresets,
    isSaving = false,
    hideBoardScreenshot = false,
    onHideBoardScreenshotChange,
  }) => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <WInput
          variant="wee"
          type="text"
          placeholder="Look name"
          value={newPresetName}
          onChange={(e) => onNewPresetNameChange(e.target.value)}
          maxLength={32}
          disabled={isSaving || customPresetCount >= maxCustomPresets}
          className="min-w-0 flex-1"
        />
        <Button
          variant="primary"
          className="min-w-[110px] shrink-0 sm:self-stretch"
          onClick={onSave}
          disabled={isSaving || customPresetCount >= maxCustomPresets}
        >
          {isSaving ? 'Capturing…' : 'Save Look'}
        </Button>
      </div>

      <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
        Saves atmosphere across spaces and pages. Your Home and Focus boards are never replaced.
      </Text>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary)/0.55)] px-4 py-3">
        <div className="min-w-0">
          <Text variant="body" className="!m-0 font-semibold text-[hsl(var(--text-primary))]">
            Hide board in screenshot
          </Text>
          <Text variant="caption" className="!m-0 mt-1 block text-[hsl(var(--text-tertiary))]">
            Off shows your real tiles. On captures wallpaper and chrome with no ghost tiles.
          </Text>
        </div>
        <WToggle
          checked={hideBoardScreenshot}
          onChange={onHideBoardScreenshotChange}
          aria-label="Hide board in preset screenshot"
          disabled={isSaving}
        />
      </div>

      <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
        The screenshot is taken when you save or update this Look.
      </Text>

      {error ? (
        <Text variant="caption" className="!m-0 text-[hsl(var(--state-error))]">
          {error}
        </Text>
      ) : null}
      {captureNotice.text ? (
        <Text
          variant="caption"
          className={`!m-0 ${captureNotice.type === 'success' ? 'text-[hsl(var(--state-success))]' : 'text-[hsl(var(--text-secondary))]'}`}
        >
          {captureNotice.text}
        </Text>
      ) : null}
      {customPresetCount >= maxCustomPresets ? (
        <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
          You can save up to {maxCustomPresets} custom presets (plus Spotify Match).
        </Text>
      ) : null}
    </div>
  )
);

PresetsSaveCurrentCard.displayName = 'PresetsSaveCurrentCard';

export default PresetsSaveCurrentCard;
