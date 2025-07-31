import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import Toggle from '../../ui/Toggle';

const SoundsSettingsTab = React.memo(({ localSettings, updateLocalSetting }) => {
  // Memoize callback functions to prevent unnecessary re-renders
  const handleBackgroundMusicEnabledChange = useCallback((checked) => {
    updateLocalSetting('sounds', 'backgroundMusicEnabled', checked);
  }, [updateLocalSetting]);

  const handleBackgroundMusicLoopingChange = useCallback((checked) => {
    updateLocalSetting('sounds', 'backgroundMusicLooping', checked);
  }, [updateLocalSetting]);

  const handleBackgroundMusicPlaylistModeChange = useCallback((checked) => {
    updateLocalSetting('sounds', 'backgroundMusicPlaylistMode', checked);
  }, [updateLocalSetting]);

  const handleChannelClickEnabledChange = useCallback((checked) => {
    updateLocalSetting('sounds', 'channelClickEnabled', checked);
  }, [updateLocalSetting]);

  const handleChannelClickVolumeChange = useCallback((e) => {
    updateLocalSetting('sounds', 'channelClickVolume', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleChannelHoverEnabledChange = useCallback((checked) => {
    updateLocalSetting('sounds', 'channelHoverEnabled', checked);
  }, [updateLocalSetting]);

  const handleChannelHoverVolumeChange = useCallback((e) => {
    updateLocalSetting('sounds', 'channelHoverVolume', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleStartupEnabledChange = useCallback((checked) => {
    updateLocalSetting('sounds', 'startupEnabled', checked);
  }, [updateLocalSetting]);

  const handleStartupVolumeChange = useCallback((e) => {
    updateLocalSetting('sounds', 'startupVolume', Number(e.target.value));
  }, [updateLocalSetting]);

  return (
    <div>
      {/* Background Music Section */}
      <Card
        title="Background Music"
        separator
        desc="Background music plays continuously and can use significant CPU and memory resources."
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          {/* Background Music Settings */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <Toggle
                checked={localSettings.sounds?.backgroundMusicEnabled ?? true}
                onChange={handleBackgroundMusicEnabledChange}
              />
              <span style={{ marginLeft: '10px' }}>Enable Background Music</span>
            </div>
            
            {localSettings.sounds?.backgroundMusicEnabled && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <Toggle
                    checked={localSettings.sounds?.backgroundMusicLooping ?? true}
                    onChange={handleBackgroundMusicLoopingChange}
                  />
                  <span style={{ marginLeft: '10px' }}>Loop Music</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <Toggle
                    checked={localSettings.sounds?.backgroundMusicPlaylistMode ?? false}
                    onChange={handleBackgroundMusicPlaylistModeChange}
                  />
                  <span style={{ marginLeft: '10px' }}>Playlist Mode (Play liked sounds in order)</span>
                </div>
              </>
            )}
          </div>

          {/* Background Music Disabled Warning */}
          {!localSettings.sounds?.backgroundMusicEnabled && (
            <div style={{ 
              padding: '15px', 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔇 Background Music Disabled</div>
              <div style={{ fontSize: '14px', color: '#856404' }}>
                Background music is currently disabled. Enable it above to hear background music sounds.
              </div>
            </div>
          )}

          {/* Playlist Mode Info */}
          {localSettings.sounds?.backgroundMusicEnabled && localSettings.sounds?.backgroundMusicPlaylistMode && (
            <div style={{ 
              padding: '15px', 
              background: '#d1ecf1', 
              border: '1px solid #bee5eb', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🎵 Playlist Mode Active</div>
              <div style={{ fontSize: '14px', color: '#0c5460' }}>
                Only liked sounds will play in the order they appear. Click the ❤️ to like/unlike sounds and drag items to reorder your playlist.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Channel Click Sound */}
      <Card
        title="Channel Click Sound"
        separator
        desc="Sound played when clicking on a channel."
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Toggle
              checked={localSettings.sounds?.channelClickEnabled ?? true}
              onChange={handleChannelClickEnabledChange}
            />
            <span style={{ marginLeft: '10px' }}>Enable Channel Click Sound</span>
          </div>
          
          {localSettings.sounds?.channelClickEnabled && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Volume</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={localSettings.sounds?.channelClickVolume ?? 0.5}
                    onChange={handleChannelClickVolumeChange}
                    style={{ width: '100px' }}
                  />
                  <span style={{ minWidth: '40px', textAlign: 'right' }}>
                    {Math.round((localSettings.sounds?.channelClickVolume ?? 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Channel Hover Sound */}
      <Card
        title="Channel Hover Sound"
        separator
        desc="Sound played when hovering over a channel. Can impact performance with many channels."
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Toggle
              checked={localSettings.sounds?.channelHoverEnabled ?? true}
              onChange={handleChannelHoverEnabledChange}
            />
            <span style={{ marginLeft: '10px' }}>Enable Channel Hover Sound</span>
          </div>
          
          {localSettings.sounds?.channelHoverEnabled && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Volume</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={localSettings.sounds?.channelHoverVolume ?? 0.5}
                    onChange={handleChannelHoverVolumeChange}
                    style={{ width: '100px' }}
                  />
                  <span style={{ minWidth: '40px', textAlign: 'right' }}>
                    {Math.round((localSettings.sounds?.channelHoverVolume ?? 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Startup Sound */}
      <Card
        title="Startup Sound"
        separator
        desc="Sound played when the application starts."
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Toggle
              checked={localSettings.sounds?.startupEnabled ?? true}
              onChange={handleStartupEnabledChange}
            />
            <span style={{ marginLeft: '10px' }}>Enable Startup Sound</span>
          </div>
          
          {localSettings.sounds?.startupEnabled && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Volume</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={localSettings.sounds?.startupVolume ?? 0.5}
                    onChange={handleStartupVolumeChange}
                    style={{ width: '100px' }}
                  />
                  <span style={{ minWidth: '40px', textAlign: 'right' }}>
                    {Math.round((localSettings.sounds?.startupVolume ?? 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

SoundsSettingsTab.displayName = 'SoundsSettingsTab';

export default SoundsSettingsTab; 