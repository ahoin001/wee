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
    includeChannels,
    onIncludeChannelsChange,
    includeSounds,
    onIncludeSoundsChange,
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
          <WToggle checked={includeChannels} onChange={onIncludeChannelsChange} label="Include Channel Data" />
          <Text size="sm" color="hsl(var(--text-secondary))" className="ml-2">
            Save channels, their media, and app paths for workspace switching
          </Text>
        </div>

        <div className="mt-2 surface-actions">
          <WToggle checked={includeSounds} onChange={onIncludeSoundsChange} label="Include Sound Settings" />
          <Text size="sm" color="hsl(var(--text-secondary))" className="ml-2">
            Save sound library and audio preferences
          </Text>
        </div>

        {includeChannels && (
          <div className="mt-2 p-2 bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] rounded text-[12px]">
            <Text size="sm" color="hsl(var(--primary))" className="font-medium mb-1">
              Workspace Mode Enabled
            </Text>
            <Text size="sm" color="hsl(var(--text-secondary))">
              This preset will save your current channels, apps, and settings. Perfect for switching between workspaces.
              <strong>Note:</strong> Channel data is never included when sharing presets.
            </Text>
          </div>
        )}

        {error && (
          <Text size="sm" color="#dc3545" className="mt-1.5">
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
