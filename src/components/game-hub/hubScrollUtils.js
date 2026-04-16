/**
 * Scroll a region inside a scroll container so it fills the visible area above a bottom inset (e.g. dock).
 * @param {HTMLElement} container
 * @param {HTMLElement} region
 * @param {{ bottomInset?: number, topReserve?: number }} [opts]
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

  container.scrollTo({ top: targetScroll, behavior: 'smooth' });
}

export function readHubDockInsetPx(fromEl) {
  if (!fromEl || typeof window === 'undefined') return 0;
  const stage = fromEl.closest?.('.aura-hub-stage');
  const raw = stage ? window.getComputedStyle(stage).getPropertyValue('--hub-dock-inset').trim() : '';
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}
