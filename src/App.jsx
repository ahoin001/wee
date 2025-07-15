import { useState } from 'react';
import Channel from './components/Channel';
import HomeButton from './components/HomeButton';
import SettingsButton from './components/SettingsButton';
import NotificationsButton from './components/NotificationsButton';
import './App.css';

function App() {
  const [mediaMap, setMediaMap] = useState({});
  const [appPathMap, setAppPathMap] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  // Create 12 empty channels for user configuration
  const channels = Array.from({ length: 12 }, (_, index) => ({
    id: `channel-${index}`,
    empty: true
  }));

  const handleMediaChange = (id, file) => {
    const url = URL.createObjectURL(file);
    setMediaMap((prev) => ({
      ...prev,
      [id]: { url, type: file.type },
    }));
  };

  const handleAppPathChange = (id, path) => {
    setAppPathMap((prev) => ({
      ...prev,
      [id]: path,
    }));
  };

  const handleSettingsClick = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <div className="app-container">
      <div className="channels-grid">
        {channels.map((channel) => (
          <Channel
            key={channel.id}
            {...channel}
            media={mediaMap[channel.id]}
            path={appPathMap[channel.id]}
            onMediaChange={handleMediaChange}
            onAppPathChange={handleAppPathChange}
          />
        ))}
      </div>
      <div className="ui-bar">
        <HomeButton />
        <SettingsButton onClick={handleSettingsClick} isActive={isEditMode} />
        <NotificationsButton />
      </div>
    </div>
  );
}

export default App;
