import useConsolidatedAppStore from '../useConsolidatedAppStore';
import { SPACE_SHELL_TRANSITION_MS_DEFAULT } from '../../design/spaceShellMotion';
import { wallpaperEntryUrlKey } from '../wallpaperShape';
import { resolveDisplayWallpaperUrl } from '../theme/resolveEffectiveAccent';
import { resolveActiveBoardCurrentPage } from '../channelSpaces';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolve when IsolatedWallpaperBackground has painted/settled the current display URL.
 * Used by preset/workspace scene transitions so ambient + chrome land with the crossfade.
 */
export function waitForWallpaperVisualCommit(options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(0, options.timeoutMs)
    : SPACE_SHELL_TRANSITION_MS_DEFAULT + 400;

  const getExpected = () => {
    if (options.expectedUrl != null) return options.expectedUrl;
    const state = useConsolidatedAppStore.getState();
    return resolveDisplayWallpaperUrl({
      activeSpaceId: state.spaces?.activeSpaceId,
      wallpaperCurrent: state.wallpaper?.current,
      appearanceBySpace: state.appearanceBySpace,
      wallpaperEntryUrlKey,
      currentPage: resolveActiveBoardCurrentPage({
        activeSpaceId: state.spaces?.activeSpaceId,
        channels: state.channels,
      }),
    });
  };

  const expected = getExpected();
  if (!expected) return Promise.resolve();

  const committed = useConsolidatedAppStore.getState().wallpaper?.visualCommittedUrl ?? null;
  if (committed === expected) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsub();
      resolve();
    };

    const unsub = useConsolidatedAppStore.subscribe((state) => {
      if ((state.wallpaper?.visualCommittedUrl ?? null) === expected) {
        finish();
      }
    });

    const timer = setTimeout(finish, timeoutMs);
  });
}

/**
 * Scene transition coordinator for preset/workspace applies.
 * Marks ui.sceneTransition while the task runs, then waits for wallpaper visual commit
 * so callers finish in sync with the shared wallpaper crossfade (spaceShellMotion clock).
 */
export async function runSceneTransition(label, task, options = {}) {
  const enterDelayMs = Number(options.enterDelayMs ?? 80);
  const exitDelayMs = Number(options.exitDelayMs ?? 60);
  const waitVisualCommit = options.waitVisualCommit !== false;
  const key = Date.now();

  const { setUIState } = useConsolidatedAppStore.getState().actions;
  setUIState({
    sceneTransition: {
      active: true,
      label: label || 'Applying scene...',
      key,
    },
  });

  await sleep(enterDelayMs);
  try {
    await task();
    if (waitVisualCommit) {
      await waitForWallpaperVisualCommit({
        timeoutMs: options.visualCommitTimeoutMs,
      });
    }
  } finally {
    await sleep(exitDelayMs);
    setUIState((prev) => ({
      sceneTransition: {
        ...prev.sceneTransition,
        active: false,
        key: Date.now(),
      },
    }));
  }
}
