import React, { useState, useEffect } from 'react';
import SoundModal from './SoundModal';
import WallpaperModal from './WallpaperModal';
import GeneralSettingsModal from './GeneralSettingsModal';
import PrimaryActionsModal from './PrimaryActionsModal';
import './WiiRibbon.css';
import reactIcon from '../assets/react.svg';
// import more icons as needed

const WiiRibbon = ({ onSettingsClick, onSettingsChange, onToggleDarkMode, onToggleCursor, useCustomCursor, barType, onBarTypeChange, defaultBarType, onDefaultBarTypeChange, glassWiiRibbon, onGlassWiiRibbonChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [showMenuFade, setShowMenuFade] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isFrameless, setIsFrameless] = useState(true);
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [immersivePip, setImmersivePip] = useState(() => {
    // Try to load from localStorage or default to false
    try {
      return JSON.parse(localStorage.getItem('immersivePip')) || false;
    } catch {
      return false;
    }
  });
  const [buttonConfigs, setButtonConfigs] = useState([
    { type: 'text', text: 'Wii', actionType: 'none', action: '' }, // left button
    { type: 'icon', icon: null, text: '', actionType: 'none', action: '' }, // right button
  ]);
  const [activeButtonIndex, setActiveButtonIndex] = useState(null);
  const [showPrimaryActionsModal, setShowPrimaryActionsModal] = useState(false);

  // Load configs from settings on mount
  useEffect(() => {
    async function loadButtonConfigs() {
      if (window.api?.settings?.get) {
        const settings = await window.api.settings.get();
        if (settings && settings.ribbonButtonConfigs) {
          setButtonConfigs(settings.ribbonButtonConfigs);
        }
      }
    }
    loadButtonConfigs();
  }, []);

  // Save configs to settings
  const saveButtonConfigs = async (configs) => {
    setButtonConfigs(configs);
    if (window.api?.settings?.get && window.api?.settings?.set) {
      const settings = await window.api.settings.get();
      await window.api.settings.set({ ...settings, ribbonButtonConfigs: configs });
    }
  };

  const handleButtonContextMenu = (index, e) => {
    e.preventDefault();
    setActiveButtonIndex(index);
    setShowPrimaryActionsModal(true);
  };

  const handlePrimaryActionsSave = (newConfig) => {
    const newConfigs = [...buttonConfigs];
    newConfigs[activeButtonIndex] = newConfig;
    saveButtonConfigs(newConfigs);
    setShowPrimaryActionsModal(false);
  };

  const handlePrimaryActionsCancel = () => {
    setShowPrimaryActionsModal(false);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: '2-digit',
      day: '2-digit'
    }).replace(',', '');
  };

  const handleSettingsClick = () => {
    setShowMenu(true);
    setTimeout(() => setShowMenuFade(true), 10); // trigger fade-in
  };

  const handleMenuClose = () => {
    setShowMenuFade(false);
    setTimeout(() => setShowMenu(false), 200); // match fade-out duration
  };

  // Guard for window.api to prevent errors in browser
  const api = window.api || {
    toggleFullscreen: () => {},
    toggleFrame: () => {},
    minimize: () => {},
    close: () => {},
    onFullscreenState: () => {},
    onFrameState: () => {},
  };

  useEffect(() => {
    if (api.onFullscreenState) {
      api.onFullscreenState((val) => setIsFullscreen(val));
    }
    if (api.onFrameState) {
      api.onFrameState((val) => setIsFrameless(!val));
    }
  }, []);

  // Preavailable icons (add more as needed)
  const preavailableIcons = [
    reactIcon,
    // add more imported icons here
  ];

  const handleButtonClick = (index) => {
    const config = buttonConfigs[index];
    if (!config || !config.actionType || !config.action || config.actionType === 'none') return;
    if (window.api && window.api.launchApp) {
      if (config.actionType === 'exe') {
        window.api.launchApp({ type: 'exe', path: config.action });
      } else if (config.actionType === 'url') {
        window.api.launchApp({ type: 'url', path: config.action });
      }
    } else {
      // Fallback: try window.open for URLs
      if (config.actionType === 'url') {
        window.open(config.action, '_blank');
      }
    }
  };

  return (
    <>
      <footer className="interactive-footer">
          <div className="absolute inset-0 z-0 svg-container-glow">
              <svg width="100%" height="100%" viewBox="0 0 1440 240" preserveAspectRatio="none">
                {glassWiiRibbon && (
                  <defs>
                    <filter id="glass-blur" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="1.2" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="glass-shine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="rgba(255,255,255,0.7)" />
                      <stop offset="60%" stop-color="rgba(255,255,255,0.05)" />
                      <stop offset="100%" stop-color="rgba(255,255,255,0.0)" />
                    </linearGradient>
                  </defs>
                )}
                <path
                  d="M 0 40 
                     L 250 40 
                     C 450 40, 500 140, 670 140 
                     L 770 140 
                     C 940 140, 990 40, 1190 40 
                     L 1440 40 
                     L 1440 240 
                     L 0 240 Z"
                  fill={glassWiiRibbon ? "rgba(255,255,255,0.18)" : "hsl(var(--ribbon-bg))"}
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2"
                  filter={glassWiiRibbon ? "url(#glass-blur)" : undefined}
                  style={glassWiiRibbon ? { transition: 'fill 0.3s' } : {}}
                />
                {glassWiiRibbon && (
                  <path
                    d="M 0 40 
                       L 250 40 
                       C 450 40, 500 140, 670 140 
                       L 770 140 
                       C 940 140, 990 40, 1190 40 
                       L 1440 40 
                       L 1440 120 
                       L 0 120 Z"
                    fill="url(#glass-shine)"
                    style={{ opacity: 0.7, pointerEvents: 'none' }}
                  />
                )}
              </svg>
          </div>

          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-[250px] z-20 text-center pointer-events-none">
              <div id="time" className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(var(--muted-foreground))" }}>
                  {formatTime(currentTime)}
              </div>
              <div id="date" className="text-lg font-bold text-muted-foreground mt-10" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {formatDate(currentTime)}
              </div>
          </div>

          <div className="button-container left absolute w-[120px] left-0 z-10 ml-[-30px] pl-[120px] py-4 bg-white/20 rounded-r-[6rem] flex items-center shadow-lg" style={{ top: '82px' }}>
              <div
                className="wii-style-button min-w-[80px] h-[70px] ml-4 rounded-full bg-white border-4 border-wii-gray shadow-lg flex items-center justify-center cursor-pointer"
                onContextMenu={e => handleButtonContextMenu(0, e)}
                onClick={() => handleButtonClick(0)}
              >
                {buttonConfigs[0].type === 'text' ? (
                  <span className="text-wii-gray-dark font-bold text-sm">{buttonConfigs[0].text || 'Wii'}</span>
                ) : buttonConfigs[0].icon ? (
                  <img src={buttonConfigs[0].icon} alt="icon" style={{ maxHeight: 40, maxWidth: 40 }} />
                ) : (
                  <span className="text-wii-gray-dark font-bold text-sm">Wii</span>
                )}
              </div>
          </div>
          
          <div 
            className={`sd-card-button absolute z-10 settings-cog-button ${glassWiiRibbon ? 'glass-effect' : ''}`}
            style={{ left: '220px', top: '158px' }}
            onClick={handleSettingsClick}
          >
              <svg width="28" height="28" viewBox="0 0 24 24" className="text-wii-gray-dark">
                <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
              </svg>
          </div>

          <div className="button-container right absolute w-[120px] right-0 z-10 mr-[-30px] pr-[120px] py-4 bg-white/20 rounded-l-[6rem] flex items-center shadow-lg" style={{ top: '82px' }}>
              <div className="relative ml-4">
                  <div
                    className="wii-style-button min-w-[80px] h-[70px] rounded-full bg-white border-4 border-wii-gray shadow-lg flex items-center justify-center cursor-pointer"
                    onContextMenu={e => handleButtonContextMenu(1, e)}
                    onClick={() => handleButtonClick(1)}
                  >
                      {buttonConfigs[1].type === 'text' ? (
                        <span className="text-wii-gray-dark font-bold text-sm">{buttonConfigs[1].text || ''}</span>
                      ) : buttonConfigs[1].icon ? (
                        <img src={buttonConfigs[1].icon} alt="icon" style={{ maxHeight: 40, maxWidth: 40 }} />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wii-gray-dark"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      )}
                  </div>
              </div>
          </div>

          {/* Settings Menu */}
          {showMenu && (
            <div className="settings-menu">
              <div
                className={`context-menu-content settings-menu-fade${showMenuFade ? ' in' : ''}`}
                style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
              >
                {/* Appearance Group */}
                <div className="settings-menu-group-label">Appearance</div>
                <div className="context-menu-item" onClick={() => { setShowWallpaperModal(true); handleMenuClose(); }}>
                  Change Wallpaper
                </div>
                <div className="context-menu-item" onClick={() => { onToggleDarkMode(); handleMenuClose(); }}>
                  Toggle Dark Mode
                </div>
                <div className="context-menu-item" onClick={() => { onToggleCursor(); handleMenuClose(); }}>
                  {useCustomCursor ? 'Use Default Cursor' : 'Use Wii Cursor'}
                </div>
                {/* <div className="context-menu-item" onClick={() => { 
                  if (barType === 'flat') {
                    onBarTypeChange('wii-ribbon');
                  } else if (barType === 'wii-ribbon') {
                    onBarTypeChange('wii');
                  } else {
                    onBarTypeChange('flat');
                  }
                  handleMenuClose(); 
                }}>
                  {barType === 'flat' ? 'Switch to Wii Ribbon' : 
                   barType === 'wii-ribbon' ? 'Switch to Wii Bar' : 
                   'Switch to Flat Bar'}
                </div> */}
                <div className="settings-menu-separator" />
                {/* Window Group */}
                <div className="settings-menu-group-label">Window</div>
                <div className="context-menu-item" onClick={() => { api.toggleFullscreen(); handleMenuClose(); }}>
                  {isFullscreen ? 'Window Mode' : 'Fullscreen Mode'}
                </div>
                <div className="context-menu-item" onClick={() => { api.minimize(); handleMenuClose(); }}>
                  Minimize Window
                </div>
                <div className="settings-menu-separator" />
                {/* System Group */}
                <div className="settings-menu-group-label">System</div>
                
                <div className="context-menu-item" onClick={() => { setShowGeneralModal(true); handleMenuClose(); }}>
                  General Settings
                </div>
                <div className="context-menu-item" onClick={() => { setShowSoundModal(true); handleMenuClose(); }}>
                  Change Sounds
                </div>
                <div className="context-menu-item" onClick={() => { api.close(); handleMenuClose(); }}>
                  Close App
                </div>
                <div className="settings-menu-separator" />
                {/* General Group */}
                {/* <div className="settings-menu-group-label">General</div> */}
                <div className="context-menu-item" style={{ color: '#dc3545', fontWeight: 600 }}
                  onClick={async () => {
                    handleMenuClose();
                    if (window.confirm('Are you sure you want to reset all settings, channels, sounds, and wallpapers to default? This cannot be undone.')) {
                      if (window.api && window.api.resetToDefault) {
                        const result = await window.api.resetToDefault();
                        if (result && result.success) {
                          window.location.reload();
                        } else {
                          alert('Failed to reset to default: ' + (result?.error || 'Unknown error'));
                        }
                      }
                    }
                  }}
                >
                  Reset to Default
                </div>
              </div>
            </div>
          )}
          
          {/* Click outside to close */}
          {showMenu && (
            <div 
              style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 999 
              }} 
              onClick={handleMenuClose}
            />
          )}
      </footer>

      <SoundModal 
        isOpen={showSoundModal}
        onClose={() => setShowSoundModal(false)}
        onSettingsChange={onSettingsChange}
      />
      {/* Wallpaper Modal */}
      {showWallpaperModal && (
        <WallpaperModal
          isOpen={showWallpaperModal}
          onClose={() => setShowWallpaperModal(false)}
          onSettingsChange={onSettingsChange}
          currentWallpaper={window.settings?.wallpaper}
          currentOpacity={window.settings?.wallpaperOpacity}
          savedWallpapers={window.settings?.savedWallpapers || []}
          likedWallpapers={window.settings?.likedWallpapers || []}
          cycleWallpapers={window.settings?.cycleWallpapers}
          cycleInterval={window.settings?.cycleInterval}
          cycleAnimation={window.settings?.cycleAnimation}
        />
      )}
      {/* General Settings Modal */}
      {showGeneralModal && (
        <GeneralSettingsModal 
          isOpen={showGeneralModal} 
          onClose={() => setShowGeneralModal(false)} 
          immersivePip={immersivePip} 
          setImmersivePip={val => {
            setImmersivePip(val);
            localStorage.setItem('immersivePip', JSON.stringify(val));
          }}
          defaultBarType={defaultBarType}
          setDefaultBarType={onDefaultBarTypeChange}
          glassWiiRibbon={glassWiiRibbon}
          setGlassWiiRibbon={onGlassWiiRibbonChange}
        />
      )}
      {showPrimaryActionsModal && (
        <PrimaryActionsModal
          isOpen={showPrimaryActionsModal}
          onClose={handlePrimaryActionsCancel}
          onSave={handlePrimaryActionsSave}
          config={buttonConfigs[activeButtonIndex]}
          buttonIndex={activeButtonIndex}
          preavailableIcons={preavailableIcons}
        />
      )}
    </>
  );
};

export default WiiRibbon; 