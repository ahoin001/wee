import React from 'react';
import AppPathSearchCard from './AppPathSearchCard';
import Button from '../ui/Button';

export default function AppPathSectionCard({
  value,
  onChange,
  onAppSelect,
  onRescanInstalledApps,
  onGameResultClick,
  handlePickSteamFolder,
  handleGameRefresh,
  ...rest
}) {
  const {
    gameType,
    appQuery,
    appDropdownOpen,
    appResults,
    appsLoading,
    appsError,
    path,
    pathError,
    exeFileInputRef,
    uwpQuery,
    uwpDropdownOpen,
    filteredUwpApps,
    uwpLoading,
    uwpError,
    gameQuery,
    gameDropdownOpen,
    gameResults,
    steamLoading,
    epicLoading,
    steamError,
    epicError,
    customSteamPath,
  } = value;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        <label htmlFor={`launch-type-select`} style={{ fontWeight: 600, marginBottom: 4 }}>Launch Type</label>
        <select
          id={`launch-type-select`}
          value={gameType}
          onChange={e => onChange({ gameType: e.target.value })}
          className="select-box"
        >
          <option value="exe">Application (.exe)</option>
          <option value="url">Website (URL)</option>
          <option value="steam">Steam Game</option>
          <option value="epic">Epic Game</option>
          <option value="microsoftstore">Microsoft Store App</option>
        </select>
      </div>
      {/* App Path Input (EXE) */}
      {gameType === 'exe' && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <AppPathSearchCard
            value={appQuery || path}
            onChange={e => {
              onChange({ appQuery: e.target.value, path: e.target.value, pathError: '' });
            }}
            onFocus={() => { if (appResults.length > 0) onChange({ appDropdownOpen: true }); }}
            onBlur={() => setTimeout(() => onChange({ appDropdownOpen: false }), 150)}
            results={appResults}
            loading={appsLoading}
            error={appsError}
            onSelect={onAppSelect}
            onRescan={onRescanInstalledApps}
            rescanLabel="Rescan Apps"
            disabled={appsLoading}
            placeholder="Enter or search for an app..."
            dropdownOpen={appDropdownOpen}
            setDropdownOpen={val => onChange({ appDropdownOpen: val })}
          />
          {appsLoading && appQuery && appResults.length === 0 && (
            <div style={{ position: 'absolute', left: 0, top: '100%', color: '#007bff', fontWeight: 500, fontSize: 15, marginTop: 4 }}>
              <span>Scanning for installed apps...</span>
            </div>
          )}
        </div>
      )}
      {/* Microsoft Store AppID Input */}
      {gameType === 'microsoftstore' && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            type="text"
            className="text-input"
            placeholder="Search or enter Microsoft Store App name or AppID"
            value={uwpQuery}
            onChange={e => onChange({ uwpQuery: e.target.value })}
            onFocus={() => { if (filteredUwpApps.length > 0) onChange({ uwpDropdownOpen: true }); }}
            onBlur={() => setTimeout(() => onChange({ uwpDropdownOpen: false }), 150)}
            style={{ width: '100%', padding: '12px 14px', fontSize: 17 }}
            autoComplete="off"
          />
          {uwpLoading && uwpQuery && filteredUwpApps.length === 0 && (
            <div style={{ position: 'absolute', top: 40, left: 0, color: '#007bff', fontWeight: 500, fontSize: 15 }}>
              <span>Scanning for Microsoft Store apps...</span>
            </div>
          )}
          {uwpError && <div style={{ color: '#dc3545', fontSize: 13, marginTop: 8 }}>{uwpError}</div>}
          {uwpDropdownOpen && filteredUwpApps.length > 0 && (
            <div className="uwp-dropdown" style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #b0c4d8', width: '100%', maxHeight: 200, overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {filteredUwpApps.map(app => (
                <div
                  key={app.appId}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                  onMouseDown={() => { onChange({ path: app.appId }); onChange({ uwpQuery: app.name }); onChange({ uwpDropdownOpen: false }); }}
                >
                  <div style={{ fontWeight: 500 }}>{app.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{app.appId}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="path-input-group">
        {(gameType === 'steam' || gameType === 'epic') ? (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              <input
                type="text"
                placeholder={gameType === 'steam' ? 'Type a Steam game name (e.g. Rocket League) or paste a Steam URI' : 'Type an Epic game name (e.g. Fortnite) or paste an Epic URI'}
                value={gameQuery}
                onChange={e => onChange({ gameQuery: e.target.value, path: e.target.value, pathError: '' })}
                className={`text-input ${pathError ? 'error' : ''}`}
                style={{ flex: 1, padding: '12px 14px', fontSize: 17 }}
                autoComplete="off"
                onFocus={() => gameResults.length > 0 && onChange({ gameDropdownOpen: true })}
                onBlur={() => setTimeout(() => onChange({ gameDropdownOpen: false }), 150)}
                disabled={gameType === 'steam' ? steamLoading : epicLoading}
              />
              {(gameType === 'steam' || gameType === 'epic') && (
                <Button
                  variant="primary"
                  title={gameType === 'steam' ? 'Rescan your Steam library for installed games.' : 'Rescan your Epic library for installed games.'}
                  style={{ fontSize: 14, borderRadius: 6, marginLeft: 0 }}
                  onClick={rest.handleGameRefresh}
                  disabled={gameType === 'steam' ? steamLoading : epicLoading}
                >
                  {(gameType === 'steam' ? steamLoading : epicLoading) ? 'Scanning...' : 'Rescan'}
                </Button>
              )}
              {gameType === 'steam' && (
                <Button
                  variant="secondary"
                  title="Pick your main Steam folder (the one containing the steamapps folder and libraryfolders.vdf). Do NOT select the steamapps folder itself."
                  style={{ fontSize: 14, borderRadius: 6, marginLeft: 0, background: '#f7fafd', color: '#222', border: '1px solid #b0c4d8' }}
                  onClick={handlePickSteamFolder}
                  disabled={steamLoading}
                >
                  Change Steam Folder
                </Button>
              )}
              {(gameType === 'steam' && steamLoading && gameQuery && gameResults.length === 0) && (
                <div style={{ position: 'absolute', left: 0, top: '100%', color: '#007bff', fontWeight: 500, fontSize: 15, marginTop: 4 }}>
                  <span>Scanning for Steam games...</span>
                </div>
              )}
              {(gameType === 'epic' && epicLoading && gameQuery && gameResults.length === 0) && (
                <div style={{ position: 'absolute', left: 0, top: '100%', color: '#007bff', fontWeight: 500, fontSize: 15, marginTop: 4 }}>
                  <span>Scanning for Epic games...</span>
                </div>
              )}
              {gameDropdownOpen && gameResults.length > 0 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  zIndex: 10,
                  background: '#fff',
                  border: '1px solid #b0c4d8',
                  borderRadius: 8,
                  margin: 0,
                  padding: 0,
                  maxHeight: 320,
                  overflowY: 'auto',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.10)'
                }}>
                  {gameResults.map(game => (
                    <li
                      key={gameType === 'steam' ? game.appid : game.appName}
                      className="steam-dropdown-result"
                      style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 18px', cursor: 'pointer', fontSize: 18, minHeight: 56, transition: 'background 0.15s' }}
                      onMouseDown={() => onGameResultClick(game)}
                    >
                      {gameType === 'steam' && (
                        <img
                          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                          alt={game.name + ' cover'}
                          style={{ width: 90, height: 42, objectFit: 'cover', borderRadius: 6, background: '#e9eff3', flexShrink: 0, transition: 'transform 0.15s' }}
                          onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      )}
                      {gameType === 'epic' && game.image && (
                        <img
                          src={game.image}
                          alt={game.name + ' cover'}
                          style={{ width: 90, height: 42, objectFit: 'cover', borderRadius: 6, background: '#e9eff3', flexShrink: 0, transition: 'transform 0.15s' }}
                          onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      )}
                      <span>{game.name} <span style={{ color: '#888', fontSize: 15 }}>{gameType === 'steam' ? `(${game.appid})` : `(${game.appName})`}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 16 }}>
              <span>Format: {gameType === 'steam' ? <code>steam://rungameid/[AppID]</code> : <code>com.epicgames.launcher://apps/[AppName]?action=launch&amp;silent=true</code>}</span>
              <br />
              <span>
                If you can't find your game, make sure it's installed in your {gameType === 'steam' ? 'Steam' : 'Epic'} library.<br />
                {gameType === 'steam' && (
                  <>
                    The correct Steam library path is required to scan your games. {customSteamPath ? <span>Currently using: <code>{customSteamPath}</code></span> : <span>Default: <code>C:\Program Files (x86)\Steam</code></span>}<br />
                    <b>When changing the Steam folder, select your main Steam folder (the one containing the <code>steamapps</code> folder and <code>libraryfolders.vdf</code>).<br />Do <u>NOT</u> select the <code>steamapps</code> folder itself.</b><br />
                    If you move your Steam library, use the <b>Change Steam Folder</b> button.
                  </>
                )}
              </span>
            </div>
            {(gameType === 'steam' && steamError) && (
              <div style={{ color: '#dc3545', fontWeight: 500, marginTop: 8, fontSize: 15 }}>
                {steamError} <br />
                Please ensure Steam is installed and you have games downloaded.
              </div>
            )}
            {(gameType === 'epic' && epicError) && (
              <div style={{ color: '#dc3545', fontWeight: 500, marginTop: 8, fontSize: 15 }}>
                {epicError} <br />
                Please ensure Epic Games Launcher is installed and you have games downloaded.
              </div>
            )}
            {(gameType === 'steam' && steamLoading) && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 18, color: '#007bff', fontWeight: 500 }}>
                Scanning your Steam library for installed games...
              </div>
            )}
            {(gameType === 'epic' && epicLoading) && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 18, color: '#007bff', fontWeight: 500 }}>
                Scanning your Epic library for installed games...
              </div>
            )}
            {!steamLoading && !steamError && gameType === 'steam' && gameResults.length === 0 && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 16, color: '#888', fontWeight: 500 }}>
                No installed Steam games found.
              </div>
            )}
            {!epicLoading && !epicError && gameType === 'epic' && gameResults.length === 0 && (
              <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 16, color: '#888', fontWeight: 500 }}>
                No installed Epic games found.
              </div>
            )}
            <style>{`
              .steam-dropdown-result:hover {
                background: #f0f6ff !important;
                transition: background 0.15s, transform 0.15s;
              }
              .steam-dropdown-result:hover img {
                transform: scale(1.07);
                transition: transform 0.15s;
              }
              .steam-dropdown-result:hover span {
                transform: scale(1.04);
                transition: transform 0.15s;
              }
            `}</style>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder={gameType === 'exe' ? 'C:\\Path\\To\\Application.exe or paste path here' : 'https://example.com'}
              value={path}
              onChange={e => onChange({ path: e.target.value, pathError: '' })}
              className={`text-input ${pathError ? 'error' : ''}`}
            />
            {gameType === 'exe' && (
              <>
                <button
                  className="file-picker-button"
                  onClick={async () => {
                    if (window.api && window.api.selectExeOrShortcutFile) {
                      const result = await window.api.selectExeOrShortcutFile();
                      if (result && result.success && result.file) {
                        let newPath = result.file.path;
                        if (result.file.args && result.file.args.trim()) {
                          newPath += ' ' + result.file.args.trim();
                        }
                        onChange({ path: newPath, pathError: '' });
                      } else if (result && result.error) {
                        onChange({ pathError: result.error });
                      }
                    } else {
                      exeFileInputRef.current?.click();
                    }
                  }}
                >
                  Browse Files
                </button>
                <input
                  type="file"
                  accept=".exe,.bat,.cmd,.com,.pif,.scr,.vbs,.js,.msi,.lnk"
                  ref={exeFileInputRef}
                  onChange={e => handleExeFileSelect(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </>
        )}
      </div>
      {pathError && <p className="error-text">{pathError}</p>}
      <p className="help-text" style={{ marginTop: 6, color: '#888', fontSize: 14 }}>
        {gameType === 'exe'
          ? (<><span>I suggest searching the app in your search bar, right click it - open file location - right click the file and click properties - copy and paste what is in the Target field.</span><br /><span style={{ fontSize: '0.95em', color: '#888' }}>Example: C:\Users\ahoin\AppData\Local\Discord\Update.exe --processStart Discord.exe</span></>)
          : gameType === 'steam'
            ? (<><span>Type a Steam game name and select from the list, or paste a Steam URI/AppID directly.</span><br /><span style={{ fontSize: '0.95em', color: '#888' }}>Example: steam://rungameid/252950</span></>)
            : 'Enter the complete URL including https://'}
      </p>
    </>
  );
} 