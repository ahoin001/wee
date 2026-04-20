import React from 'react';
import PropTypes from 'prop-types';
import WToggle from '../../../ui/WToggle';
import WButton from '../../../ui/WButton';
import Slider from '../../../ui/Slider';
import GooeySettingsRow from './GooeySettingsRow';

function SpotifySettingsView({
  isFreeTierConnected,
  spotifySettings,
  spotifyManager,
  onDynamicColorsToggle,
  onBlurredBackgroundToggle,
  onBlurAmountChange,
  onAutoShowWidgetToggle,
  onCloseWidget,
  reducedMotion,
}) {
  const label = { color: 'var(--spotify-gooey-text)' };
  const primaryLabel = { color: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))' };
  const muted = { color: 'var(--spotify-gooey-text-secondary)' };

  return (
    <div className="custom-scrollbar gooey-floating-panel__scrollbar wee-spotify-widget__scroll max-h-full flex-1 overflow-y-auto pb-10 pt-4">
      <header className="mb-10">
        <h3
          className="text-4xl font-black uppercase italic tracking-tighter sm:text-5xl"
          style={label}
        >
          Widget
        </h3>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={label}>
          Spotify floating player
        </p>
      </header>

      {isFreeTierConnected ? (
        <div
          className="mb-8 rounded-3xl border-2 p-4 text-xs sm:text-sm"
          style={{
            borderColor: 'var(--spotify-gooey-border)',
            backgroundColor: 'var(--spotify-gooey-surface)',
            color: 'var(--spotify-gooey-text-secondary)',
          }}
          role="note"
        >
          <strong style={label}>Spotify Free</strong>
          <p className="mt-1">
            Appearance options below apply to this widget. Playback control from Wee requires Spotify Premium; on Free,
            use the Spotify app and keep this widget for now playing.
          </p>
        </div>
      ) : null}

      <div className="space-y-8">
        <section>
          <label
            className="mb-4 block text-[10px] font-black uppercase tracking-[0.3em]"
            style={primaryLabel}
          >
            Appearance
          </label>
          <GooeySettingsRow reducedMotion={reducedMotion}>
            <WToggle
              checked={spotifySettings.dynamicColors}
              onChange={onDynamicColorsToggle}
              label="Dynamic colors from album art"
            />
            <p className="mt-2 text-xs" style={muted}>
              Adjust colors from the current track&apos;s album art
            </p>
          </GooeySettingsRow>
          <GooeySettingsRow reducedMotion={reducedMotion}>
            <WToggle
              checked={spotifySettings.useBlurredBackground}
              onChange={onBlurredBackgroundToggle}
              label="Blurred album art background"
            />
            <p className="mt-2 text-xs" style={muted}>
              Use album art as a blurred background on the player page
            </p>
          </GooeySettingsRow>
          {spotifySettings.useBlurredBackground ? (
            <GooeySettingsRow reducedMotion={reducedMotion}>
              <div className="mb-2 text-xs font-semibold" style={label}>
                Blur amount
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.5"
                  value={spotifySettings.blurAmount || 0}
                  onChange={(e) => onBlurAmountChange(Number(e.target.value))}
                  className="blur-slider flex-1"
                />
                <span className="text-sm font-semibold tabular-nums" style={label}>
                  {spotifySettings.blurAmount || 0}px
                </span>
              </div>
            </GooeySettingsRow>
          ) : null}
        </section>

        <section>
          <label
            className="mb-4 block text-[10px] font-black uppercase tracking-[0.3em]"
            style={primaryLabel}
          >
            Behavior
          </label>
          <GooeySettingsRow reducedMotion={reducedMotion}>
            <WToggle
              checked={spotifySettings.autoShowWidget}
              onChange={onAutoShowWidgetToggle}
              label="Auto-show widget on playback"
            />
            <p className="mt-2 text-xs" style={muted}>
              Show this widget when music starts
            </p>
          </GooeySettingsRow>
          <GooeySettingsRow reducedMotion={reducedMotion}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={label}>
                  Hide floating widget
                </p>
                <p className="mt-1 text-xs" style={muted}>
                  Closes this panel. Turn it back on from Settings → API &amp; Widgets or your keyboard shortcut.
                </p>
              </div>
              <WButton
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 self-start sm:self-center"
                onClick={onCloseWidget}
              >
                Close widget
              </WButton>
            </div>
          </GooeySettingsRow>
        </section>

        <section>
          <label
            className="mb-4 block text-[10px] font-black uppercase tracking-[0.3em]"
            style={primaryLabel}
          >
            Track info panel
          </label>
          <GooeySettingsRow reducedMotion={reducedMotion}>
            <div className="mb-2 text-xs font-semibold" style={label}>
              Opacity
            </div>
            <div className="slider-container">
              <Slider
                value={spotifySettings.trackInfoPanelOpacity}
                min={0.1}
                max={1}
                step={0.1}
                onChange={(value) => spotifyManager.updateSpotifySettings({ trackInfoPanelOpacity: value })}
              />
              <span className="slider-value font-semibold tabular-nums" style={label}>
                {Math.round(spotifySettings.trackInfoPanelOpacity * 100)}%
              </span>
            </div>
          </GooeySettingsRow>
          <GooeySettingsRow reducedMotion={reducedMotion}>
            <div className="mb-2 text-xs font-semibold" style={label}>
              Blur
            </div>
            <div className="slider-container">
              <Slider
                value={spotifySettings.trackInfoPanelBlur}
                min={0}
                max={30}
                step={1}
                onChange={(value) => spotifyManager.updateSpotifySettings({ trackInfoPanelBlur: value })}
              />
              <span className="slider-value font-semibold tabular-nums" style={label}>
                {spotifySettings.trackInfoPanelBlur}px
              </span>
            </div>
          </GooeySettingsRow>
        </section>
      </div>
    </div>
  );
}

SpotifySettingsView.propTypes = {
  isFreeTierConnected: PropTypes.bool,
  spotifySettings: PropTypes.object.isRequired,
  spotifyManager: PropTypes.object.isRequired,
  onDynamicColorsToggle: PropTypes.func.isRequired,
  onBlurredBackgroundToggle: PropTypes.func.isRequired,
  onBlurAmountChange: PropTypes.func.isRequired,
  onAutoShowWidgetToggle: PropTypes.func.isRequired,
  onCloseWidget: PropTypes.func.isRequired,
  reducedMotion: PropTypes.bool,
};

SpotifySettingsView.defaultProps = {
  isFreeTierConnected: false,
  reducedMotion: false,
};

export default SpotifySettingsView;
