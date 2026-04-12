import { useState, useRef, useCallback, useEffect } from 'react';

export const useFloatingWidgetFrame = ({ setPosition }) => {
  const widgetRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [size, setSize] = useState(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const responsiveWidth = Math.min(Math.max(screenWidth * 0.35, 280), 600);
    const responsiveHeight = Math.min(Math.max(screenHeight * 0.4, 250), 500);
    return { width: responsiveWidth, height: responsiveHeight };
  });

  const handleHeaderMouseDown = useCallback((e) => {
    if (e.target.closest('.page-btn')) return;

    setIsDragging(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const boundedX = Math.max(0, Math.min(screenWidth - size.width, newX));
    const boundedY = Math.max(0, Math.min(screenHeight - size.height, newY));

    setPosition({ x: boundedX, y: boundedY });
  }, [isDragging, dragOffset, setPosition, size.width, size.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minWidth = Math.max(200, screenWidth * 0.15);
    const maxWidth = Math.min(800, screenWidth * 0.8);
    const minHeight = Math.max(150, screenHeight * 0.2);
    const maxHeight = Math.min(600, screenHeight * 0.7);

    const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
    const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));

    setSize({ width: newWidth, height: newHeight });
  }, [isResizing, resizeStart]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return undefined;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!isResizing) return undefined;

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    const handleWindowResize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const maxWidth = Math.min(800, screenWidth * 0.8);
      const maxHeight = Math.min(600, screenHeight * 0.7);

      if (size.width > maxWidth || size.height > maxHeight) {
        setSize((prev) => ({
          width: Math.min(prev.width, maxWidth),
          height: Math.min(prev.height, maxHeight),
        }));
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [size.width, size.height]);

  return {
    widgetRef,
    size,
    setSize,
    isDragging,
    isResizing,
    handleHeaderMouseDown,
    handleResizeStart,
  };
};
