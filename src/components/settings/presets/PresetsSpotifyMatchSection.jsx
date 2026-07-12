import React from 'react';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WToggle from '../../../ui/WToggle';

const PANEL =
  'rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.65)] p-4';

/**
 * Compact Spotify Match block for Presets — deep immersive controls live under Spotify settings.
 */
const PresetsSpotifyMatchSection = React.memo(
  ({
    show,
    spotifyMatchEnabled,
    onSpotifyMatchToggle,
    onSaveLookAsPreset,
    onOpenSpotifySettings,
  }) => {
    if (!show) return null;

    return (
      <div className="space-y-3">
        <div className={PANEL}>
          <Text variant="caption" className="!mb-3 !mt-0 block leading-relaxed text-[hsl(var(--text-secondary))]">
            Match ribbon glow and time color to the current track&apos;s album art. Immersive gradients and
            lighting live in Spotify settings.
          </Text>
          <WToggle checked={spotifyMatchEnabled} onChange={onSpotifyMatchToggle} label="Enable Spotify Match" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onSaveLookAsPreset}>
              Freeze colors as preset
            </Button>
            {onOpenSpotifySettings ? (
              <Button variant="secondary" onClick={onOpenSpotifySettings}>
                Open Spotify settings
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

PresetsSpotifyMatchSection.displayName = 'PresetsSpotifyMatchSection';

export default PresetsSpotifyMatchSection;
