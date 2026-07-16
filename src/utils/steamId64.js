/**
 * SteamID64 helpers for settings / enrichment.
 * Accepts raw 17-digit IDs or pasted profile URLs / XML snippets.
 * Vanity URLs (/id/name) are not resolved — callers get a specific error.
 */

/**
 * @param {unknown} raw
 * @returns {string | null} normalized 17-digit SteamID64, or null
 */
export function parseSteamId64(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  if (/^\d{17}$/.test(text)) return text;

  const fromProfiles = text.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (fromProfiles?.[1]) return fromProfiles[1];

  const fromXml = text.match(/<steamID64>\s*(\d{17})\s*<\/steamID64>/i);
  if (fromXml?.[1]) return fromXml[1];

  const anySeventeen = text.match(/(?:^|[^\d])(\d{17})(?:$|[^\d])/);
  if (anySeventeen?.[1]) return anySeventeen[1];

  return null;
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeVanityProfileUrl(text) {
  return /steamcommunity\.com\/id\/[^/\s?#]+/i.test(text);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeBareUsername(text) {
  // Single token, no digits, no URL — likely a custom Steam name, not SteamID64.
  return /^[a-zA-Z][a-zA-Z0-9_-]{2,63}$/.test(text) && !/\d/.test(text);
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, steamId: string } | { ok: false, error: string }}
 */
export function validateSteamId64Input(raw) {
  const text = String(raw ?? '').trim();
  if (!text) {
    return { ok: false, error: 'SteamID64 is required, or use Clear to remove it.' };
  }

  const steamId = parseSteamId64(text);
  if (steamId) {
    return { ok: true, steamId };
  }

  if (looksLikeVanityProfileUrl(text)) {
    return {
      ok: false,
      error:
        'Custom profile URLs (/id/yourname) are not resolved automatically. Open “Where to find SteamID64” for the community XML page, or paste a /profiles/<17-digit> URL.',
    };
  }

  if (looksLikeBareUsername(text)) {
    return {
      ok: false,
      error:
        'That looks like a Steam username, not a SteamID64. Use “Where to find SteamID64” to open your community XML and copy the 17-digit <steamID64> value.',
    };
  }

  return {
    ok: false,
    error:
      'Couldn’t find a 17-digit SteamID64. Paste the ID, a /profiles/<id> URL, or the community XML value — not a custom /id/ name.',
  };
}
