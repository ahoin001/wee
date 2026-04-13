import React from 'react';

const ScrollArea = React.forwardRef(({
  className = '',
  hideScrollbar = false,
  ...props
}, ref) => {
  const scrollbarClass = hideScrollbar
    ? 'scrollbar-hidden'
    : 'scrollbar-soft scroll-region-inset';
  return (
    <div
      ref={ref}
      className={`${scrollbarClass} ${className}`.trim()}
      {...props}
    />
  );
});

ScrollArea.displayName = 'ScrollArea';

export default ScrollArea;
