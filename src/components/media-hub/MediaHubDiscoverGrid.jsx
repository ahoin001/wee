import React, { useLayoutEffect, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/** Match `grid-template-columns: repeat(auto-fill, minmax(168px, 1fr))` + gap. */
const MIN_CARD_PX = 168;
const GAP_PX = 12;
/** Poster 2:3 + title block; tuned for virtual row height. */
const ROW_HEIGHT_ESTIMATE = 312;

export const MEDIA_HUB_DISCOVER_VIRTUAL_THRESHOLD = 48;

/**
 * Discover grid: full CSS grid for small lists; row-virtualized grid for large catalogs
 * to limit DOM and layout cost while scrolling.
 */
export default function MediaHubDiscoverGrid({ items, scrollRef, renderItem }) {
  const [cols, setCols] = useState(3);

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

  if (!virtualize) {
    return (
      <div className="media-hub-grid">
        {items.map((item, index) => renderItem(item, index))}
      </div>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
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
            className="media-hub-grid media-hub-grid--virtual-row"
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
