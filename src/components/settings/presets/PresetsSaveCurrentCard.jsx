import React from 'react';
import Card from '../../../ui/Card';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WToggle from '../../../ui/WToggle';
import WInput from '../../../ui/WInput';

/** "Save current as preset" form + include toggles */
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
    <Card className="mb-[18px]" title="Save Current as Preset" separator>
      <div className="wee-card-desc">
        <div className="surface-actions">
          <WInput
            type="text"
            placeholder="Preset name"
            value={newPresetName}
            onChange={(e) => onNewPresetNameChange(e.target.value)}
            maxLength={32}
            disabled={customPresetCount >= maxCustomPresets}
            className="flex-1"
          />
          <Button
            variant="primary"
            className="min-w-[90px]"
            onClick={onSave}
            disabled={customPresetCount >= maxCustomPresets}
          >
            Save Preset
          </Button>
        </div>

        <div className="mt-3 surface-actions">
          <Text size="sm" color="hsl(var(--text-secondary))">
            Presets now save theme/look only. Use Workspaces for app/channel setups.
          </Text>
        </div>

        <div className="mt-2 surface-actions">
          <Button variant="tertiary" size="sm" onClick={onOpenWorkspaces}>
            Open Workspaces
          </Button>
          <WToggle checked={includeSounds} onChange={onIncludeSoundsChange} label="Include Sound Settings" />
          <Text size="sm" color="hsl(var(--text-secondary))" className="ml-2">
            Save sound library and audio preferences
          </Text>
        </div>

        {error && (
          <Text size="sm" color="hsl(var(--state-error))" className="mt-1.5">
            {error}
          </Text>
        )}
        {captureNotice.text && (
          <Text
            size="sm"
            color={captureNotice.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--text-secondary))'}
            className="mt-1.5"
          >
            {captureNotice.text}
          </Text>
        )}
        {customPresetCount >= maxCustomPresets && (
          <Text size="sm" color="hsl(var(--text-secondary))" className="mt-1.5">
            You can save up to {maxCustomPresets} custom presets (plus Spotify Match).
          </Text>
        )}
      </div>
    </Card>
  )
);

PresetsSaveCurrentCard.displayName = 'PresetsSaveCurrentCard';

export default PresetsSaveCurrentCard;
