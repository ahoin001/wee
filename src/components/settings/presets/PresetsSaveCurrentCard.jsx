import React from 'react';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WInput from '../../../ui/WInput';

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
        Saves wallpaper, colors, and dock as a shareable Look. Channel boards stay on Home and Focus —
        arrange them live on those spaces.
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
          You can save up to {maxCustomPresets} custom looks (plus Spotify Match).
        </Text>
      ) : null}
    </div>
  )
);

PresetsSaveCurrentCard.displayName = 'PresetsSaveCurrentCard';

export default PresetsSaveCurrentCard;
