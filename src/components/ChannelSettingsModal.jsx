import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';

const ChannelSettingsModal = ({ 
  isOpen, 
  onClose, 
  onSettingsChange,
  adaptiveEmptyChannels,
  channelAnimation,
  animatedOnHover,
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
  kenBurnsTransitionType,
  channelAutoFadeTimeout
}) => {
  const [localAdaptiveEmptyChannels, setLocalAdaptiveEmptyChannels] = useState(adaptiveEmptyChannels ?? true);
  const [localChannelAnimation, setLocalChannelAnimation] = useState(channelAnimation || 'none');
  const [localAnimatedOnHover, setLocalAnimatedOnHover] = useState(animatedOnHover ?? false);
  const [localIdleAnimationEnabled, setLocalIdleAnimationEnabled] = useState(idleAnimationEnabled ?? false);
  const [localIdleAnimationTypes, setLocalIdleAnimationTypes] = useState(idleAnimationTypes || ['pulse', 'bounce', 'glow']);
  const [localIdleAnimationInterval, setLocalIdleAnimationInterval] = useState(idleAnimationInterval ?? 8);
  const [localKenBurnsEnabled, setLocalKenBurnsEnabled] = useState(kenBurnsEnabled ?? false);
  const [localKenBurnsMode, setLocalKenBurnsMode] = useState(kenBurnsMode || 'hover');
  const [localKenBurnsHoverScale, setLocalKenBurnsHoverScale] = useState(kenBurnsHoverScale ?? 1.1);
  const [localKenBurnsAutoplayScale, setLocalKenBurnsAutoplayScale] = useState(kenBurnsAutoplayScale ?? 1.15);
  const [localKenBurnsSlideshowScale, setLocalKenBurnsSlideshowScale] = useState(kenBurnsSlideshowScale ?? 1.08);
  const [localKenBurnsHoverDuration, setLocalKenBurnsHoverDuration] = useState(kenBurnsHoverDuration ?? 8000);
  const [localKenBurnsAutoplayDuration, setLocalKenBurnsAutoplayDuration] = useState(kenBurnsAutoplayDuration ?? 12000);
  const [localKenBurnsSlideshowDuration, setLocalKenBurnsSlideshowDuration] = useState(kenBurnsSlideshowDuration ?? 10000);
  const [localKenBurnsCrossfadeDuration, setLocalKenBurnsCrossfadeDuration] = useState(kenBurnsCrossfadeDuration ?? 1000);
  const [localKenBurnsForGifs, setLocalKenBurnsForGifs] = useState(kenBurnsForGifs ?? false);
  const [localKenBurnsForVideos, setLocalKenBurnsForVideos] = useState(kenBurnsForVideos ?? false);
  const [localKenBurnsEasing, setLocalKenBurnsEasing] = useState(kenBurnsEasing || 'ease-out');
  const [localKenBurnsAnimationType, setLocalKenBurnsAnimationType] = useState(kenBurnsAnimationType || 'both');
  const [localKenBurnsCrossfadeReturn, setLocalKenBurnsCrossfadeReturn] = useState(kenBurnsCrossfadeReturn !== false);
  const [localKenBurnsTransitionType, setLocalKenBurnsTransitionType] = useState(kenBurnsTransitionType || 'cross-dissolve');
  const [localChannelAutoFadeTimeout, setLocalChannelAutoFadeTimeout] = useState(channelAutoFadeTimeout ?? 5);

  // Update local state when props change
  useEffect(() => {
    setLocalAdaptiveEmptyChannels(adaptiveEmptyChannels ?? true);
    setLocalChannelAnimation(channelAnimation || 'none');
    setLocalAnimatedOnHover(animatedOnHover ?? false);
    setLocalIdleAnimationEnabled(idleAnimationEnabled ?? false);
    setLocalIdleAnimationTypes(idleAnimationTypes || ['pulse', 'bounce', 'glow']);
    setLocalIdleAnimationInterval(idleAnimationInterval ?? 8);
    setLocalKenBurnsEnabled(kenBurnsEnabled ?? false);
    setLocalKenBurnsMode(kenBurnsMode || 'hover');
    setLocalKenBurnsHoverScale(kenBurnsHoverScale ?? 1.1);
    setLocalKenBurnsAutoplayScale(kenBurnsAutoplayScale ?? 1.15);
    setLocalKenBurnsSlideshowScale(kenBurnsSlideshowScale ?? 1.08);
    setLocalKenBurnsHoverDuration(kenBurnsHoverDuration ?? 8000);
    setLocalKenBurnsAutoplayDuration(kenBurnsAutoplayDuration ?? 12000);
    setLocalKenBurnsSlideshowDuration(kenBurnsSlideshowDuration ?? 10000);
    setLocalKenBurnsCrossfadeDuration(kenBurnsCrossfadeDuration ?? 1000);
    setLocalKenBurnsForGifs(kenBurnsForGifs ?? false);
    setLocalKenBurnsForVideos(kenBurnsForVideos ?? false);
    setLocalKenBurnsEasing(kenBurnsEasing || 'ease-out');
    setLocalKenBurnsAnimationType(kenBurnsAnimationType || 'both');
    setLocalKenBurnsCrossfadeReturn(kenBurnsCrossfadeReturn !== false);
    setLocalKenBurnsTransitionType(kenBurnsTransitionType || 'cross-dissolve');
    setLocalChannelAutoFadeTimeout(channelAutoFadeTimeout ?? 5);
  }, [adaptiveEmptyChannels, channelAnimation, animatedOnHover, idleAnimationEnabled, idleAnimationTypes, idleAnimationInterval, kenBurnsEnabled, kenBurnsMode, kenBurnsHoverScale, kenBurnsAutoplayScale, kenBurnsSlideshowScale, kenBurnsHoverDuration, kenBurnsAutoplayDuration, kenBurnsSlideshowDuration, kenBurnsCrossfadeDuration, kenBurnsForGifs, kenBurnsForVideos, kenBurnsEasing, kenBurnsAnimationType, kenBurnsCrossfadeReturn, kenBurnsTransitionType, channelAutoFadeTimeout]);

  const handleSave = () => {
    if (onSettingsChange) {
      onSettingsChange({
        adaptiveEmptyChannels: localAdaptiveEmptyChannels,
        channelAnimation: localChannelAnimation,
        animatedOnHover: localAnimatedOnHover,
        idleAnimationEnabled: localIdleAnimationEnabled,
        idleAnimationTypes: localIdleAnimationTypes,
        idleAnimationInterval: localIdleAnimationInterval,
        kenBurnsEnabled: localKenBurnsEnabled,
        kenBurnsMode: localKenBurnsMode,
        kenBurnsHoverScale: localKenBurnsHoverScale,
        kenBurnsAutoplayScale: localKenBurnsAutoplayScale,
        kenBurnsSlideshowScale: localKenBurnsSlideshowScale,
        kenBurnsHoverDuration: localKenBurnsHoverDuration,
        kenBurnsAutoplayDuration: localKenBurnsAutoplayDuration,
        kenBurnsSlideshowDuration: localKenBurnsSlideshowDuration,
        kenBurnsCrossfadeDuration: localKenBurnsCrossfadeDuration,
        kenBurnsForGifs: localKenBurnsForGifs,
        kenBurnsForVideos: localKenBurnsForVideos,
        kenBurnsEasing: localKenBurnsEasing,
        kenBurnsAnimationType: localKenBurnsAnimationType,
        kenBurnsCrossfadeReturn: localKenBurnsCrossfadeReturn,
        kenBurnsTransitionType: localKenBurnsTransitionType,
        channelAutoFadeTimeout: localChannelAutoFadeTimeout,
      });
    }
    onClose();
  };

  const handleIdleAnimationTypeToggle = (type) => {
    setLocalIdleAnimationTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Channel Settings"
      onClose={onClose}
      maxWidth="800px"
      footerContent={({ handleClose }) => (
        <div style={{  textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={handleSave} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      {/* Adaptive Empty Channel Backgrounds */}
      {/* <div className="wee-card">
        <div className="wee-card-header">
          <span className="wee-card-title">Adaptive Empty Channel Backgrounds</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={localAdaptiveEmptyChannels}
              onChange={e => setLocalAdaptiveEmptyChannels(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">When enabled, empty channel slots will automatically adapt their background to match the current wallpaper, creating a more cohesive visual experience.</div>
      </div> */}

      {/* Channel Animation */}
      {/* <div className="wee-card">
        <div className="wee-card-header">
          <span className="wee-card-title">Channel Animation</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">Choose how channel items animate when interacted with.</div>
        <div style={{ marginTop: 12 }}>
          <select
            value={localChannelAnimation}
            onChange={e => setLocalChannelAnimation(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
          >
            <option value="none">None</option>
            <option value="pulse">Pulse</option>
            <option value="bounce">Bounce</option>
            <option value="glow">Glow</option>
            <option value="heartbeat">Heartbeat</option>
            <option value="shake">Shake</option>
            <option value="wiggle">Wiggle</option>
          </select>
        </div>
      </div> */}

      {/* Only play channel animations on hover */}
      <div className="wee-card">
        <div className="wee-card-header">
          <span className="wee-card-title">Only play channel animations on hover</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={localAnimatedOnHover}
              onChange={e => setLocalAnimatedOnHover(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">When enabled, animated channel art (GIFs/MP4s) will only play when you hover over a channel. When disabled, animations will play automatically.</div>
      </div>

      {/* Idle Channel Animations */}
      <div className="wee-card">
        <div className="wee-card-header">
          <span className="wee-card-title">Idle Channel Animations</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={localIdleAnimationEnabled}
              onChange={e => setLocalIdleAnimationEnabled(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">When enabled, channels will play subtle animations when not being interacted with, adding life to the interface.</div>
        
        {localIdleAnimationEnabled && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Animation Types:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['pulse', 'bounce', 'glow', 'heartbeat', 'shake', 'wiggle'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={localIdleAnimationTypes.includes(type)}
                      onChange={() => handleIdleAnimationTypeToggle(type)}
                      style={{ width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 14, textTransform: 'capitalize' }}>{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Animation Interval: {localIdleAnimationInterval} seconds</div>
              <input
                type="range"
                min={2}
                max={20}
                value={localIdleAnimationInterval}
                onChange={e => setLocalIdleAnimationInterval(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Ken Burns Effect */}
      <div className="wee-card">
        <div className="wee-card-header">
          <span className="wee-card-title">Ken Burns Effect</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={localKenBurnsEnabled}
              onChange={e => setLocalKenBurnsEnabled(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">Add cinematic zoom and pan effects to channel images, creating dynamic visual interest.</div>
        
        {localKenBurnsEnabled && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Trigger Mode:</div>
              <select
                value={localKenBurnsMode}
                onChange={e => setLocalKenBurnsMode(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              >
                <option value="hover">On Hover</option>
                <option value="autoplay">Autoplay</option>
                <option value="slideshow">Slideshow</option>
              </select>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Scale Settings:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Hover Scale: {localKenBurnsHoverScale}</label>
                  <input
                    type="range"
                    min={1.0}
                    max={1.5}
                    step={0.05}
                    value={localKenBurnsHoverScale}
                    onChange={e => setLocalKenBurnsHoverScale(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Autoplay Scale: {localKenBurnsAutoplayScale}</label>
                  <input
                    type="range"
                    min={1.0}
                    max={1.5}
                    step={0.05}
                    value={localKenBurnsAutoplayScale}
                    onChange={e => setLocalKenBurnsAutoplayScale(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Duration Settings:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Hover Duration: {localKenBurnsHoverDuration}ms</label>
                  <input
                    type="range"
                    min={2000}
                    max={15000}
                    step={500}
                    value={localKenBurnsHoverDuration}
                    onChange={e => setLocalKenBurnsHoverDuration(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Autoplay Duration: {localKenBurnsAutoplayDuration}ms</label>
                  <input
                    type="range"
                    min={5000}
                    max={20000}
                    step={500}
                    value={localKenBurnsAutoplayDuration}
                    onChange={e => setLocalKenBurnsAutoplayDuration(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Advanced Settings:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Crossfade Duration: {localKenBurnsCrossfadeDuration}ms</label>
                  <input
                    type="range"
                    min={500}
                    max={3000}
                    step={100}
                    value={localKenBurnsCrossfadeDuration}
                    onChange={e => setLocalKenBurnsCrossfadeDuration(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666' }}>Easing:</label>
                  <select
                    value={localKenBurnsEasing}
                    onChange={e => setLocalKenBurnsEasing(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }}
                  >
                    <option value="ease-out">Ease Out</option>
                    <option value="ease-in">Ease In</option>
                    <option value="ease-in-out">Ease In-Out</option>
                    <option value="linear">Linear</option>
                  </select>
                </div>
              </div>
            </div>

            {/* <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Media Types:</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localKenBurnsForGifs}
                    onChange={e => setLocalKenBurnsForGifs(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 14 }}>Apply to GIFs</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localKenBurnsForVideos}
                    onChange={e => setLocalKenBurnsForVideos(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 14 }}>Apply to Videos</span>
                </label>
              </div>
            </div> */}
          </>
        )}
      </div>

      {/* Channel Auto-Fade */}
      <div className="wee-card">
        <div className="wee-card-header">
          <span className="wee-card-title">Channel Auto-Fade</span>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={localChannelAutoFadeTimeout > 0}
              onChange={e => setLocalChannelAutoFadeTimeout(e.target.checked ? 5 : 0)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">Automatically lower the opacity of channel items when they haven't been hovered over for a while, allowing the wallpaper to shine through. Hovering over any channel will restore full opacity.</div>
        
        {localChannelAutoFadeTimeout > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Fade Timeout: {localChannelAutoFadeTimeout}s</div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={localChannelAutoFadeTimeout}
              onChange={e => setLocalChannelAutoFadeTimeout(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
              <strong>Fade Timeout:</strong> The time in seconds before channels start to fade out when not hovered.
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

ChannelSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func.isRequired,
  adaptiveEmptyChannels: PropTypes.bool,
  channelAnimation: PropTypes.string,
  animatedOnHover: PropTypes.bool,
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
  kenBurnsAnimationType: PropTypes.string,
  kenBurnsCrossfadeReturn: PropTypes.bool,
  kenBurnsTransitionType: PropTypes.string,
  channelAutoFadeTimeout: PropTypes.number,
};

export default ChannelSettingsModal; 