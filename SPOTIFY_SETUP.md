# Spotify Integration Setup Guide

This guide will help you set up Spotify integration for your Wii Desktop Launcher.

## Prerequisites

1. **Spotify Account**: You need a Spotify account (Free or Premium)
2. **Spotify Developer Account**: Register at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## Step 1: Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the app details:
   - **App name**: Wii Desktop Launcher
   - **App description**: Music control for Wii Desktop Launcher
   - **Website**: `http://localhost:5173`
   - **Redirect URIs**: 
     - `http://localhost:5173/spotify-callback` (for development)
     - `wee-desktop-launcher://spotify-callback` (for production)
4. Click "Save"

## Step 2: Get Your Client ID

1. In your Spotify app dashboard, you'll see your **Client ID**
2. Copy this Client ID
3. Open `src/utils/spotifyService.js`
4. Replace `'your_client_id_here'` with your actual Client ID:

```javascript
const SPOTIFY_CLIENT_ID = '0597b1eb9b1e4925934e142c2d0243bb';
```

## Step 3: Add the Spotify Channel

To add the Spotify channel to your app, you have a few options:

### Option A: Add to Existing Channels Array

If you have a channels configuration, add the Spotify channel:

```javascript
import SpotifyDemoChannel from './components/SpotifyDemoChannel';

// Add to your channels array
const channels = [
  // ... existing channels
  SpotifyDemoChannel,
];
```

### Option B: Add to Channel Store

If you're using a channel store, add the Spotify channel:

```javascript
import SpotifyDemoChannel from './components/SpotifyDemoChannel';

// Add to your channel store
const spotifyChannel = {
  id: 'spotify-music',
  title: '🎵 Spotify Music',
  description: 'Control your Spotify music',
  icon: '🎵',
  color: '#1db954',
  component: SpotifyDemoChannel,
  category: 'music',
  enabled: true
};
```

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the Spotify Music channel
3. Click "Connect Spotify Account"
4. Authorize your Spotify account
5. Test the features:
   - Now Playing display
   - Play/Pause controls
   - Skip tracks
   - Browse playlists
   - Search for music

## Features Available

### ✅ What Works Now:
- **Authentication**: Connect your Spotify account
- **Now Playing**: See current track info
- **Playback Controls**: Play/pause, skip tracks
- **Library Access**: Browse playlists and liked songs
- **Search**: Search for tracks, artists, albums
- **Wii-Style UI**: Matches your app's aesthetic

### 🔄 What Needs Backend (Future Enhancement):
- **Token Exchange**: Currently using mock authentication
- **Refresh Tokens**: Automatic token renewal
- **WebSocket**: Real-time playback updates

## Current Limitations

1. **Mock Authentication**: The current implementation uses a mock authentication flow. In production, you'd need a backend to handle the OAuth token exchange.

2. **No Real API Calls**: Since we don't have real Spotify credentials, the API calls are simulated.

## Production Setup

For production builds, the app automatically uses the custom protocol `wee-desktop-launcher://spotify-callback` for OAuth callbacks. This is handled by:

1. **Custom Protocol Registration**: The Electron main process registers the `wee-desktop-launcher://` protocol
2. **OAuth Flow**: When users authenticate, Spotify redirects to the custom protocol
3. **Code Extraction**: The main process extracts the authorization code and sends it to the renderer
4. **Token Exchange**: The renderer process handles the token exchange (currently mocked)

## Future Enhancements

### 1. Backend Integration
Create a simple backend to handle Spotify OAuth:

```javascript
// Example backend endpoint
app.post('/spotify/token', async (req, res) => {
  const { code } = req.body;
  const tokens = await exchangeCodeForTokens(code);
  res.json(tokens);
});
```

### 2. Real-time Updates
Add WebSocket support for real-time playback updates:

```javascript
// WebSocket connection for real-time updates
const ws = new WebSocket('wss://your-backend.com/spotify');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updatePlaybackState(data);
};
```

### 3. Music-Synced Effects
Enhance your particle system to react to music:

```javascript
// Use Spotify's audio analysis features
const audioFeatures = await spotifyApi.getAudioFeaturesForTrack(trackId);
const { tempo, energy, valence } = audioFeatures;

// Adjust particle effects based on music
particleSystem.setIntensity(energy);
particleSystem.setSpeed(tempo / 120);
```

## Troubleshooting

### Common Issues:

1. **"Invalid Client ID"**: Make sure you've replaced the placeholder with your actual Client ID
2. **"Redirect URI Mismatch"**: Ensure the redirect URI in your Spotify app matches exactly
3. **"CORS Error"**: This is expected in development - the mock implementation handles this

### Debug Mode:

Enable debug logging by adding this to your browser console:

```javascript
localStorage.setItem('spotify_debug', 'true');
```

## Security Notes

- Never commit your Client ID to public repositories
- Use environment variables in production
- Implement proper token storage and refresh logic
- Add rate limiting to prevent API abuse

## Next Steps

1. **Test the current implementation** with the mock authentication
2. **Set up a backend** for real OAuth flow
3. **Add more features** like volume control, queue management
4. **Integrate with your existing particle system** for music-synced effects

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Spotify app settings
3. Ensure your redirect URI is correct
4. Test with a different Spotify account

---

**Note**: This is a development implementation. For production use, you'll need to implement proper OAuth flow with a backend service. 