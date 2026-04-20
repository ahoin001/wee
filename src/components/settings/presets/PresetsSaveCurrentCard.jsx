import React from 'react';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WToggle from '../../../ui/WToggle';
import WInput from '../../../ui/WInput';

/** "Save current as preset" form + include toggles — body only (parent provides wee shell). */
const PresetsSaveCurrentCard = React.memo(
  ({
    newPresetName,
    onNewPresetNameChange,
    onSave,
    error,
    captureNotice,
    includeHomeChannels,
    onIncludeHomeChannelsChange,
    onOpenHomeProfiles,
    customPresetCount,
    maxCustomPresets,
  }) => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <WInput
          variant="wee"
          type="text"
          placeholder="Preset name"
          value={newPresetName}
          onChange={(e) => onNewPresetNameChange(e.target.value)}
          maxLength={32}
          disabled={customPresetCount >= maxCustomPresets}
          className="min-w-0 flex-1"
        />
        <Button
          variant="primary"
          className="min-w-[90px] shrink-0 sm:self-stretch"
          onClick={onSave}
          disabled={customPresetCount >= maxCustomPresets}
        >
          Save Preset
        </Button>
      </div>

      <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
        Visual-only presets are shareable. Home channel presets are local-only.
      </Text>

      <div className="flex flex-col gap-3 border-t border-[hsl(var(--border-primary)/0.35)] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Button variant="tertiary" size="sm" onClick={onOpenHomeProfiles} className="w-fit">
          Open Home Profiles
        </Button>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:ml-auto">
          <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))] sm:text-right">
            Include Home channels and positions (local only)
          </Text>
          <WToggle
            checked={includeHomeChannels}
            onChange={onIncludeHomeChannelsChange}
            label="Include Home channels"
            disableLabelClick
          />
        </div>
      </div>

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
