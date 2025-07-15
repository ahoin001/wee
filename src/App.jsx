import { useState, useEffect } from 'react';
import Channel from './components/Channel';
import './App.css';

function App() {
  const [channels, setChannels] = useState([]);
  const [mediaMap, setMediaMap] = useState({});

  useEffect(() => {
    fetch('src/config.json')
      .then((res) => res.json())
      .then(setChannels)
      .catch(console.error);
  }, []);

  // Always show 12 channels (4x3 grid)
  const filledChannels = [...channels];
  while (filledChannels.length < 12) {
    filledChannels.push({ id: `empty-${filledChannels.length}`, empty: true });
  }

  const handleMediaChange = (id, file) => {
    const url = URL.createObjectURL(file);
    setMediaMap((prev) => ({
      ...prev,
      [id]: { url, type: file.type },
    }));
  };

  return (
    <div className="app-container">
      <div className="channels-grid">
        {filledChannels.map((channel, idx) => (
          <Channel
            key={channel.id || idx}
            {...channel}
            media={mediaMap[channel.id]}
            onMediaChange={channel.empty ? undefined : handleMediaChange}
          />
        ))}
      </div>
      <div className="ui-bar">
        WiiDesktop Launcher &mdash; Ready
      </div>
    </div>
  );
}

export default App;
