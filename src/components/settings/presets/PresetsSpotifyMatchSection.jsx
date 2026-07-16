import React from 'react';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WToggle from '../../../ui/WToggle';

const PANEL =
  'rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.65)] p-4';

/**
 * Compact Spotify Match block for Presets — full Color Match controls live on
 * Edit Home → Now Playing widget settings.
 */
const PresetsSpotifyMatchSection = React.memo(
  ({
    spotifyMatchEnabled,
    onSpotifyMatchToggle,
    onSaveLookAsPreset,
    onOpenColorMatchSettings,
  }) => {
    return (
      <div className="space-y-3">
        <div className={PANEL}>
          <Text variant="caption" className="!mb-3 !mt-0 block leading-relaxed text-[hsl(var(--text-secondary))]">
            Match ribbon glow and time color to the current track&apos;s album art. Wallpaper wash
            and media-widget accents live in Edit Home → Now Playing.
          </Text>
          <WToggle checked={spotifyMatchEnabled} onChange={onSpotifyMatchToggle} label="Enable Spotify Match" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onSaveLookAsPreset}>
              Freeze colors as preset
            </Button>
            {onOpenColorMatchSettings ? (
              <Button variant="secondary" onClick={onOpenColorMatchSettings}>
                Edit Home Color Match
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
