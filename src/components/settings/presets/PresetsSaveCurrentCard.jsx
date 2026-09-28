import { WeeGooeyToggle, WeeGooeyField } from '../../../ui/wee';
import React from 'react';
import { X } from 'lucide-react';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';

const HIDE_BOARD_HINT =
  'When a preset is saved, channels are shown in the screenshot. If you want a clean thumbnail without channels, toggle this on.';

/** "Save current as Look" form. Boards are opt-in and stay on this PC. */
const PresetsSaveCurrentCard = React.memo(
  ({
    newPresetName,
    onNewPresetNameChange,
    onSave,
    error,
    captureNotice,
    isSaving = false,
    hideBoardScreenshot = false,
    onHideBoardScreenshotChange,
    hideBoardHintDismissed = false,
    onDismissHideBoardHint,
    includeHomeBoard = false,
    onIncludeHomeBoardChange,
  }) => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <WeeGooeyField
          type="text"
          placeholder="Look name"
          value={newPresetName}
          onChange={(e) => onNewPresetNameChange(e.target.value)}
          maxLength={32}
          disabled={isSaving}
          className="min-w-0 flex-1"
        />
        <Button
          variant="primary"
          className="min-w-[110px] shrink-0 sm:self-stretch"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Capturing…' : 'Save Look'}
        </Button>
      </div>

      <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
        {includeHomeBoard
          ? 'Saves the look plus Home and Second Home boards — galleries, cinematic motion, and per-channel hover volume. Stays on this PC. Global sounds and Listening Stage are not included.'
          : 'Saves atmosphere across spaces and pages. Your Home and Second Home boards are never replaced.'}
      </Text>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary)/0.55)] px-4 py-3">
        <div className="min-w-0">
          <Text variant="body" className="!m-0 font-semibold text-[hsl(var(--text-primary))]">
            Include Home boards
          </Text>
          <Text variant="caption" className="!m-0 mt-1 block text-[hsl(var(--text-tertiary))]">
            Also save channel art, slideshows, and hover sounds. Not shareable.
          </Text>
        </div>
        <WeeGooeyToggle
          checked={includeHomeBoard}
          onChange={onIncludeHomeBoardChange}
          aria-label="Include Home boards in this preset"
          disabled={isSaving}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary)/0.55)] px-4 py-3">
        <div className="min-w-0">
          <Text variant="body" className="!m-0 font-semibold text-[hsl(var(--text-primary))]">
            Hide board in screenshot
          </Text>
          {!hideBoardHintDismissed ? (
            <div className="mt-1 flex items-start gap-2">
              <Text variant="caption" className="!m-0 min-w-0 flex-1 block text-[hsl(var(--text-tertiary))]">
                {HIDE_BOARD_HINT}
              </Text>
              {onDismissHideBoardHint ? (
                <button
                  type="button"
                  onClick={onDismissHideBoardHint}
                  aria-label="Dismiss hide board tip"
                  className="mt-0.5 shrink-0 rounded-full p-1 text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--state-hover))] hover:text-[hsl(var(--text-primary))]"
                >
                  <X size={13} strokeWidth={2.5} aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <WeeGooeyToggle
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
    </div>
  )
);

PresetsSaveCurrentCard.displayName = 'PresetsSaveCurrentCard';

export default PresetsSaveCurrentCard;
