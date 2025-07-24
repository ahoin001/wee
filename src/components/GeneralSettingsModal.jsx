import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';
import Toggle from '../ui/Toggle';
import Text from '../ui/Text';
import Button from '../ui/Button';

function GeneralSettingsModal({ isOpen, onClose, immersivePip, setImmersivePip, glassWiiRibbon, setGlassWiiRibbon, animatedOnHover, setAnimatedOnHover, startInFullscreen, setStartInFullscreen, showPresetsButton, setShowPresetsButton, onSettingsChange, ...props }) {
  const [pip, setPip] = useState(immersivePip);
  const [glassRibbon, setGlassRibbon] = useState(glassWiiRibbon);
  const [hoverAnim, setHoverAnim] = useState(animatedOnHover);
  const [fullscreen, setFullscreen] = useState(startInFullscreen);
  const [showPresets, setShowPresets] = useState(showPresetsButton);
  const [startOnBoot, setStartOnBoot] = useState(false);
  const [channelAnimation, setChannelAnimation] = useState(props.channelAnimation || 'none');
  
  // Ken Burns settings
  const [kenBurnsEnabled, setKenBurnsEnabled] = useState(props.kenBurnsEnabled ?? false);
  const [kenBurnsMode, setKenBurnsMode] = useState(props.kenBurnsMode || 'hover');
  
  // Advanced Ken Burns controls
  const [kenBurnsHoverScale, setKenBurnsHoverScale] = useState(props.kenBurnsHoverScale ?? 1.1);
  const [kenBurnsAutoplayScale, setKenBurnsAutoplayScale] = useState(props.kenBurnsAutoplayScale ?? 1.15);
  const [kenBurnsSlideshowScale, setKenBurnsSlideshowScale] = useState(props.kenBurnsSlideshowScale ?? 1.2);
  const [kenBurnsHoverDuration, setKenBurnsHoverDuration] = useState(props.kenBurnsHoverDuration ?? 8000);
  const [kenBurnsAutoplayDuration, setKenBurnsAutoplayDuration] = useState(props.kenBurnsAutoplayDuration ?? 12000);
  const [kenBurnsSlideshowDuration, setKenBurnsSlideshowDuration] = useState(props.kenBurnsSlideshowDuration ?? 10000);
  const [kenBurnsCrossfadeDuration, setKenBurnsCrossfadeDuration] = useState(props.kenBurnsCrossfadeDuration ?? 1000);
  const [showAdvancedKenBurns, setShowAdvancedKenBurns] = useState(false);

  useEffect(() => {
    if (window.api && window.api.getAutoLaunch) {
      window.api.getAutoLaunch().then(setStartOnBoot);
    }
  }, []);

  const handleSave = (handleClose) => {
    setImmersivePip(pip);
    setGlassWiiRibbon(glassRibbon);
    setAnimatedOnHover(hoverAnim);
    setStartInFullscreen(fullscreen);
    setShowPresetsButton(showPresets);
    if (onSettingsChange) {
      onSettingsChange({ 
        channelAnimation,
        kenBurnsEnabled,
        kenBurnsMode,
        kenBurnsHoverScale,
        kenBurnsAutoplayScale,
        kenBurnsSlideshowScale,
        kenBurnsHoverDuration,
        kenBurnsAutoplayDuration,
        kenBurnsSlideshowDuration,
        kenBurnsCrossfadeDuration
      });
    }
    handleClose();
  };

  const handleStartOnBootToggle = (e) => {
    const checked = e.target.checked;
    setStartOnBoot(checked);
    if (window.api && window.api.setAutoLaunch) {
      window.api.setAutoLaunch(checked);
    }
    // Optionally, persist in your own settings file as well
    if (onSettingsChange) {
      onSettingsChange({ startOnBoot: checked });
    }
  };

  return (
    <BaseModal 
      title="General Settings" 
      onClose={onClose} 
      maxWidth="900px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={() => handleSave(handleClose)} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Immersive PiP */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Immersive Picture in Picture mode</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={pip}
                onChange={e => setPip(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, video overlays will use immersive PiP mode for a more cinematic experience.</div>
        </div>
        {/* Glass Wii Ribbon */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Glass Wii Ribbon</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={glassRibbon}
                onChange={e => setGlassRibbon(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">Adds a frosted glass effect to the Wii Ribbon for a more modern look.</div>
        </div>
        {/* Only play channel animations on hover */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Only play channel animations on hover</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={hoverAnim}
                onChange={e => setHoverAnim(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, animated channel art (GIFs/MP4s) will only play when you hover over a channel.</div>
        </div>
        {/* Start in Fullscreen */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Start in Fullscreen</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={fullscreen}
                onChange={e => setFullscreen(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, the app will start in fullscreen mode. When disabled, it will start in windowed mode.</div>
        </div>
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Show Presets Button</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={showPresets}
                onChange={e => setShowPresets(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, shows a presets button near the time display that allows quick access to saved appearance presets. Right-click the button to customize its icon.</div>
        </div>
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Launch app when my computer starts</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={startOnBoot}
                onChange={handleStartOnBootToggle}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, the app will launch automatically when your computer starts.</div>
        </div>
        <div className="wee-card" style={{ marginBottom: 18 }}>
          <div className="wee-card-header">
            <Text as="span" size="lg" weight={700} className="wee-card-title">Channel Animations</Text>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            <Text as="label" size="md" weight={500} style={{ display: 'block', marginBottom: 8 }}>Channel Animation Style</Text>
            <select
              value={channelAnimation}
              onChange={e => setChannelAnimation(e.target.value)}
              style={{ fontSize: 15, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #ccc', marginBottom: 8 }}
            >
              <option value="none">None</option>
              <option value="pulse">Pulse</option>
              <option value="bounce">Bounce</option>
              <option value="wiggle">Wiggle</option>
              <option value="glow">Glow</option>
              <option value="parallax">Parallax</option>
              <option value="flip">Flip</option>
              <option value="swing">Swing</option>
              <option value="shake">Shake</option>
              <option value="pop">Pop</option>
              <option value="slide">Slide</option>
              <option value="colorcycle">Color Cycle</option>
              <option value="sparkle">Sparkle</option>
              <option value="heartbeat">Heartbeat</option>
              <option value="orbit">Orbit</option>
              <option value="wave">Wave</option>
              <option value="jelly">Jelly</option>
              <option value="zoom">Zoom</option>
              <option value="rotate">Rotate</option>
              <option value="glowtrail">Glow Trail</option>
              <option value="random">Random</option>
              <option value="fullrandom">Full Random (cycle animations)</option>
            </select>
            <Text as="p" size="sm" color="#888">Choose how your channel icons animate on the home screen. No hover needed—animations will play automatically.</Text>
          </div>
        </div>

        {/* Ken Burns Effect */}
        <div className="wee-card" style={{ marginBottom: 18 }}>
          <div className="wee-card-header">
            <Text as="span" size="lg" weight={700} className="wee-card-title">Ken Burns Effect</Text>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={kenBurnsEnabled}
                onChange={e => setKenBurnsEnabled(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            <Text as="p" size="sm" color="#888" style={{ marginBottom: 12 }}>
              Adds cinematic zoom and pan effects to channel images for a more dynamic experience.
            </Text>
            
            {kenBurnsEnabled && (
              <>
                <Text as="label" size="md" weight={500} style={{ display: 'block', marginBottom: 8 }}>Default Activation Mode</Text>
                <select
                  value={kenBurnsMode}
                  onChange={e => setKenBurnsMode(e.target.value)}
                  style={{ 
                    fontSize: 15, 
                    padding: '8px 12px', 
                    borderRadius: 8, 
                    border: '1.5px solid #ccc', 
                    marginBottom: 8,
                    width: '200px'
                  }}
                >
                  <option value="hover">Hover to Activate</option>
                  <option value="autoplay">Always Active</option>
                </select>
                <Text as="p" size="sm" color="#888" style={{ marginBottom: 16 }}>
                  {kenBurnsMode === 'hover' 
                    ? 'Ken Burns effect will only play when hovering over channels.' 
                    : 'Ken Burns effect will continuously play on all channels.'}
                </Text>

                {/* Advanced Controls Toggle */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAdvancedKenBurns(!showAdvancedKenBurns)}
                  style={{ marginBottom: showAdvancedKenBurns ? 16 : 0 }}
                >
                  {showAdvancedKenBurns ? 'Hide' : 'Show'} Advanced Controls
                </Button>

                {/* Advanced Controls Section */}
                {showAdvancedKenBurns && (
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: 16, 
                    borderRadius: 8, 
                    border: '1px solid #e0e0e6',
                    marginTop: 8
                  }}>
                    <Text as="h4" size="md" weight={600} style={{ marginBottom: 12, color: '#333' }}>
                      Animation Settings
                    </Text>

                    {/* Scale Controls */}
                    <div style={{ marginBottom: 16 }}>
                      <Text as="label" size="sm" weight={500} style={{ display: 'block', marginBottom: 8 }}>
                        Zoom Scale Levels
                      </Text>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                          <Text as="label" size="xs" style={{ display: 'block', marginBottom: 4, color: '#666' }}>
                            Hover Scale
                          </Text>
                          <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.05"
                            value={kenBurnsHoverScale}
                            onChange={e => setKenBurnsHoverScale(parseFloat(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsHoverScale}×</Text>
                        </div>
                        
                        <div>
                          <Text as="label" size="xs" style={{ display: 'block', marginBottom: 4, color: '#666' }}>
                            Autoplay Scale
                          </Text>
                          <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.05"
                            value={kenBurnsAutoplayScale}
                            onChange={e => setKenBurnsAutoplayScale(parseFloat(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsAutoplayScale}×</Text>
                        </div>
                        
                        <div>
                          <Text as="label" size="xs" style={{ display: 'block', marginBottom: 4, color: '#666' }}>
                            Slideshow Scale
                          </Text>
                          <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.05"
                            value={kenBurnsSlideshowScale}
                            onChange={e => setKenBurnsSlideshowScale(parseFloat(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsSlideshowScale}×</Text>
                        </div>
                      </div>
                    </div>

                    {/* Duration Controls */}
                    <div style={{ marginBottom: 16 }}>
                      <Text as="label" size="sm" weight={500} style={{ display: 'block', marginBottom: 8 }}>
                        Animation Durations
                      </Text>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <Text as="label" size="xs" style={{ display: 'block', marginBottom: 4, color: '#666' }}>
                            Hover Duration
                          </Text>
                          <input
                            type="range"
                            min="2000"
                            max="20000"
                            step="500"
                            value={kenBurnsHoverDuration}
                            onChange={e => setKenBurnsHoverDuration(parseInt(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsHoverDuration / 1000}s</Text>
                        </div>
                        
                        <div>
                          <Text as="label" size="xs" style={{ display: 'block', marginBottom: 4, color: '#666' }}>
                            Autoplay Duration
                          </Text>
                          <input
                            type="range"
                            min="5000"
                            max="30000"
                            step="1000"
                            value={kenBurnsAutoplayDuration}
                            onChange={e => setKenBurnsAutoplayDuration(parseInt(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsAutoplayDuration / 1000}s</Text>
                        </div>
                        
                        <div>
                          <Text as="label" size="xs" style={{ display: 'block', marginBottom: 4, color: '#666' }}>
                            Slideshow Duration
                          </Text>
                          <input
                            type="range"
                            min="5000"
                            max="30000"
                            step="1000"
                            value={kenBurnsSlideshowDuration}
                            onChange={e => setKenBurnsSlideshowDuration(parseInt(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsSlideshowDuration / 1000}s</Text>
                        </div>
                        
                        <div>
                          <Text as="label" size="xs" style={{ display: 'block', marginBottom: 4, color: '#666' }}>
                            Crossfade Duration
                          </Text>
                          <input
                            type="range"
                            min="500"
                            max="3000"
                            step="100"
                            value={kenBurnsCrossfadeDuration}
                            onChange={e => setKenBurnsCrossfadeDuration(parseInt(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsCrossfadeDuration / 1000}s</Text>
                        </div>
                      </div>
                    </div>

                    <Text as="p" size="xs" color="#666" style={{ fontStyle: 'italic' }}>
                      These settings will be used as defaults for all channels. Individual channels can override these values.
                    </Text>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </BaseModal>
  );
}

GeneralSettingsModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  immersivePip: PropTypes.bool,
  setImmersivePip: PropTypes.func,
  glassWiiRibbon: PropTypes.bool,
  setGlassWiiRibbon: PropTypes.func,
  animatedOnHover: PropTypes.bool,
  setAnimatedOnHover: PropTypes.func,
  startInFullscreen: PropTypes.bool,
  setStartInFullscreen: PropTypes.func,
  showPresetsButton: PropTypes.bool,
  setShowPresetsButton: PropTypes.func,
  onSettingsChange: PropTypes.func,
  channelAnimation: PropTypes.string,
  kenBurnsEnabled: PropTypes.bool,
  kenBurnsMode: PropTypes.string,
  kenBurnsHoverScale: PropTypes.number,
  kenBurnsAutoplayScale: PropTypes.number,
  kenBurnsSlideshowScale: PropTypes.number,
  kenBurnsHoverDuration: PropTypes.number,
  kenBurnsAutoplayDuration: PropTypes.number,
  kenBurnsSlideshowDuration: PropTypes.number,
  kenBurnsCrossfadeDuration: PropTypes.number,
};

export default GeneralSettingsModal; 