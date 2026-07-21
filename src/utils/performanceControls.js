/**
 * Performance controls catalog — one-stop SSOT for demanding toggles.
 * Does not invent parallel prefs; get/set existing store slices only.
 */

import useConsolidatedAppStore from './useConsolidatedAppStore';
import { SETTINGS_TAB_ID } from './settingsNavigation';
import { mergeMotionFeedback } from './motionFeedbackDefaults';
import { normalizeLaunchFeedbackMode } from './launchCinematic';
import { IDLE_EXPERIENCE_MODES } from './idleExperience';
import { normalizeSceneFxBeta } from '../features/sceneFxBeta/sceneFxBetaPrefs';
import { normalizeImmersiveSoundMode } from '../features/immersiveSoundMode/immersiveSoundModePrefs';
import {
  normalizePerformanceProfile,
} from './performanceProfile';

export {
  DEFAULT_PERFORMANCE_PROFILE,
  PERFORMANCE_PROFILES,
  normalizePerformanceProfile,
} from './performanceProfile';

/** Session-only stash so Smooth can restore ribbon FX without a parallel persisted key. */
let chromeEffectBeforePerfOff = null;

const COST_ORDER = Object.freeze({ high: 0, medium: 1, low: 2 });

function getState() {
  return useConsolidatedAppStore.getState();
}

function boolLabel(on) {
  return on ? 'Enabled' : 'Disabled';
}

/**
 * @typedef {object} PerformanceControl
 * @property {string} id
 * @property {string} title
 * @property {'high'|'medium'|'low'} cost
 * @property {string} section
 * @property {string} desc
 * @property {'toggle'|'select'} kind
 * @property {{ value: string, label: string }[]} [options]
 * @property {(state: object) => unknown} get
 * @property {(value: unknown, actions: object) => void} set
 * @property {{ tabId: string, options?: object } | null} learnMore
 * @property {(v: unknown) => string} formatValue
 */

/** @type {PerformanceControl[]} */
export const PERFORMANCE_CONTROLS = Object.freeze([
  {
    id: 'lowPowerMode',
    title: 'Low power mode',
    cost: 'high',
    section: 'power',
    kind: 'toggle',
    desc: 'Slows background polling and animation cadence so CPU/GPU stay quieter while Wee is open all day.',
    get: (s) => Boolean(s.ui?.lowPowerMode),
    set: (value, actions) => actions.setUIState({ lowPowerMode: Boolean(value) }),
    learnMore: null,
    formatValue: boolLabel,
  },
  {
    id: 'performancePauseOnGameLaunch',
    title: 'Pause effects when launching games',
    cost: 'medium',
    section: 'power',
    kind: 'toggle',
    desc: 'Freezes wallpaper cycling, chrome FX, and ambient effects while a game is in the foreground — without minimizing Wee.',
    get: (s) => s.ui?.performancePauseOnGameLaunch !== false,
    set: (value, actions) =>
      actions.setUIState({ performancePauseOnGameLaunch: Boolean(value) }),
    learnMore: null,
    formatValue: boolLabel,
  },
  {
    id: 'sceneFx',
    title: 'Scene effects',
    cost: 'high',
    section: 'atmosphere',
    kind: 'toggle',
    desc: 'Parallax, light shafts, and cursor wake on the wallpaper. Continuous GPU/RAF work while active.',
    get: (s) => Boolean(normalizeSceneFxBeta(s.ui?.sceneFxBeta).enabled),
    set: (value, actions) => {
      const cur = normalizeSceneFxBeta(getState().ui?.sceneFxBeta);
      actions.setUIState({ sceneFxBeta: { ...cur, enabled: Boolean(value) } });
    },
    learnMore: {
      tabId: SETTINGS_TAB_ID.SURFACES,
      options: { surfacesSegment: 'atmosphere' },
    },
    formatValue: boolLabel,
  },
  {
    id: 'wallpaperParticles',
    title: 'Wallpaper particles',
    cost: 'high',
    section: 'atmosphere',
    kind: 'toggle',
    desc: 'Full-screen particle overlay (snow, rain, etc.). Runs a canvas animation loop while enabled.',
    get: (s) => Boolean(s.overlay?.enabled),
    set: (value, actions) => actions.setOverlayState({ enabled: Boolean(value) }),
    learnMore: {
      tabId: SETTINGS_TAB_ID.SURFACES,
      options: { surfacesSegment: 'look' },
    },
    formatValue: boolLabel,
  },
  {
    id: 'wallpaperCycling',
    title: 'Wallpaper cycling',
    cost: 'medium',
    section: 'atmosphere',
    kind: 'toggle',
    desc: 'Auto-rotates wallpapers with crossfades. Extra decode and paint during transitions.',
    get: (s) => Boolean(s.wallpaper?.cycleWallpapers),
    set: (value, actions) => actions.setWallpaperState({ cycleWallpapers: Boolean(value) }),
    learnMore: {
      tabId: SETTINGS_TAB_ID.SURFACES,
      options: { surfacesSegment: 'library' },
    },
    formatValue: boolLabel,
  },
  {
    id: 'motionMaster',
    title: 'Playful motion',
    cost: 'medium',
    section: 'motion',
    kind: 'toggle',
    desc: 'Springs, presses, and gooey feedback. Turn off for snappier, lower-cost UI.',
    get: (s) => mergeMotionFeedback(s.ui?.motionFeedback).master !== false,
    set: (value, actions) => {
      const cur = mergeMotionFeedback(getState().ui?.motionFeedback);
      actions.setUIState({ motionFeedback: { ...cur, master: Boolean(value) } });
    },
    learnMore: { tabId: SETTINGS_TAB_ID.MOTION },
    formatValue: boolLabel,
  },
  {
    id: 'launchCinematic',
    title: 'Launch feedback',
    cost: 'low',
    section: 'motion',
    kind: 'select',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'subtle', label: 'Subtle' },
      { value: 'cinematic', label: 'Cinematic' },
    ],
    desc: 'Board choreography while an app opens. Never delays the launch itself; cinematic costs the most paint.',
    get: (s) => normalizeLaunchFeedbackMode(mergeMotionFeedback(s.ui?.motionFeedback).launch),
    set: (value, actions) => {
      const cur = mergeMotionFeedback(getState().ui?.motionFeedback);
      actions.setUIState({
        motionFeedback: { ...cur, launch: normalizeLaunchFeedbackMode(value) },
      });
    },
    learnMore: { tabId: SETTINGS_TAB_ID.MOTION },
    formatValue: (v) => {
      const id = normalizeLaunchFeedbackMode(v);
      if (id === 'off') return 'Off';
      if (id === 'cinematic') return 'Cinematic';
      return 'Subtle';
    },
  },
  {
    id: 'idleExperience',
    title: 'Idle experience',
    cost: 'medium',
    section: 'motion',
    kind: 'select',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'subtle', label: 'Subtle' },
      { value: 'attract', label: 'Attract' },
    ],
    desc: 'Home fade and micro-delights when you step away. Attract adds the most ongoing motion.',
    get: (s) => {
      const mode = s.channels?.settings?.idleExperienceMode;
      return IDLE_EXPERIENCE_MODES.includes(mode) ? mode : 'subtle';
    },
    set: (value, actions) => {
      const mode = IDLE_EXPERIENCE_MODES.includes(value) ? value : 'subtle';
      actions.setChannelSettings({ idleExperienceMode: mode });
    },
    learnMore: { tabId: SETTINGS_TAB_ID.CHANNELS },
    formatValue: (v) => {
      if (v === 'off') return 'Off';
      if (v === 'attract') return 'Attract';
      return 'Subtle';
    },
  },
  {
    id: 'ribbonChromeFx',
    title: 'Ribbon chrome effects',
    cost: 'medium',
    section: 'chrome',
    kind: 'toggle',
    desc: 'Animated FX on the dock ribbon. Continuous paint while a non-none effect is selected.',
    get: (s) => {
      const effect = s.ribbon?.chromeEffect;
      return Boolean(effect && effect !== 'none');
    },
    set: (value, actions) => {
      const ribbon = getState().ribbon || {};
      if (value) {
        const restore =
          chromeEffectBeforePerfOff && chromeEffectBeforePerfOff !== 'none'
            ? chromeEffectBeforePerfOff
            : 'sparkle';
        chromeEffectBeforePerfOff = null;
        actions.setRibbonState({ chromeEffect: restore });
      } else {
        const current = ribbon.chromeEffect ?? 'none';
        if (current !== 'none') chromeEffectBeforePerfOff = current;
        actions.setRibbonState({ chromeEffect: 'none' });
      }
    },
    learnMore: {
      tabId: SETTINGS_TAB_ID.DOCK,
      options: { dockSubTab: 'wii-ribbon' },
    },
    formatValue: boolLabel,
  },
  {
    id: 'immersiveSoundMode',
    title: 'Immersive Sound Mode',
    cost: 'medium',
    section: 'experimental',
    kind: 'toggle',
    desc: 'Full-screen Listening Stage while music plays. Extra blur, backdrop, and stage work.',
    get: (s) => Boolean(normalizeImmersiveSoundMode(s.ui?.immersiveSoundMode).enabled),
    set: (value, actions) => {
      const cur = normalizeImmersiveSoundMode(getState().ui?.immersiveSoundMode);
      actions.setUIState({ immersiveSoundMode: { ...cur, enabled: Boolean(value) } });
    },
    learnMore: { tabId: SETTINGS_TAB_ID.BETA },
    formatValue: boolLabel,
  },
]);

export const PERFORMANCE_SECTIONS = Object.freeze([
  { id: 'power', title: 'Power' },
  { id: 'atmosphere', title: 'Atmosphere cost' },
  { id: 'motion', title: 'Motion cost' },
  { id: 'chrome', title: 'Chrome' },
  { id: 'experimental', title: 'Experimental' },
]);

export function listPerformanceControls() {
  return [...PERFORMANCE_CONTROLS].sort(
    (a, b) => (COST_ORDER[a.cost] ?? 9) - (COST_ORDER[b.cost] ?? 9)
  );
}

export function readPerformanceSnapshot(state = getState()) {
  const values = {};
  for (const control of PERFORMANCE_CONTROLS) {
    values[control.id] = control.get(state);
  }
  return values;
}

function valuesEqual(a, b) {
  return Object.is(a, b);
}

/**
 * Apply a named profile. Returns a diff for the UI “What changed” summary.
 * @param {'smooth'|'balanced'|'max'} profileId
 * @returns {{ profileId: string, changes: Array<{ id: string, title: string, from: string, to: string, enabled?: boolean }> }}
 */
export function applyPerformanceProfile(profileId) {
  const id = profileId === 'max' || profileId === 'smooth' || profileId === 'balanced'
    ? profileId
    : 'balanced';

  const state = getState();
  const actions = state.actions;
  const before = readPerformanceSnapshot(state);

  /** @type {Record<string, unknown>} */
  const target = { ...before };

  if (id === 'smooth') {
    target.lowPowerMode = true;
    target.performancePauseOnGameLaunch = true;
    target.sceneFx = false;
    target.wallpaperParticles = false;
    target.wallpaperCycling = false;
    target.motionMaster = true;
    target.launchCinematic = 'subtle';
    target.idleExperience = 'subtle';
    target.ribbonChromeFx = false;
    target.immersiveSoundMode = false;
  } else if (id === 'balanced') {
    target.lowPowerMode = false;
    target.performancePauseOnGameLaunch = true;
    target.sceneFx = false;
    target.wallpaperParticles = false;
    // cycling: leave as-is (do not force)
    target.motionMaster = true;
    target.launchCinematic = 'subtle';
    target.idleExperience = 'subtle';
    // chrome: leave as-is
    target.immersiveSoundMode = false;
  } else {
    // max
    target.lowPowerMode = false;
    target.performancePauseOnGameLaunch = true;
    target.sceneFx = true;
    // particles: leave as-is (user must opt in)
    target.motionMaster = true;
    target.launchCinematic = 'cinematic';
    target.idleExperience = 'attract';
    // chrome / cycling / immersive: leave as-is except keep pause-on-launch
  }

  const changes = [];
  for (const control of PERFORMANCE_CONTROLS) {
    const nextVal = target[control.id];
    const prevVal = before[control.id];
    if (valuesEqual(prevVal, nextVal)) continue;
    // Skip keys we intentionally leave alone (target still holds before value)
    if (id === 'balanced' && (control.id === 'wallpaperCycling' || control.id === 'ribbonChromeFx')) {
      continue;
    }
    if (
      id === 'max' &&
      (control.id === 'wallpaperParticles' ||
        control.id === 'wallpaperCycling' ||
        control.id === 'ribbonChromeFx' ||
        control.id === 'immersiveSoundMode')
    ) {
      continue;
    }
    control.set(nextVal, actions);
    changes.push({
      id: control.id,
      title: control.title,
      from: control.formatValue(prevVal),
      to: control.formatValue(nextVal),
      enabled: typeof nextVal === 'boolean' ? nextVal : undefined,
    });
  }

  actions.setUIState({ performanceProfile: id });

  return { profileId: id, changes };
}

/**
 * Mark profile custom after a manual control edit.
 */
export function markPerformanceProfileCustom() {
  getState().actions.setUIState({ performanceProfile: 'custom' });
}

/**
 * Set one catalog control and mark profile custom.
 * @param {string} controlId
 * @param {unknown} value
 */
export function setPerformanceControl(controlId, value) {
  const control = PERFORMANCE_CONTROLS.find((c) => c.id === controlId);
  if (!control) return;
  control.set(value, getState().actions);
  markPerformanceProfileCustom();
}

/** True when ambient neighbor prefetch should run (not Smooth / not low-power). */
export function shouldPrefetchAmbientNeighbors(state = getState()) {
  if (state.ui?.lowPowerMode) return false;
  if (normalizePerformanceProfile(state.ui?.performanceProfile) === 'smooth') return false;
  return true;
}
