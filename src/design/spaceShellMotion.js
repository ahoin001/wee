/**
 * Shell space motion: vertical slide, dock chrome, wallpaper crossfade, Game Hub hero/backdrop.
 * Keep in sync with `.space-world__track` in App.css (`cubic-bezier(0.16, 1, 0.3, 1)`).
 */

/** Shared shell-space entrance tiers used by hubs + channel spaces. */
export const SPACE_SHELL_ENTRANCE_TIERS = {
  firstVisitPlayful: 'firstVisitPlayful',
  revisitSubtleGooey: 'revisitSubtleGooey',
};

/** Default duration when switching spaces (ms). Slightly brisk after idle so the shell feels responsive. */
export const SPACE_SHELL_TRANSITION_MS_DEFAULT = 480;

/** Shorter duration when chaining spaces (Home ↔ hubs); keeps multi-hop tours from feeling sluggish. */
export const SPACE_SHELL_TRANSITION_MS_RAPID = 260;

/** If the previous space switch was within this window, use rapid duration (synced with App.jsx `activeSpaceId` effect). */
export const SPACE_SHELL_RAPID_WINDOW_MS = 1000;

/** Shared easing for shell-aligned transitions (CSS). */
export const SPACE_SHELL_EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';
