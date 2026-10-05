import { useSyncExternalStore } from 'react';

/**
 * One shared window-activity signal for the whole renderer. Every caller reads the
 * same snapshot; DOM + IPC listeners attach once on first subscribe and detach
 * when the last subscriber leaves.
 */

const SERVER_SNAPSHOT = Object.freeze({
  isVisible: true,
  isFocused: true,
  isMainMinimized: false,
  mainWindowFocused: true,
  mainWindowVisible: true,
  isAppActive: true,
});

function readDocumentActivity() {
  if (typeof document === 'undefined') return { isVisible: true, isFocused: true };
  return {
    isVisible: document.visibilityState === 'visible',
    isFocused: document.hasFocus(),
  };
}

function buildSnapshot(doc, main) {
  // Soft focus: document OR Electron main may lag after Alt-Tab; either is enough.
  // Keep away/suspend gates (visibility, minimize, main visible) unchanged.
  const isAppActive =
    doc.isVisible &&
    !main.isMinimized &&
    main.isVisible &&
    (doc.isFocused || main.isFocused);
  return Object.freeze({
    isVisible: doc.isVisible,
    isFocused: doc.isFocused,
    isMainMinimized: main.isMinimized,
    mainWindowFocused: main.isFocused,
    mainWindowVisible: main.isVisible,
    isAppActive,
  });
}

let docState = readDocumentActivity();
let mainState = { isMinimized: false, isFocused: true, isVisible: true };
let snapshot = buildSnapshot(docState, mainState);
const listeners = new Set();
let detach = null;

function commit(nextDoc, nextMain) {
  const next = buildSnapshot(nextDoc, nextMain);
  docState = nextDoc;
  mainState = nextMain;
  if (
    next.isVisible === snapshot.isVisible &&
    next.isFocused === snapshot.isFocused &&
    next.isMainMinimized === snapshot.isMainMinimized &&
    next.mainWindowFocused === snapshot.mainWindowFocused &&
    next.mainWindowVisible === snapshot.mainWindowVisible
  ) {
    return;
  }
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function attach() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {};

  const onVisibility = () => {
    commit({ ...docState, isVisible: document.visibilityState === 'visible' }, mainState);
  };
  const onFocus = () => commit({ ...docState, isFocused: true }, mainState);
  const onBlur = () => commit({ ...docState, isFocused: false }, mainState);

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onFocus);
  window.addEventListener('blur', onBlur);

  const api = window.api;
  const onMainActivity = (payload) => {
    if (!payload || typeof payload !== 'object') return;
    commit(docState, {
      ...mainState,
      ...(typeof payload.isMinimized === 'boolean' ? { isMinimized: payload.isMinimized } : {}),
      ...(typeof payload.isFocused === 'boolean' ? { isFocused: payload.isFocused } : {}),
      ...(typeof payload.isVisible === 'boolean' ? { isVisible: payload.isVisible } : {}),
    });
  };
  if (api?.onAppWindowActivity) api.onAppWindowActivity(onMainActivity);

  // Resync: focus may have changed while nobody was subscribed.
  commit(readDocumentActivity(), mainState);

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('blur', onBlur);
    api?.offAppWindowActivity?.(onMainActivity);
  };
}

function subscribe(listener) {
  listeners.add(listener);
  if (!detach) detach = attach();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && detach) {
      detach();
      detach = null;
    }
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

/** Imperative read for event handlers / one-shot effects. */
export function getAppActivitySnapshot() {
  return snapshot;
}

export const useAppActivity = () => {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return current;
};
