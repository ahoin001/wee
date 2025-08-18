import React, { useState, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePerformanceMonitor } from '../utils/usePerformanceOptimization';

// Virtualized wallpaper gallery for optimal performance with large collections
const VirtualizedWallpaperGallery = React.memo(({
  wallpapers,
  onSelect,
  onLike,
  onDelete,
  itemHeight = 200,
  itemWidth = 300,
  containerHeight = 600,
  containerWidth = 800,
  columns = 3,
  gap = 16
}) => {
  // Performance monitoring
  usePerformanceMonitor('VirtualizedWallpaperGallery');

  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate virtual list dimensions
  const totalItems = wallpapers.length;
  const itemsPerRow = columns;
  const totalRows = Math.ceil(totalItems / itemsPerRow);
  const totalHeight = totalRows * (itemHeight + gap) + gap;

  // Calculate visible range
  const visibleRows = Math.ceil(containerHeight / (itemHeight + gap)) + 2; // +2 for buffer
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - 1);
  const endRow = Math.min(totalRows - 1, startRow + visibleRows);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const items = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col;
        if (index < totalItems) {
          const wallpaper = wallpapers[index];
          items.push({
            index,
            row,
            col,
            wallpaper,
            style: {
              position: 'absolute',
              top: row * (itemHeight + gap),
              left: col * (itemWidth + gap),
              width: itemWidth,
              height: itemHeight,
              transform: `translate(${col * (itemWidth + gap)}px, ${row * (itemHeight + gap)}px)`
            }
          });
        }
      }
    }
    return items;
  }, [wallpapers, startRow, endRow, itemsPerRow, itemHeight, itemWidth, gap, totalItems]);

  // Handle scroll events with throttling
  const handleScroll = useCallback((e) => {
    const { scrollTop: newScrollTop } = e.target;
    setScrollTop(newScrollTop);
  }, []);

  // Optimized scroll handler with throttling
  const throttledScrollHandler = useCallback(
    (() => {
      let ticking = false;
      return (e) => {
        if (!ticking) {
          requestAnimationFrame(() => {
            handleScroll(e);
            ticking = false;
          });
          ticking = true;
        }
      };
    })(),
    [handleScroll]
  );

  // Memoize container style
  const containerStyle = useMemo(() => ({
    position: 'relative',
    width: containerWidth,
    height: containerHeight,
    overflow: 'auto',
    willChange: 'scroll-position'
  }), [containerWidth, containerHeight]);

  // Memoize inner container style
  const innerContainerStyle = useMemo(() => ({
    position: 'relative',
    width: '100%',
    height: totalHeight,
    willChange: 'transform'
  }), [totalHeight]);

  // Memoize wallpaper item render function
  const renderWallpaperItem = useCallback(({ index, wallpaper, style }) => {
    if (!wallpaper) return null;

    const handleClick = () => onSelect?.(wallpaper);
    const handleLike = (e) => {
      e.stopPropagation();
      onLike?.(wallpaper);
    };
    const handleDelete = (e) => {
      e.stopPropagation();
      onDelete?.(wallpaper);
    };

    return (
      <div key={`wallpaper-${index}`} style={style} className="wallpaper-item">
        <div 
          className="wallpaper-thumbnail"
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${wallpaper.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={handleClick}
        >
          {/* Overlay with actions */}
          <div 
            className="wallpaper-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              opacity: 0,
              transition: 'opacity 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '0';
            }}
          >
            <button
              onClick={handleLike}
              style={{
                background: wallpaper.liked ? '#ff4757' : 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
            >
              {wallpaper.liked ? '❤️' : '🤍'}
            </button>
            <button
              onClick={handleDelete}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  }, [onSelect, onLike, onDelete]);

  // Performance optimization: Only render visible items
  const renderedItems = useMemo(() => {
    return visibleItems.map(renderWallpaperItem);
  }, [visibleItems, renderWallpaperItem]);

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onScroll={throttledScrollHandler}
      className="virtualized-wallpaper-gallery"
    >
      <div style={innerContainerStyle}>
        {renderedItems}
      </div>
    </div>
  );
});

VirtualizedWallpaperGallery.propTypes = {
  wallpapers: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  onLike: PropTypes.func,
  onDelete: PropTypes.func,
  itemHeight: PropTypes.number,
  itemWidth: PropTypes.number,
  containerHeight: PropTypes.number,
  containerWidth: PropTypes.number,
  columns: PropTypes.number,
  gap: PropTypes.number
};

VirtualizedWallpaperGallery.displayName = 'VirtualizedWallpaperGallery';

export default VirtualizedWallpaperGallery;




