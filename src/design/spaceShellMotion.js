/**
 * Shell space motion: vertical slide, dock chrome, wallpaper crossfade, Game Hub hero/backdrop.
 * Keep in sync with `.space-world__track` in App.css (`cubic-bezier(0.16, 1, 0.3, 1)`).
 */

/** Default duration when switching spaces (ms). */
export const SPACE_SHELL_TRANSITION_MS_DEFAULT = 780;

/** Shorter duration after a rapid successive space switch (ms). */
export const SPACE_SHELL_TRANSITION_MS_RAPID = 540;

/** If the previous space switch was within this window, use rapid duration (matches App.jsx). */
export const SPACE_SHELL_RAPID_WINDOW_MS = 420;

/** Shared easing for shell-aligned transitions (CSS). */
export const SPACE_SHELL_EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';
