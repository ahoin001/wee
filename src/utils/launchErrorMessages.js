/**
 * User-facing copy for launch failures (main process returns raw technical strings).
 */

export function getLaunchErrorPresentation({ technicalError = '', launchType, path = '' }) {
  const t = String(technicalError).toLowerCase();
  const p = String(path || '');

  let headline = "We couldn't open that";
  let hint =
    'Check that the path is correct and the program or game is installed. If you moved or uninstalled it, update this channel.';
  /** When set, UI may show a CTA that opens Settings to this tab */
  let settingsTabId = null;

  const isUrl = launchType === 'url' || /^https?:\/\//i.test(p);
  if (isUrl) {
    headline = "Couldn't open this link";
    hint =
      'Check your connection and that the address is correct. If the site blocks embedded browsers, try opening it from your normal browser.';
    settingsTabId = 'channels';
  }

  if (launchType === 'steam' || /^steam:\/\//i.test(p) || /^\d+$/.test(p.trim())) {
    headline = "Couldn't launch via Steam";
    hint = 'Make sure Steam is installed, running, and you own or have access to this title.';
  }

  if (launchType === 'epic' || /epicgames/i.test(p)) {
    headline = "Couldn't launch via Epic Games";
    hint = 'Make sure the Epic Games Launcher is installed and this game is available in your library.';
  }

  if (launchType === 'microsoftstore') {
    headline = "Couldn't open this Store app";
    hint =
      'Check that the app is installed from the Microsoft Store and the Store ID (with !) matches this PC.';
    settingsTabId = 'channels';
  }

  if (t.includes('enoent') || t.includes('not found') || t.includes('cannot find')) {
    hint = "Windows couldn't find that file or program. Confirm the path or pick the app again.";
    settingsTabId = 'channels';
  }

  if (t.includes('access') || t.includes('eacces') || t.includes('permission')) {
    hint = 'Permission was denied. Try running the launcher as administrator or checking antivirus.';
    settingsTabId = 'channels';
  }

  return { headline, hint, settingsTabId };
}

export function buildLaunchErrorReport({ refId, at, source, launchType, path, technicalError }) {
  const lines = [
    'Wee Desktop Launcher — launch issue',
    `Reference: ${refId}`,
    `Time: ${at}`,
    `Source: ${source}`,
    `Launch type: ${launchType || 'unknown'}`,
    `Path: ${path || '(empty)'}`,
    `Technical detail: ${technicalError || '(none)'}`,
    `App: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
  ];
  return lines.join('\n');
}
