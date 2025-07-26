import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';
import Toggle from '../ui/Toggle';
import Text from '../ui/Text';
import Button from '../ui/Button';

function GeneralSettingsModal({ isOpen, onClose, immersivePip, setImmersivePip, glassWiiRibbon, setGlassWiiRibbon, animatedOnHover, setAnimatedOnHover, startInFullscreen, setStartInFullscreen, showPresetsButton, setShowPresetsButton, showDock, setShowDock, onSettingsChange, ...props }) {
  const [pip, setPip] = useState(immersivePip);
  const [glassRibbon, setGlassRibbon] = useState(glassWiiRibbon);
  const [hoverAnim, setHoverAnim] = useState(animatedOnHover);
  const [fullscreen, setFullscreen] = useState(startInFullscreen);
  const [showPresets, setShowPresets] = useState(showPresetsButton);
  const [showDockState, setShowDockState] = useState(showDock ?? true);
  const [startOnBoot, setStartOnBoot] = useState(false);
  const [channelAnimation, setChannelAnimation] = useState(props.channelAnimation || 'none');
  const [adaptiveEmptyChannels, setAdaptiveEmptyChannels] = useState(props.adaptiveEmptyChannels ?? true);
  
  // Idle channel animation settings
  const [idleAnimationEnabled, setIdleAnimationEnabled] = useState(props.idleAnimationEnabled ?? false);
  const [idleAnimationTypes, setIdleAnimationTypes] = useState(props.idleAnimationTypes || ['pulse', 'bounce', 'glow']);
  const [idleAnimationInterval, setIdleAnimationInterval] = useState(props.idleAnimationInterval ?? 8);
  
  // Ken Burns settings
  const [kenBurnsEnabled, setKenBurnsEnabled] = useState(props.kenBurnsEnabled ?? false);
  const [kenBurnsMode, setKenBurnsMode] = useState(props.kenBurnsMode || 'hover');
  
  // Advanced Ken Burns controls
  const [kenBurnsHoverScale, setKenBurnsHoverScale] = useState(props.kenBurnsHoverScale ?? 1.1);
  const [kenBurnsAutoplayScale, setKenBurnsAutoplayScale] = useState(props.kenBurnsAutoplayScale ?? 1.15);
  const [kenBurnsSlideshowScale, setKenBurnsSlideshowScale] = useState(props.kenBurnsSlideshowScale ?? 1.08);
  const [kenBurnsHoverDuration, setKenBurnsHoverDuration] = useState(props.kenBurnsHoverDuration ?? 8000);
  const [kenBurnsAutoplayDuration, setKenBurnsAutoplayDuration] = useState(props.kenBurnsAutoplayDuration ?? 12000);
  const [kenBurnsSlideshowDuration, setKenBurnsSlideshowDuration] = useState(props.kenBurnsSlideshowDuration ?? 10000);
  const [kenBurnsCrossfadeDuration, setKenBurnsCrossfadeDuration] = useState(props.kenBurnsCrossfadeDuration ?? 1000);
  const [showAdvancedKenBurns, setShowAdvancedKenBurns] = useState(false);
  
  // Ken Burns media type support
  const [kenBurnsForGifs, setKenBurnsForGifs] = useState(props.kenBurnsForGifs ?? false);
  const [kenBurnsForVideos, setKenBurnsForVideos] = useState(props.kenBurnsForVideos ?? false);
  
  // Ken Burns animation easing
  const [kenBurnsEasing, setKenBurnsEasing] = useState(props.kenBurnsEasing || 'ease-out');
  const [kenBurnsAnimationType, setKenBurnsAnimationType] = useState(props.kenBurnsAnimationType || 'both');
  const [kenBurnsCrossfadeReturn, setKenBurnsCrossfadeReturn] = useState(props.kenBurnsCrossfadeReturn !== false);
  const [kenBurnsTransitionType, setKenBurnsTransitionType] = useState(props.kenBurnsTransitionType || 'cross-dissolve');
  
  // Always show advanced controls when Ken Burns is enabled
  const shouldShowAdvanced = kenBurnsEnabled && (showAdvancedKenBurns || kenBurnsEnabled);

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
    setShowDock(showDockState);
    if (onSettingsChange) {
      onSettingsChange({ 
        channelAnimation,
        adaptiveEmptyChannels,
        idleAnimationEnabled,
        idleAnimationTypes,
        idleAnimationInterval,
        kenBurnsEnabled,
        kenBurnsMode,
        kenBurnsHoverScale,
        kenBurnsAutoplayScale,
        kenBurnsSlideshowScale,
        kenBurnsHoverDuration,
        kenBurnsAutoplayDuration,
        kenBurnsSlideshowDuration,
        kenBurnsCrossfadeDuration,
        kenBurnsForGifs,
        kenBurnsForVideos,
        kenBurnsEasing,
        kenBurnsAnimationType,
        kenBurnsCrossfadeReturn,
        kenBurnsTransitionType
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
        {/* Show Dock */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Show Dock</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={showDockState}
                onChange={e => setShowDockState(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, the Wii Ribbon dock will be visible at the bottom of the screen. When disabled, the dock will be hidden for a cleaner look.</div>
        </div>
        {/* Adaptive Empty Channel Backgrounds */}
        <div className="wee-card">
          <div className="wee-card-header">
            <span className="wee-card-title">Adaptive Empty Channel Backgrounds</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={adaptiveEmptyChannels}
                onChange={e => setAdaptiveEmptyChannels(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">When enabled, empty channels will use the same background color as the ribbon for a cohesive look.</div>
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
        {/* <div className="wee-card" style={{ marginBottom: 18 }}>
          <div className="wee-card-header">
            <Text as="span" size="lg" weight={700} className="wee-card-title">Channel Animations (This Version is on hold, use idle animations instead)</Text>
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
        </div> */}

        {/* Idle Channel Animations */}
        <div className="wee-card" style={{ marginBottom: 18 }}>
          <div className="wee-card-header">
            <Text as="span" size="lg" weight={700} className="wee-card-title">Idle Channel Animations</Text>
            <Toggle
              checked={idleAnimationEnabled}
              onChange={setIdleAnimationEnabled}
            />
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">
            <Text as="p" size="sm" color="#888" style={{ marginBottom: 16 }}>
              When enabled, channels with content will randomly perform playful animations inspired by the Wii Side Navigation. Only applies to channels that have content (apps, games, or media).
            </Text>
            
            {idleAnimationEnabled && (
              <div style={{ marginLeft: 12, paddingLeft: 12, borderLeft: '3px solid #0ea5e9' }}>
                <Text as="label" size="md" weight={500} style={{ display: 'block', marginBottom: 12 }}>
                  Animation Types to Use
                </Text>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                  gap: '8px',
                  marginBottom: 16
                }}>
                  {[
                    'pulse', 'bounce', 'wiggle', 'glow', 'parallax', 'flip', 
                    'swing', 'shake', 'pop', 'slide', 'colorcycle', 'sparkle',
                    'heartbeat', 'orbit', 'wave', 'jelly', 'zoom', 'rotate', 'glowtrail'
                  ].map(animType => (
                    <label key={animType} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontSize: '13px',
                      gap: '6px'
                    }}>
                      <input
                        type="checkbox"
                        checked={idleAnimationTypes.includes(animType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIdleAnimationTypes([...idleAnimationTypes, animType]);
                          } else {
                            setIdleAnimationTypes(idleAnimationTypes.filter(t => t !== animType));
                          }
                        }}
                        style={{ marginRight: 0 }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{animType}</span>
                    </label>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text as="label" size="md" weight={500} style={{ display: 'block', marginBottom: 8 }}>
                    Animation Frequency: Every {idleAnimationInterval} seconds
                  </Text>
                  <input
                    type="range"
                    min="2"
                    max="45"
                    step="1"
                    value={idleAnimationInterval}
                    onChange={(e) => setIdleAnimationInterval(parseInt(e.target.value))}
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                  <Text as="p" size="xs" color="#888">
                    How often random channels will trigger animations. Minimum 6 seconds to avoid overwhelming the interface.
                  </Text>
                </div>

                <div style={{ 
                  background: '#f0f8ff', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '1px solid #0ea5e9'
                }}>
                  <Text as="p" size="sm" style={{ margin: 0, color: '#0284c7' }}>
                    <strong>💡 Tip:</strong> Select multiple animation types for variety! Each time a channel animates, 
                    it will randomly choose from your selected types. This creates a living, dynamic interface 
                    similar to the playful Wii Side Navigation buttons.
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ken Burns Effect */}
        <div className="wee-card" style={{ marginBottom: 18 }}>
          <div className="wee-card-header">
            <Text as="span" size="lg" weight={700} className="wee-card-title">Ken Burns Effect</Text>
            <Toggle
              checked={kenBurnsEnabled}
              onChange={setKenBurnsEnabled}
            />
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

                {/* Advanced Controls Section - Always visible when Ken Burns enabled */}
                {shouldShowAdvanced && (
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text as="label" size="sm" weight={500}>
                          Zoom Scale Levels
                        </Text>
                        <span style={{ 
                          color: '#6c757d', 
                          fontSize: '12px', 
                          background: '#f8f9fa', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          border: '1px solid #e9ecef'
                        }}>
                          How much the image zooms during animation
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text as="label" size="xs" style={{ color: '#666', fontWeight: 500 }}>
                              Hover Scale
                            </Text>
                            <span style={{ 
                              color: '#8e9aaf', 
                              fontSize: '10px',
                              cursor: 'help'
                            }} title="Controls how much the image zooms when you hover over a channel. 1.1× = subtle effect, 1.3× = noticeable zoom, 1.5× = dramatic cinematic effect. Higher values create more dramatic visual impact.">
                              ?
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.05"
                            value={kenBurnsHoverScale}
                            onChange={e => setKenBurnsHoverScale(parseFloat(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsHoverScale}× zoom</Text>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text as="label" size="xs" style={{ color: '#666', fontWeight: 500 }}>
                              Autoplay Scale
                            </Text>
                            <span style={{ 
                              color: '#8e9aaf', 
                              fontSize: '10px',
                              cursor: 'help'
                            }} title="Controls zoom level when Ken Burns mode is set to 'Always Active'. This creates continuous slow-motion zoom effects even when not hovering. Use lower values (1.1-1.2×) for subtle background animation or higher (1.4-1.6×) for eye-catching movement.">
                              ?
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.05"
                            value={kenBurnsAutoplayScale}
                            onChange={e => setKenBurnsAutoplayScale(parseFloat(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsAutoplayScale}× zoom</Text>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text as="label" size="xs" style={{ color: '#666', fontWeight: 500 }}>
                              Slideshow Scale
                            </Text>
                            <span style={{ 
                              color: '#8e9aaf', 
                              fontSize: '10px',
                              cursor: 'help'
                            }} title="[FEATURE NOT READY] Controls zoom level for multi-image gallery slideshows. Currently only affects single images. Gallery feature is being perfected.">
                              ?
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.05"
                            value={kenBurnsSlideshowScale}
                            onChange={e => setKenBurnsSlideshowScale(parseFloat(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsSlideshowScale}× zoom</Text>
                        </div>
                      </div>
                      <Text as="p" size="xs" color="#6c757d" style={{ marginTop: 8, fontStyle: 'italic' }}>
                        💡 <strong>1.0×</strong> = no zoom, <strong>1.1×</strong> = subtle, <strong>1.5×</strong> = dramatic
                      </Text>
                    </div>

                    {/* Duration Controls */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text as="label" size="sm" weight={500}>
                          Animation Durations
                        </Text>
                        <span style={{ 
                          color: '#6c757d', 
                          fontSize: '12px', 
                          background: '#f8f9fa', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          border: '1px solid #e9ecef'
                        }}>
                          How long each animation takes to complete
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text as="label" size="xs" style={{ color: '#666', fontWeight: 500 }}>
                              Hover Duration
                            </Text>
                            <span style={{ 
                              color: '#8e9aaf', 
                              fontSize: '10px',
                              cursor: 'help'
                            }} title="Duration of the zoom animation when hovering over a channel. Shorter times (2-5s) feel responsive and snappy, medium times (6-10s) provide smooth cinematic feel, longer times (15-20s) create slow, dramatic effects. Consider user patience vs visual impact.">
                              ?
                            </span>
                          </div>
                          <input
                            type="range"
                            min="2000"
                            max="20000"
                            step="500"
                            value={kenBurnsHoverDuration}
                            onChange={e => setKenBurnsHoverDuration(parseInt(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsHoverDuration / 1000}s duration</Text>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text as="label" size="xs" style={{ color: '#666', fontWeight: 500 }}>
                              Autoplay Duration
                            </Text>
                            <span style={{ 
                              color: '#8e9aaf', 
                              fontSize: '10px',
                              cursor: 'help'
                            }} title="Duration of each zoom cycle when Ken Burns is 'Always Active'. This controls how long it takes to complete one full zoom in-and-out cycle. Shorter cycles (5-10s) create energetic backgrounds, longer cycles (15-30s) provide subtle, ambient movement that won't distract from other content.">
                              ?
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5000"
                            max="30000"
                            step="1000"
                            value={kenBurnsAutoplayDuration}
                            onChange={e => setKenBurnsAutoplayDuration(parseInt(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsAutoplayDuration / 1000}s cycle</Text>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text as="label" size="xs" style={{ color: '#666', fontWeight: 500 }}>
                              Slideshow Duration
                            </Text>
                            <span style={{ 
                              color: '#8e9aaf', 
                              fontSize: '10px',
                              cursor: 'help'
                            }} title="[FEATURE NOT READY] How long each image displays in multi-image gallery slideshows. Currently only affects single image autoplay. Gallery feature is being perfected.">
                              ?
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5000"
                            max="30000"
                            step="1000"
                            value={kenBurnsSlideshowDuration}
                            onChange={e => setKenBurnsSlideshowDuration(parseInt(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsSlideshowDuration / 1000}s per image</Text>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text as="label" size="xs" style={{ color: '#666', fontWeight: 500 }}>
                              Crossfade Duration
                            </Text>
                            <span style={{ 
                              color: '#8e9aaf', 
                              fontSize: '10px',
                              cursor: 'help'
                            }} title="[FEATURE NOT READY] Duration of the fade transition between images in gallery slideshows. Currently only affects single image crossfade returns. Gallery feature is being perfected.">
                              ?
                            </span>
                          </div>
                          <input
                            type="range"
                            min="500"
                            max="3000"
                            step="100"
                            value={kenBurnsCrossfadeDuration}
                            onChange={e => setKenBurnsCrossfadeDuration(parseInt(e.target.value))}
                            style={{ width: '100%', marginBottom: 4 }}
                          />
                          <Text size="xs" color="#888">{kenBurnsCrossfadeDuration / 1000}s transition</Text>
                        </div>
                      </div>
                      <Text as="p" size="xs" color="#6c757d" style={{ marginTop: 8, fontStyle: 'italic' }}>
                        ⏱️ <strong>Shorter</strong> = snappy and energetic, <strong>Longer</strong> = smooth and cinematic
                      </Text>
                    </div>

                    {/* Animation Timing */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text as="label" size="sm" weight={500}>
                          Animation Style
                        </Text>
                        <span style={{ 
                          color: '#6c757d', 
                          fontSize: '12px', 
                          background: '#f8f9fa', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          border: '1px solid #e9ecef'
                        }}>
                          How the animation accelerates and decelerates
                        </span>
                      </div>
                      
                      <select
                        value={kenBurnsEasing}
                        onChange={e => setKenBurnsEasing(e.target.value)}
                        style={{ 
                          fontSize: 15, 
                          padding: '8px 12px', 
                          borderRadius: 8, 
                          border: '1.5px solid #ccc', 
                          marginBottom: 8,
                          width: '250px'
                        }}
                      >
                        <option value="linear">📏 Linear - Constant speed</option>
                        <option value="ease-out">🎯 Ease Out - Slow ending (Recommended)</option>
                        <option value="ease-in-out">🌊 Ease In-Out - Smooth curve</option>
                        <option value="ease">⚡ Ease - Natural acceleration</option>
                        <option value="material">🚀 Material Design - Fast ending</option>
                      </select>
                      
                      <div style={{ 
                        background: '#f8f9fa', 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #e9ecef' 
                      }}>
                        <Text as="p" size="xs" color="#495057" style={{ fontWeight: 500 }}>
                          {kenBurnsEasing === 'linear' && '📏 Moves at constant speed throughout - mechanical but predictable.'}
                          {kenBurnsEasing === 'ease-out' && '🎯 Starts fast and slows down gracefully - most natural and recommended.'}
                          {kenBurnsEasing === 'ease-in-out' && '🌊 Starts slow, speeds up, then slows down - creates smooth wave-like motion.'}
                          {kenBurnsEasing === 'ease' && '⚡ Standard browser easing with gentle acceleration - classic and reliable.'}
                          {kenBurnsEasing === 'material' && '🚀 Material Design curve that accelerates toward the end - modern but can feel rushed.'}
                        </Text>
                      </div>
                    </div>

                    {/* Animation Type */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text as="label" size="sm" weight={500}>
                          Animation Type
                        </Text>
                        <span style={{ 
                          color: '#6c757d', 
                          fontSize: '12px', 
                          background: '#f8f9fa', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          border: '1px solid #e9ecef'
                        }}>
                          Choose between zoom, pan, or both effects
                        </span>
                      </div>
                      
                      <select
                        value={kenBurnsAnimationType || 'both'}
                        onChange={e => setKenBurnsAnimationType(e.target.value)}
                        style={{ 
                          fontSize: 15, 
                          padding: '8px 12px', 
                          borderRadius: 8, 
                          border: '1.5px solid #ccc', 
                          marginBottom: 8,
                          width: '250px'
                        }}
                      >
                        <option value="both">🎭 Both - Zoom + Pan (Classic)</option>
                        <option value="zoom">🔍 Zoom Only - Scaling effect</option>
                        <option value="pan">📷 Pan Only - Movement effect</option>
                      </select>
                      
                      <div style={{ 
                        background: '#f8f9fa', 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #e9ecef' 
                      }}>
                        <Text as="p" size="xs" color="#495057" style={{ fontWeight: 500 }}>
                          {(kenBurnsAnimationType || 'both') === 'both' && '🎭 Classic Ken Burns with both zooming and panning - creates the most dynamic and cinematic effect.'}
                          {kenBurnsAnimationType === 'zoom' && '🔍 Only scales the image larger without movement - subtle and elegant, great for portraits.'}
                          {kenBurnsAnimationType === 'pan' && '📷 Only moves across the image without scaling - smooth and gentle, ideal for landscapes.'}
                        </Text>
                      </div>
                    </div>

                    {/* Transition Type */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text as="label" size="sm" weight={500}>
                          Slideshow Transition <span style={{ color: '#dc3545', fontSize: '11px' }}>(Not Ready)</span>
                        </Text>
                        <span style={{ 
                          color: '#6c757d', 
                          fontSize: '12px', 
                          background: '#f8f9fa', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          border: '1px solid #e9ecef'
                        }}>
                          How images blend together in gallery mode
                        </span>
                      </div>
                      
                      <select
                        value={kenBurnsTransitionType}
                        onChange={e => setKenBurnsTransitionType(e.target.value)}
                        style={{ 
                          fontSize: 15, 
                          padding: '8px 12px', 
                          borderRadius: 8, 
                          border: '1.5px solid #ccc', 
                          marginBottom: 8,
                          width: '300px'
                        }}
                      >
                        <option value="cross-dissolve">✨ Cross-Dissolve - Classic fade blend</option>
                        <option value="morph-blur">🌊 Morph-Blur - Dreamy blur transition</option>
                        <option value="push-zoom">🔍 Push-Zoom - Scale & reveal effect</option>
                        <option value="swirl-fade">🌪️ Swirl-Fade - Gentle rotation blend</option>
                        <option value="slide-dissolve">📱 Slide-Dissolve - Smooth slide transition</option>
                      </select>
                      
                      <div style={{ 
                        background: '#f8f9fa', 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #e9ecef' 
                      }}>
                        <Text as="p" size="xs" color="#495057" style={{ fontWeight: 500 }}>
                          {kenBurnsTransitionType === 'cross-dissolve' && '✨ Classic crossfade - one image gently fades into the next with smooth opacity blending.'}
                          {kenBurnsTransitionType === 'morph-blur' && '🌊 Dreamy morph effect - images blur and scale during transition for an ethereal, soft blend.'}
                          {kenBurnsTransitionType === 'push-zoom' && '🔍 Dynamic reveal - current image shrinks as next image scales up from behind, creating depth.'}
                          {kenBurnsTransitionType === 'swirl-fade' && '🌪️ Subtle rotation - images gently rotate and scale while fading for organic movement.'}
                          {kenBurnsTransitionType === 'slide-dissolve' && '📱 Modern slide - images slide horizontally while cross-fading, like modern photo apps.'}
                        </Text>
                      </div>
                    </div>

                    {/* Crossfade Return */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8, 
                        fontSize: 14,
                        padding: '8px 12px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={kenBurnsCrossfadeReturn !== false}
                          onChange={e => setKenBurnsCrossfadeReturn(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          🔄 <strong>Crossfade Return</strong>
                        </span>
                      </label>
                      <Text as="p" size="xs" color="#6c757d" style={{ marginTop: 4, paddingLeft: 20 }}>
                        For single images: fade back to original position before repeating effect (not used in slideshows)
                      </Text>
                    </div>

                    {/* Media Type Support */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text as="label" size="sm" weight={500}>
                          Media Type Support
                        </Text>
                        <span style={{ 
                          color: '#6c757d', 
                          fontSize: '12px', 
                          background: '#f8f9fa', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          border: '1px solid #e9ecef'
                        }}>
                          Which file types can use Ken Burns effects
                        </span>
                      </div>
                      
                      {/* <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          fontSize: 14,
                          padding: '8px 12px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          border: '1px solid #e9ecef',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={kenBurnsForGifs}
                            onChange={e => setKenBurnsForGifs(e.target.checked)}
                            style={{ margin: 0 }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 500 }}>🎞️ Enable Ken Burns for GIF images</span>
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>
                              Adds zoom and pan effects to animated GIFs
                            </span>
                          </div>
                        </label>
                        
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          fontSize: 14,
                          padding: '8px 12px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          border: '1px solid #e9ecef',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={kenBurnsForVideos}
                            onChange={e => setKenBurnsForVideos(e.target.checked)}
                            style={{ margin: 0 }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 500 }}>🎬 Enable Ken Burns for MP4 videos</span>
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>
                              Adds cinematic effects on top of video content
                            </span>
                          </div>
                        </label>
                      </div> */}
                      
                      <div style={{ 
                        background: '#e7f3ff', 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #b3d9ff',
                        marginTop: 10
                      }}>
                        <Text as="p" size="xs" color="#0066cc" style={{ fontWeight: 500 }}>
                          ℹ️ By default, Ken Burns only applies to static images (JPG, PNG). 
                        </Text>
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
  idleAnimationEnabled: PropTypes.bool,
  idleAnimationTypes: PropTypes.array,
  idleAnimationInterval: PropTypes.number,
  kenBurnsEnabled: PropTypes.bool,
  kenBurnsMode: PropTypes.string,
  kenBurnsHoverScale: PropTypes.number,
  kenBurnsAutoplayScale: PropTypes.number,
  kenBurnsSlideshowScale: PropTypes.number,
  kenBurnsHoverDuration: PropTypes.number,
  kenBurnsAutoplayDuration: PropTypes.number,
  kenBurnsSlideshowDuration: PropTypes.number,
  kenBurnsCrossfadeDuration: PropTypes.number,
  kenBurnsForGifs: PropTypes.bool,
  kenBurnsForVideos: PropTypes.bool,
  kenBurnsEasing: PropTypes.string,
};

export default GeneralSettingsModal; 