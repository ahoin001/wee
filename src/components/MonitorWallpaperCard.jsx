import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/WButton';
import { useMonitorState } from '../utils/useConsolidatedAppHooks';

const MonitorWallpaperCard = ({ monitorId, monitorName }) => {
  const [wallpaper, setWallpaper] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { saveMonitorWallpaper, saveMonitorSettings } = useMonitorState();

  // Load monitor-specific data - DISABLED to prevent infinite loop
  // useEffect(() => {
  //   const loadMonitorData = async () => {
  //     if (!monitorId || !window.api?.wallpapers) return;
  //     
  //     setIsLoading(true);
  //     try {
  //       const wallpaperData = await window.api.wallpapers.getMonitorWallpaper(monitorId);
  //       const settingsData = await window.api.wallpapers.getMonitorSettings(monitorId);
  //       
  //       setWallpaper(wallpaperData);
  //       setSettings(settingsData);
  //     } catch (error) {
  //       console.error('[MonitorWallpaperCard] Error loading monitor data:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   loadMonitorData();
  // }, [monitorId]);

  const handleSetWallpaper = async () => {
    try {
      const result = await window.api.selectWallpaperFile();
      if (result.success && result.filePath) {
        const wallpaperData = {
          path: result.filePath,
          filename: result.filename,
          opacity: 1,
          blur: 0
        };
        
        setWallpaper(wallpaperData);
        await saveMonitorWallpaper(monitorId, wallpaperData);
      }
    } catch (error) {
      console.error('[MonitorWallpaperCard] Error setting wallpaper:', error);
    }
  };

  const handleClearWallpaper = async () => {
    setWallpaper(null);
    await saveMonitorWallpaper(monitorId, null);
  };

  const handleSaveSettings = async () => {
    if (settings) {
      await saveMonitorSettings(monitorId, settings);
    }
  };

  return (
    <Card 
      title={`${monitorName} Settings`} 
      separator 
      desc={`Customize wallpaper and settings for ${monitorName}`}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-secondary))' }}>
          Loading monitor settings...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Wallpaper Section */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: 'hsl(var(--text-primary))' }}>
              Wallpaper
            </h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {wallpaper ? (
                <>
                  <div style={{ flex: 1, fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                    {wallpaper.filename}
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleClearWallpaper}
                  >
                    Clear
                  </Button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                    No wallpaper set
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleSetWallpaper}
                  >
                    Set Wallpaper
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: 'hsl(var(--text-primary))' }}>
              Monitor-Specific Settings
            </h4>
            <div style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
              {settings ? (
                <div>
                  <div>Theme: {settings.theme || 'Default'}</div>
                  <div>Colors: {settings.colors ? 'Custom' : 'Default'}</div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleSaveSettings}
                    style={{ marginTop: 8 }}
                  >
                    Save Settings
                  </Button>
                </div>
              ) : (
                <div>
                  <div>No custom settings</div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => setSettings({ theme: 'default', colors: null })}
                    style={{ marginTop: 8 }}
                  >
                    Create Settings
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MonitorWallpaperCard; 