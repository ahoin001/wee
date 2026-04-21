import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/** Match `grid-template-columns: repeat(auto-fill, minmax(168px, 1fr))` + gap. */
const MIN_CARD_PX = 168;
const GAP_PX = 12;
/** Poster 2:3 + title block; tuned for virtual row height. */
const ROW_HEIGHT_ESTIMATE = 312;

export const MEDIA_HUB_DISCOVER_VIRTUAL_THRESHOLD = 48;
const SMALL_GRID_INITIAL_RENDER_COUNT = 24;
const SMALL_GRID_CHUNK_SIZE = 24;

/**
 * Media Hub grid: full CSS grid for small lists; row-virtualized grid for large catalogs
 * to limit DOM and layout cost while scrolling. Used by both Discover and Local tabs.
 *
 * When virtualized, `onVisibleRangeChange` is fired (debounced to the next microtask) with
 * the first/last visible item indices so callers can restrict expensive work (e.g. thumbnail
 * generation) to visible items.
 */
export default function MediaHubDiscoverGrid({
  items,
  scrollRef,
  renderItem,
  onVisibleRangeChange,
  className = 'media-hub-grid',
}) {
  const [cols, setCols] = useState(3);
  const [smallGridRenderCount, setSmallGridRenderCount] = useState(SMALL_GRID_INITIAL_RENDER_COUNT);

  useLayoutEffect(() => {
    const scrollEl = scrollRef?.current;
    if (!scrollEl) return undefined;
    const update = () => {
      const w = scrollEl.clientWidth;
      const c = Math.max(1, Math.floor((w + GAP_PX) / (MIN_CARD_PX + GAP_PX)));
      setCols(c);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [scrollRef]);

  const virtualize = items.length > MEDIA_HUB_DISCOVER_VIRTUAL_THRESHOLD;

  useEffect(() => {
    if (virtualize) return;
    const targetCount = items.length;
    if (smallGridRenderCount >= targetCount) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      setSmallGridRenderCount((prev) => Math.min(targetCount, prev + SMALL_GRID_CHUNK_SIZE));
    };
    const idleId =
      typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(run, { timeout: 120 })
        : window.setTimeout(run, 16);
    return () => {
      cancelled = true;
      if (typeof idleId === 'number') {
        window.clearTimeout(idleId);
      } else if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [virtualize, items.length, smallGridRenderCount]);

  useEffect(() => {
    // Reset incremental hydration window whenever dataset shrinks/changes materially.
    if (virtualize) return;
    setSmallGridRenderCount((prev) => Math.min(Math.max(SMALL_GRID_INITIAL_RENDER_COUNT, prev), items.length));
  }, [items.length, virtualize]);

  const rowCount = useMemo(
    () => (virtualize ? Math.ceil(items.length / Math.max(cols, 1)) : 0),
    [virtualize, items.length, cols]
  );

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef?.current ?? null,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 2,
  });

  const virtualRows = virtualize ? rowVirtualizer.getVirtualItems() : null;

  const lastReportedRangeRef = useRef({ start: -1, end: -1 });
  useEffect(() => {
    if (typeof onVisibleRangeChange !== 'function') return;
    if (!virtualize) {
      const start = 0;
      const end = Math.max(0, items.length - 1);
      const prev = lastReportedRangeRef.current;
      if (prev.start !== start || prev.end !== end) {
        lastReportedRangeRef.current = { start, end };
        onVisibleRangeChange({ startIndex: start, endIndex: end });
      }
      return;
    }
    if (!virtualRows || virtualRows.length === 0) return;
    const firstRow = virtualRows[0].index;
    const lastRow = virtualRows[virtualRows.length - 1].index;
    const startIndex = firstRow * cols;
    const endIndex = Math.min(items.length - 1, (lastRow + 1) * cols - 1);
    const prev = lastReportedRangeRef.current;
    if (prev.start !== startIndex || prev.end !== endIndex) {
      lastReportedRangeRef.current = { start: startIndex, end: endIndex };
      onVisibleRangeChange({ startIndex, endIndex });
    }
  }, [virtualize, virtualRows, cols, items.length, onVisibleRangeChange]);

  if (!virtualize) {
    const renderCount = Math.min(items.length, smallGridRenderCount);
    const visibleItems = items.slice(0, renderCount);
    return (
      <div className={className}>
        {visibleItems.map((item, index) => renderItem(item, index))}
      </div>
    );
  }

  const totalSize = rowVirtualizer.getTotalSize();
  const gap = 'clamp(0.65rem, 1vw, 0.9rem)';

  return (
    <div style={{ position: 'relative', height: totalSize, width: '100%' }}>
      {virtualRows.map((vr) => {
        const start = vr.index * cols;
        const rowItems = items.slice(start, start + cols);
        return (
          <div
            key={vr.key}
            className={`${className} media-hub-grid--virtual-row`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gap,
              transform: `translateY(${vr.start}px)`,
            }}
          >
            {rowItems.map((item, i) => renderItem(item, start + i))}
          </div>
        );
      })}
    </div>
  );
}
