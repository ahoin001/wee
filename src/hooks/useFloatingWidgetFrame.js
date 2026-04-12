import { useState, useRef, useCallback, useEffect } from 'react';
import { clampFloatingWidgetPosition, getViewportSize } from '../utils/floatingWidgetGeometry';

function defaultUncontrolledSize() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const responsiveWidth = Math.min(Math.max(screenWidth * 0.35, 280), 600);
  const responsiveHeight = Math.min(Math.max(screenHeight * 0.4, 250), 500);
  return { width: responsiveWidth, height: responsiveHeight };
}

function viewportResizeBounds() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  return {
    minWidth: Math.max(200, screenWidth * 0.15),
    maxWidth: Math.min(800, screenWidth * 0.8),
    minHeight: Math.max(150, screenHeight * 0.2),
    maxHeight: Math.min(600, screenHeight * 0.7),
  };
}

/**
 * Drag + optional resize for floating widgets. Pointer events (mouse, pen, touch).
 *
 * @param {object} options
 * @param {(pos: {x:number,y:number}) => void} options.setPosition
 * @param {{x:number,y:number}} options.position
 * @param {{width:number,height:number}} [options.size] — controlled size (persisted in store, etc.)
 * @param {(s: {width:number,height:number}) => void} [options.setSize] — required if `size` is set
 * @param {{width:number,height:number}} [options.initialSize] — uncontrolled default
 * @param {boolean} [options.resizable=true]
 * @param {'corner'|'edges'} [options.resizeVariant='corner'] — `edges` = bottom, right, SE (System Info)
 * @param {(e: PointerEvent) => boolean} [options.shouldCancelDrag] — return true to ignore drag start
 * @param {{width?:number,height?:number}} [options.minSize] — override viewport minimums for resize
 * @param {{width?:number,height?:number}} [options.maxSize] — override viewport maximums for resize
 */
export const useFloatingWidgetFrame = ({
  setPosition,
  position,
  size: controlledSize,
  setSize: setControlledSize,
  initialSize,
  resizable = true,
  resizeVariant = 'corner',
  shouldCancelDrag,
  minSize: minSizeOption,
  maxSize: maxSizeOption,
}) => {
  const widgetRef = useRef(null);
  const positionRef = useRef(position);
  const sizeRef = useRef(null);

  const isControlled = controlledSize != null && typeof setControlledSize === 'function';

  const [internalSize, setInternalSize] = useState(() => {
    const initial = initialSize || defaultUncontrolledSize();
    sizeRef.current = initial;
    return initial;
  });

  const size = isControlled ? controlledSize : internalSize;
  const setSize = isControlled ? setControlledSize : setInternalSize;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const handleDragMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      const { width: sw, height: sh } = getViewportSize();
      const sz = sizeRef.current || size;

      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;
      const boundedX = Math.max(0, Math.min(sw - sz.width, newX));
      const boundedY = Math.max(0, Math.min(sh - sz.height, newY));

      setPosition({ x: boundedX, y: boundedY });
    },
    [isDragging, dragOffset, setPosition, size.width, size.height]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResizeMove = useCallback(
    (e) => {
      if (!isResizing || !resizeStart) return;

      const vb = viewportResizeBounds();
      const minWidth = minSizeOption?.width ?? vb.minWidth;
      const maxWidth = maxSizeOption?.width ?? vb.maxWidth;
      const minHeight = minSizeOption?.height ?? vb.minHeight;
      const maxHeight = maxSizeOption?.height ?? vb.maxHeight;
      const pos = positionRef.current;

      if (resizeEdge === 'corner') {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
        setSize({ width: newWidth, height: newHeight });
        return;
      }

      if (resizeEdge === 'e') {
        const newWidth = Math.max(
          minWidth,
          Math.min(maxWidth, e.clientX - pos.x - resizeStart.offRight)
        );
        setSize({ width: newWidth, height: resizeStart.startH });
        return;
      }

      if (resizeEdge === 's') {
        const newHeight = Math.max(
          minHeight,
          Math.min(maxHeight, e.clientY - pos.y - resizeStart.offBottom)
        );
        setSize({ width: resizeStart.startW, height: newHeight });
        return;
      }

      if (resizeEdge === 'se') {
        const newWidth = Math.max(
          minWidth,
          Math.min(maxWidth, e.clientX - pos.x - resizeStart.offRight)
        );
        const newHeight = Math.max(
          minHeight,
          Math.min(maxHeight, e.clientY - pos.y - resizeStart.offBottom)
        );
        setSize({ width: newWidth, height: newHeight });
      }
    },
    [isResizing, resizeStart, resizeEdge, setSize, minSizeOption, maxSizeOption]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeEdge(null);
    setResizeStart(null);
    const el = widgetRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nextSize = { width: rect.width, height: rect.height };
    sizeRef.current = nextSize;
    const clamped = clampFloatingWidgetPosition(positionRef.current, nextSize);
    if (clamped.x !== positionRef.current.x || clamped.y !== positionRef.current.y) {
      setPosition(clamped);
    }
  }, [setPosition]);

  const handleDragPointerDown = useCallback(
    (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (e.target.closest('.page-btn')) return;
      if (shouldCancelDrag?.(e)) return;

      e.preventDefault();
      setIsDragging(true);
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [shouldCancelDrag]
  );

  const beginResize = useCallback(
    (e, edge) => {
      if (!resizable) return;
      e.stopPropagation();
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      const rect = widgetRef.current.getBoundingClientRect();

      setIsResizing(true);
      setResizeEdge(edge);

      if (resizeVariant === 'edges' && (edge === 'e' || edge === 's' || edge === 'se')) {
        setResizeStart({
          edge,
          startW: rect.width,
          startH: rect.height,
          offRight: e.clientX - rect.right,
          offBottom: e.clientY - rect.bottom,
        });
        return;
      }

      setResizeStart({
        edge: 'corner',
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      });
    },
    [resizable, resizeVariant]
  );

  const handleResizePointerDown = useCallback(
    (e) => beginResize(e, 'corner'),
    [beginResize]
  );

  const handleResizeSouthEastPointerDown = useCallback(
    (e) => beginResize(e, resizeVariant === 'edges' ? 'se' : 'corner'),
    [beginResize, resizeVariant]
  );

  const handleResizeSouthPointerDown = useCallback((e) => beginResize(e, 's'), [beginResize]);

  const handleResizeEastPointerDown = useCallback((e) => beginResize(e, 'e'), [beginResize]);

  useEffect(() => {
    if (!isDragging) return undefined;

    document.addEventListener('pointermove', handleDragMove);
    document.addEventListener('pointerup', handleDragEnd);
    document.addEventListener('pointercancel', handleDragEnd);
    return () => {
      document.removeEventListener('pointermove', handleDragMove);
      document.removeEventListener('pointerup', handleDragEnd);
      document.removeEventListener('pointercancel', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (!isResizing) return undefined;

    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
    document.addEventListener('pointercancel', handleResizeEnd);
    return () => {
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
      document.removeEventListener('pointercancel', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    const handleWindowResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxWidth = Math.min(800, vw * 0.8);
      const maxHeight = Math.min(600, vh * 0.7);

      const prev = sizeRef.current || { width: 280, height: 400 };
      const next = {
        width: Math.min(prev.width, maxWidth),
        height: Math.min(prev.height, maxHeight),
      };
      sizeRef.current = next;
      setSize(next);

      const pos = positionRef.current;
      const clamped = clampFloatingWidgetPosition(pos, next);
      if (clamped.x !== pos.x || clamped.y !== pos.y) {
        setPosition(clamped);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [setPosition, setSize]);

  return {
    widgetRef,
    size,
    setSize,
    isDragging,
    isResizing,
    handleDragPointerDown,
    /** @deprecated use handleDragPointerDown */
    handleHeaderPointerDown: handleDragPointerDown,
    /** @deprecated */
    handleHeaderMouseDown: handleDragPointerDown,
    handleResizePointerDown,
    /** @deprecated */
    handleResizeStart: handleResizePointerDown,
    handleResizeSouthEastPointerDown,
    handleResizeSouthPointerDown,
    handleResizeEastPointerDown,
  };
};
