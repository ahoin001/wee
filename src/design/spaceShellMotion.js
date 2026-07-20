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

/**
 * Fraction of live shell duration when hub/home content begins revealing.
 * Overlaps the CSS slide ease-out so stagger is not a second settle wave.
 */
export const SPACE_SHELL_CONTENT_REVEAL_AT = 0.35;

/**
 * @param {number} [shellMs]
 * @returns {{ shellMs: number, revealAtMs: number, staggerBudgetMs: number, shellS: number, staggerBudgetS: number }}
 */
export function resolveSpaceShellEntranceTiming(shellMs = SPACE_SHELL_TRANSITION_MS_DEFAULT) {
  const ms = Math.max(
    0,
    Number.isFinite(Number(shellMs)) ? Number(shellMs) : SPACE_SHELL_TRANSITION_MS_DEFAULT
  );
  const revealAtMs = Math.round(ms * SPACE_SHELL_CONTENT_REVEAL_AT);
  const staggerBudgetMs = Math.max(0, ms - revealAtMs);
  return {
    shellMs: ms,
    revealAtMs,
    staggerBudgetMs,
    shellS: ms / 1000,
    staggerBudgetS: staggerBudgetMs / 1000,
  };
}

/**
 * JS approximation of `SPACE_SHELL_EASE_CSS` for RAF tweens (ribbon look, etc.).
 * Snappy early progress + soft settle — matches wallpaper/space-world feel better than easeOutCubic.
 * @param {number} t — 0…1
 * @returns {number}
 */
export function easeSpaceShell(t) {
  const x = Math.max(0, Math.min(1, t));
  // easeOutQuint — close to cubic-bezier(0.16, 1, 0.3, 1) without solving a cubic each frame
  return 1 - (1 - x) ** 5;
}
