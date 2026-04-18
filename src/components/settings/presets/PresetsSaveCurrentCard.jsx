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
    includeSounds,
    onIncludeSoundsChange,
    onOpenWorkspaces,
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
        Presets save theme and look only. Use Workspaces for app and channel setups.
      </Text>

      <div className="flex flex-col gap-3 border-t border-[hsl(var(--border-primary)/0.35)] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Button variant="tertiary" size="sm" onClick={onOpenWorkspaces} className="w-fit">
          Open Workspaces
        </Button>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:ml-auto">
          <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))] sm:text-right">
            Save sound library and audio preferences
          </Text>
          <WToggle checked={includeSounds} onChange={onIncludeSoundsChange} label="Include sounds" disableLabelClick />
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
