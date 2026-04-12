/**
 * Pure validation for channel launch paths, aligned with electron `launch-app` handlers.
 * @param {string} rawPath
 * @param {string} type - 'url' | 'steam' | 'epic' | 'microsoftstore' | 'exe' | etc.
 * @returns {{ valid: boolean, error: string }}
 */
export function validateChannelPath(rawPath, type) {
  const path = (rawPath || '').trim();
  if (!path) {
    return { valid: true, error: '' };
  }

  if (type === 'url') {
    try {
      const url = new URL(path);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return { valid: true, error: '' };
      }
      return { valid: false, error: 'Please enter a valid HTTP or HTTPS URL' };
    } catch {
      return { valid: false, error: 'Please enter a valid URL (e.g., https://example.com)' };
    }
  }

  if (type === 'steam') {
    if (/^steam:\/\//i.test(path)) {
      return { valid: true, error: '' };
    }
    if (/^\d+$/.test(path)) {
      return { valid: true, error: '' };
    }
    return {
      valid: false,
      error: 'Use a Steam URI (e.g. steam://rungameid/252950) or a numeric App ID',
    };
  }

  if (type === 'epic') {
    if (path.toLowerCase().startsWith('com.epicgames.launcher://')) {
      return { valid: true, error: '' };
    }
    return {
      valid: false,
      error: 'Please enter a valid Epic URI (e.g. com.epicgames.launcher://apps/GameName?action=launch&silent=true)',
    };
  }

  if (type === 'microsoftstore') {
    if (path.includes('!')) {
      return { valid: true, error: '' };
    }
    return {
      valid: false,
      error:
        'Please enter a valid Microsoft Store App ID (e.g. PUBLISHER.APPNAME_xxxxxxxx!App)',
    };
  }

  // exe and unknown: allow .exe (with args), UNC, or quoted paths
  if (/\.exe(\s|$|")/i.test(path) || /\\\.exe/i.test(path)) {
    return { valid: true, error: '' };
  }
  if (path.startsWith('\\\\')) {
    return { valid: true, error: '' };
  }
  if (path.startsWith('"') && /\.exe/i.test(path)) {
    return { valid: true, error: '' };
  }

  return {
    valid: false,
    error: 'Enter a full path to an .exe, use Browse, or pick a game from Suggested Content',
  };
}

/**
 * Normalize path before persisting (e.g. numeric Steam App ID → steam:// URI).
 */
export function normalizeChannelPath(rawPath, type) {
  const path = (rawPath || '').trim();
  if (type === 'steam' && /^\d+$/.test(path)) {
    return `steam://rungameid/${path}`;
  }
  return path;
}

/**
 * Best-effort launch type inferred from path text (for smart suggestions).
 * @returns {'url'|'steam'|'epic'|'microsoftstore'|'exe'|null}
 */
export function inferLaunchTypeFromPath(rawPath) {
  const path = (rawPath || '').trim();
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    if (/store\.steampowered\.com\/app\/\d+/i.test(path)) return 'steam';
    return 'url';
  }
  if (/^steam:\/\//i.test(path) || /^\d+$/.test(path)) return 'steam';
  if (/^com\.epicgames\.launcher:\/\//i.test(path)) return 'epic';
  if (
    path.includes('!') &&
    !/^https?:\/\//i.test(path) &&
    !/^steam:\/\//i.test(path) &&
    !/^com\.epicgames\.launcher:\/\//i.test(path) &&
    !/\.exe(\s|$|"|\\)/i.test(path)
  ) {
    return 'microsoftstore';
  }
  if (/\.exe(\s|$|"|\\)/i.test(path) || path.startsWith('\\\\')) return 'exe';
  return null;
}

/**
 * Actionable suggestions when the path does not match the selected type or needs normalization.
 * @returns {Array<{ id: string, label: string, applyPath: string, applyType: string }>}
 */
export function getSmartPathSuggestions(rawPath, currentType) {
  const path = (rawPath || '').trim();
  if (!path) return [];

  const suggestions = [];
  const inferred = inferLaunchTypeFromPath(path);
  const { valid } = validateChannelPath(path, currentType);

  if (!valid && currentType === 'url') {
    if (!/^https?:\/\//i.test(path)) {
      const domainLike =
        /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([/?#].*)?$/.test(path) ||
        /^www\./i.test(path);
      if (domainLike) {
        const withScheme = path.startsWith('www.') ? `https://${path}` : `https://${path.replace(/^\/+/, '')}`;
        try {
          // eslint-disable-next-line no-new
          new URL(withScheme);
          suggestions.push({
            id: 'url-add-https',
            label: `Use ${withScheme}`,
            applyPath: withScheme,
            applyType: 'url',
          });
        } catch {
          /* ignore */
        }
      }
    }
  }

  if (inferred && inferred !== currentType) {
    let applyPath = path;
    let applyType = inferred;
    if (inferred === 'steam') {
      applyPath = /^\d+$/.test(path) ? `steam://rungameid/${path}` : path;
    }
    const labelByType = {
      url: 'Switch to Website (URL)',
      steam: 'Switch to Steam launch',
      epic: 'Switch to Epic Games URI',
      microsoftstore: 'Switch to Microsoft Store app',
      exe: 'Switch to local application (.exe)',
    };
    suggestions.push({
      id: `match-inferred-${inferred}`,
      label: labelByType[inferred] || `Switch to ${inferred}`,
      applyPath,
      applyType,
    });
  }

  if (!valid && currentType === 'steam') {
    const storeMatch = path.match(/store\.steampowered\.com\/app\/(\d+)/i);
    if (storeMatch) {
      const id = storeMatch[1];
      suggestions.push({
        id: 'steam-from-store-url',
        label: `Use Steam App ID ${id} (steam://rungameid/${id})`,
        applyPath: `steam://rungameid/${id}`,
        applyType: 'steam',
      });
    }
  }

  const seen = new Set();
  const unique = suggestions.filter((s) => {
    const key = `${s.applyType}|${s.applyPath}|${s.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.slice(0, 4);
}
