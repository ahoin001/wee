/**
 * Spotify Web API `GET /v1/me` includes `product` (e.g. "premium", "free", "open").
 * Remote playback control via the Web API is Premium-only; Free users can still listen
 * in official Spotify clients and may see read-only now playing in integrations.
 */
export function isSpotifyPremiumUser(user) {
  if (!user || typeof user.product !== 'string') return false;
  return user.product.toLowerCase() === 'premium';
}

/** URL for Premium marketing (open in browser). */
export const SPOTIFY_PREMIUM_URL = 'https://www.spotify.com/premium/';

/** Spotify Web API reference: user’s current playback (Premium / eligibility applies). */
export const SPOTIFY_WEB_API_PLAYER_DOCS_URL =
  'https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-current-playback';
