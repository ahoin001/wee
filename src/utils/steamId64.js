/**
 * SteamID64 helpers for Game Hub settings / enrichment.
 * Accepts raw 17-digit IDs or pasted profile URLs / XML snippets.
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
 * @param {unknown} raw
 * @returns {{ ok: true, steamId: string } | { ok: false, error: string }}
 */
export function validateSteamId64Input(raw) {
  const text = String(raw ?? '').trim();
  if (!text) {
    return { ok: false, error: 'SteamID64 is required, or use Clear to remove it.' };
  }
  const steamId = parseSteamId64(text);
  if (!steamId) {
    return {
      ok: false,
      error: 'Couldn’t find a 17-digit SteamID64. Paste the ID, a profile URL, or the community XML value.',
    };
  }
  return { ok: true, steamId };
}
