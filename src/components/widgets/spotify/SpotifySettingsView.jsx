import React from 'react';
import PropTypes from 'prop-types';
import WToggle from '../../../ui/WToggle';
import Slider from '../../../ui/Slider';

function SpotifySettingsView({
  isFreeTierConnected,
  spotifySettings,
  spotifyManager,
  onDynamicColorsToggle,
  onBlurredBackgroundToggle,
  onBlurAmountChange,
  onAutoShowWidgetToggle,
  onVisualizerTypeChange,
  getVisualizerOptionClass,
}) {
  return (
    <div className="settings-page wee-spotify-widget__scroll max-h-full px-4 py-3 sm:px-6">
      <div className="settings-header mb-4">
        <h2 className="settings-title-modern text-[hsl(var(--text-on-accent))]">Widget settings</h2>
        <p className="settings-subtitle text-[hsl(var(--color-pure-white)/0.65)]">Customize this floating player</p>
      </div>

      {isFreeTierConnected ? (
        <div className="floating-spotify-widget__settings-tier-note mb-4" role="note">
          <strong className="floating-spotify-widget__settings-tier-note-title">Spotify Free</strong>
          <p>
            Appearance options below apply to this widget. Playback control from Wee requires Spotify Premium; on Free,
            use the Spotify app and keep this widget for now playing.
          </p>
        </div>
      ) : null}

      <div className="settings-sections space-y-6">
        <div className="settings-section-modern">
          <h3 className="section-title text-[hsl(var(--text-on-accent))]">Appearance</h3>
          <div className="setting-item-modern">
            <WToggle
              checked={spotifySettings.dynamicColors}
              onChange={onDynamicColorsToggle}
              label="Dynamic colors from album art"
            />
            <p className="setting-description text-[hsl(var(--color-pure-white)/0.55)]">
              Adjust colors from the current track&apos;s album art
            </p>
          </div>
          <div className="setting-item-modern">
            <WToggle
              checked={spotifySettings.useBlurredBackground}
              onChange={onBlurredBackgroundToggle}
              label="Blurred album art background"
            />
            <p className="setting-description text-[hsl(var(--color-pure-white)/0.55)]">
              Use album art as a blurred background on the player page
            </p>
          </div>
          {spotifySettings.useBlurredBackground ? (
            <div className="setting-item-modern">
              <div className="setting-label mb-2 text-[hsl(var(--text-on-accent))]">Blur amount</div>
              <div className="slider-container flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.5"
                  value={spotifySettings.blurAmount || 0}
                  onChange={(e) => onBlurAmountChange(Number(e.target.value))}
                  className="blur-slider flex-1"
                />
                <span className="slider-value font-semibold text-[hsl(var(--text-on-accent))]">
                  {spotifySettings.blurAmount || 0}px
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="settings-section-modern">
          <h3 className="section-title text-[hsl(var(--text-on-accent))]">Behavior</h3>
          <div className="setting-item-modern">
            <WToggle
              checked={spotifySettings.autoShowWidget}
              onChange={onAutoShowWidgetToggle}
              label="Auto-show widget on playback"
            />
            <p className="setting-description text-[hsl(var(--color-pure-white)/0.55)]">
              Show this widget when music starts
            </p>
          </div>
        </div>

        <div className="settings-section-modern">
          <h3 className="section-title text-[hsl(var(--text-on-accent))]">Visualizer</h3>
          <p className="mb-2 text-xs text-[hsl(var(--color-pure-white)/0.5)]">
            Off by default for lower CPU use. Enable a style for a thin bar above the player.
          </p>
          <div className="visualizer-options-modern flex flex-wrap gap-2">
            {['off', 'bars', 'circles', 'waves', 'sparkle'].map((type) => (
              <button
                key={type}
                type="button"
                className={getVisualizerOptionClass(type)}
                onClick={() => onVisualizerTypeChange(type)}
              >
                {type === 'off' ? 'Off' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section-modern">
          <h3 className="section-title text-[hsl(var(--text-on-accent))]">Track info panel</h3>
          <div className="setting-item-modern">
            <div className="setting-label mb-2 text-[hsl(var(--text-on-accent))]">Opacity</div>
            <div className="slider-container">
              <Slider
                value={spotifySettings.trackInfoPanelOpacity}
                min={0.1}
                max={1}
                step={0.1}
                onChange={(value) => spotifyManager.updateSpotifySettings({ trackInfoPanelOpacity: value })}
              />
              <span className="slider-value font-semibold text-[hsl(var(--text-on-accent))]">
                {Math.round(spotifySettings.trackInfoPanelOpacity * 100)}%
              </span>
            </div>
          </div>
          <div className="setting-item-modern">
            <div className="setting-label mb-2 text-[hsl(var(--text-on-accent))]">Blur</div>
            <div className="slider-container">
              <Slider
                value={spotifySettings.trackInfoPanelBlur}
                min={0}
                max={30}
                step={1}
                onChange={(value) => spotifyManager.updateSpotifySettings({ trackInfoPanelBlur: value })}
              />
              <span className="slider-value font-semibold text-[hsl(var(--text-on-accent))]">
                {spotifySettings.trackInfoPanelBlur}px
              </span>
            </div>
          </div>
        </div>
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
  onVisualizerTypeChange: PropTypes.func.isRequired,
  getVisualizerOptionClass: PropTypes.func.isRequired,
};

SpotifySettingsView.defaultProps = {
  isFreeTierConnected: false,
};

export default SpotifySettingsView;
