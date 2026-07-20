import { useEffect, useRef } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import {
  getChannelDataSlice,
  normalizeShellSpaceOrder,
  resolveActiveChannelSpaceKey,
} from '../utils/channelSpaces';
import { CHANNEL_PAGE_FLIP_MS, resolveSteppedChannelPage } from '../utils/channelLayoutSystem';
import { revealSpaceRail } from '../utils/spaceRailVisibility';

const SPACE_WHEEL_COOLDOWN_MS = 320;
const PAGE_TILT_COOLDOWN_MS = 140;
const VERTICAL_THRESHOLD = 28;
const HORIZONTAL_THRESHOLD = 18;

function isTypingTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[data-recording-shortcut], [data-wheel-nav-ignore]'));
}

function elementCanScrollVertically(el, deltaY) {
  let node = el instanceof Element ? el : null;
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const scrollable =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight + 1;
    if (scrollable) {
      if (deltaY < 0 && node.scrollTop > 0) return true;
      if (deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1) return true;
    }
    node = node.parentElement;
  }
  return false;
}

function getNextSpaceId(order, currentId, delta, mediaHubEnabled) {
  const normalized = normalizeShellSpaceOrder(order, { mediaHubEnabled });
  if (!normalized.length) return currentId;
  const currentIndex = Math.max(0, normalized.indexOf(currentId));
  const nextIndex = (currentIndex + delta + normalized.length) % normalized.length;
  return normalized[nextIndex];
}

/**
 * Optional mouse-wheel navigation:
 * - Vertical wheel → switch shell spaces (when `navigation.wheelSwitchSpaces`)
 * - Horizontal tilt / deltaX → home channel pages (when `navigation.wheelHomePageTilt`)
 */
export default function useWheelNavigation() {
  const lastSpaceNavAt = useRef(0);
  const lastPageNavAt = useRef(0);

  useEffect(() => {
    const onWheel = (event) => {
      if (event.defaultPrevented) return;
      if (isTypingTarget(event.target)) return;

      const state = useConsolidatedAppStore.getState();
      const { navigation, spaces, channels, ui, actions } = state;
      if (ui?.showSettingsModal || ui?.showSettingsActionMenu) return;

      const wheelSwitchSpaces = Boolean(navigation?.wheelSwitchSpaces);
      const wheelHomePageTilt = navigation?.wheelHomePageTilt !== false;

      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      const activeSpaceId = spaces?.activeSpaceId || 'home';

      // Horizontal tilt / side-scroll → Home / Focus channel pages
      if (
        wheelHomePageTilt &&
        (activeSpaceId === 'home' || activeSpaceId === 'workspaces') &&
        absX >= HORIZONTAL_THRESHOLD &&
        absX > absY
      ) {
        const now = Date.now();
        if (now - lastPageNavAt.current < PAGE_TILT_COOLDOWN_MS) {
          event.preventDefault();
          return;
        }

        const spaceKey = resolveActiveChannelSpaceKey(activeSpaceId);
        const nav = getChannelDataSlice(channels, spaceKey).navigation || {};
        const currentPage = Number(nav.currentPage) || 0;
        const totalPages = Math.max(1, Number(nav.totalPages) || 1);
        if (nav.isAnimating) {
          event.preventDefault();
          return;
        }

        const goingNext = event.deltaX > 0;
        const stepped = resolveSteppedChannelPage(
          currentPage,
          goingNext ? 1 : -1,
          totalPages
        );
        if (stepped.direction === 'none' || stepped.page === currentPage) return;

        lastPageNavAt.current = now;
        event.preventDefault();
        actions.setChannelNavigationForSpace?.(spaceKey, {
          currentPage: stepped.page,
          isAnimating: true,
          animationDirection: stepped.direction,
          animationWrapped: stepped.wrapped,
        });
        window.setTimeout(() => {
          const latest = useConsolidatedAppStore.getState();
          const latestKey = resolveActiveChannelSpaceKey(latest.spaces?.activeSpaceId);
          if (latestKey !== spaceKey) return;
          latest.actions.setChannelNavigationForSpace?.(spaceKey, {
            isAnimating: false,
            animationDirection: 'none',
            animationWrapped: false,
          });
        }, CHANNEL_PAGE_FLIP_MS || 500);
        return;
      }

      // Vertical wheel → shell spaces
      if (!wheelSwitchSpaces) return;
      if (absY < VERTICAL_THRESHOLD || absY <= absX) return;
      if (elementCanScrollVertically(event.target, event.deltaY)) return;

      const now = Date.now();
      if (now - lastSpaceNavAt.current < SPACE_WHEEL_COOLDOWN_MS) {
        event.preventDefault();
        return;
      }
      if (spaces?.isTransitioning) {
        event.preventDefault();
        return;
      }

      const delta = event.deltaY > 0 ? 1 : -1;
      const nextId = getNextSpaceId(
        spaces?.order,
        activeSpaceId,
        delta,
        spaces?.mediaHubEnabled === true
      );
      if (nextId === activeSpaceId) return;

      lastSpaceNavAt.current = now;
      event.preventDefault();
      actions.setSpacesState?.({ activeSpaceId: nextId });
      revealSpaceRail({ scheduleHide: true });
    };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', onWheel, { capture: true });
  }, []);
}
