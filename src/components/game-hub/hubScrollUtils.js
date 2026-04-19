/**
 * Scroll a region inside a scroll container so it fills the visible area above a bottom inset (e.g. dock).
 * @param {HTMLElement} container
 * @param {HTMLElement} region
 * @param {{ bottomInset?: number, topReserve?: number, behavior?: 'smooth' | 'auto' }} [opts]
 */
export function scrollHubRegionIntoFocus(container, region, opts = {}) {
  if (!container || !region) return;

  const bottomInset = Math.max(0, Number(opts.bottomInset) || 0);
  const topReserve = Math.max(0, Number(opts.topReserve) || 10);

  const cRect = container.getBoundingClientRect();
  const rRect = region.getBoundingClientRect();
  const scrollTop = container.scrollTop;

  const relTop = rRect.top - cRect.top + scrollTop;
  const regionH = rRect.height;
  const viewH = container.clientHeight;
  const usable = Math.max(160, viewH - bottomInset - topReserve);

  let targetScroll;
  if (regionH <= usable) {
    targetScroll = relTop - (usable - regionH) / 2;
  } else {
    targetScroll = relTop - topReserve;
  }

  const maxScroll = Math.max(0, container.scrollHeight - viewH);
  targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

  const behavior = opts.behavior === 'auto' ? 'auto' : 'smooth';
  container.scrollTo({ top: targetScroll, behavior });
}

/**
 * Fraction of `region` height visible inside the scroll container’s usable band (top reserve + bottom inset).
 * @param {HTMLElement} container
 * @param {HTMLElement} region
 * @param {{ bottomInset?: number, topReserve?: number }} [opts]
 * @returns {number} 0–1
 */
export function hubExpansionVisibleHeightRatio(container, region, opts = {}) {
  if (!container || !region) return 1;

  const bottomInset = Math.max(0, Number(opts.bottomInset) || 0);
  const topReserve = Math.max(0, Number(opts.topReserve) || 10);

  const cRect = container.getBoundingClientRect();
  const rRect = region.getBoundingClientRect();

  const visTop = cRect.top + topReserve;
  const visBottom = cRect.bottom - bottomInset;
  const intersectTop = Math.max(rRect.top, visTop);
  const intersectBottom = Math.min(rRect.bottom, visBottom);
  const visibleH = Math.max(0, intersectBottom - intersectTop);
  const h = rRect.height;

  if (h <= 1) return 1;
  return visibleH / h;
}

/**
 * Scroll the hub so an opened collection shelf is comfortably in view — only if mostly off-screen.
 * @param {HTMLElement} container
 * @param {HTMLElement} region
 * @param {{ bottomInset?: number, topReserve?: number, minVisibleRatio?: number, behavior?: 'smooth' | 'auto' }} [opts]
 */
export function maybeScrollHubExpansionIntoView(container, region, opts = {}) {
  const minRatio = Number.isFinite(opts.minVisibleRatio) ? opts.minVisibleRatio : 0.42;
  const { minVisibleRatio: _m, ...scrollOpts } = opts;
  const ratio = hubExpansionVisibleHeightRatio(container, region, scrollOpts);
  if (ratio >= minRatio) return;

  scrollHubRegionIntoFocus(container, region, scrollOpts);
}

export function readHubDockInsetPx(fromEl) {
  if (!fromEl || typeof window === 'undefined') return 0;
  const stage = fromEl.closest?.('.aura-hub-stage');
  const raw = stage ? window.getComputedStyle(stage).getPropertyValue('--hub-dock-inset').trim() : '';
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Top padding for scroll-into-view math (jump links, sticky hero). Set `--hub-scroll-top-reserve` on `.aura-hub-stage`. */
export function readHubScrollTopReservePx(fromEl) {
  if (!fromEl || typeof window === 'undefined') return 10;
  const stage = fromEl.closest?.('.aura-hub-stage');
  const raw = stage ? window.getComputedStyle(stage).getPropertyValue('--hub-scroll-top-reserve').trim() : '';
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 10;
}
