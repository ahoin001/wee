import React, { useState, useEffect } from 'react';
import SoundModal from './SoundModal';
import WallpaperModal from './WallpaperModal';
import GeneralSettingsModal from './GeneralSettingsModal';
import './WiiBar.css';

function WiiBar({ onSettingsClick, onSettingsChange, onToggleDarkMode, onToggleCursor, useCustomCursor, barType, onBarTypeChange, defaultBarType, onDefaultBarTypeChange, glassWiiRibbon, onGlassWiiRibbonChange }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
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

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'numeric' }));
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <>
      <footer className="wii-bar" style={{ WebkitAppRegion: 'drag' }}>
        <svg className="wii-bar-bg" viewBox="0 0 1920 120" width="100%" height="120" preserveAspectRatio="none">
          <path d="M0,0 H1920 V80 Q960,140 0,80 Z" fill="#E9EFF3" stroke="#b0c4d8" strokeWidth="2" />
        </svg>
        <div className="wii-bar-content" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 20px',
          height: '120px',
          position: 'relative'
        }}>
                     {/* Left button */}
           <div style={{ WebkitAppRegion: 'no-drag', zIndex: 10 }}>
             <div 
               className="wii-style-button min-w-[80px] h-[70px] rounded-full bg-white border-4 border-wii-gray shadow-lg flex items-center justify-center cursor-pointer"
               onClick={handleSettingsClick}
             >
               <span className="text-wii-gray-dark font-bold text-base">Wii</span>
             </div>
           </div>
          
          {/* Center clock */}
          <div className="wii-bar-clock" style={{ 
            textAlign: 'center',
            zIndex: 5
          }}>
            <div className="wii-bar-time" style={{ fontSize: '24px', fontWeight: 'bold', color: '#666' }}>{time}</div>
            <div className="wii-bar-date" style={{ fontSize: '14px', color: '#888', marginTop: '2px' }}>{date}</div>
          </div>

                     {/* Right button */}
           <div style={{ WebkitAppRegion: 'no-drag', zIndex: 10 }}>
             <div 
               className="wii-style-button min-w-[80px] h-[70px] rounded-full bg-white border-4 border-wii-gray shadow-lg flex items-center justify-center cursor-pointer"
               onClick={handleSettingsClick}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wii-gray-dark">
                 <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
               </svg>
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
                <div className="context-menu-item" onClick={() => { 
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
                </div>
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
                <div className="context-menu-item" onClick={() => { setShowSoundModal(true); handleMenuClose(); }}>
                  Change Sounds
                </div>
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
                <div className="context-menu-item" onClick={() => { api.close(); handleMenuClose(); }}>
                  Close App
                </div>
                <div className="settings-menu-separator" />
                {/* General Group */}
                <div className="settings-menu-group-label">General</div>
                <div className="context-menu-item" onClick={() => { setShowGeneralModal(true); handleMenuClose(); }}>
                  General Settings
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
        </div>
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
    </>
  );
}

export default WiiBar; 