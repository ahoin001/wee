import { CHANNEL_PAGE_FLIP_MS } from '../../utils/channelLayoutSystem';

/** Legacy CSS strip helper — duration must stay on CHANNEL_PAGE_FLIP_MS (same as Framer channelPageFlip). */
const PAGE_FLIP_S = CHANNEL_PAGE_FLIP_MS / 1000;

export const createSimplePageGridStyle = (columns, rows) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columns}, minmax(180px, 1fr))`,
  gridTemplateRows: `repeat(${rows}, minmax(110px, 1fr))`,
  gap: 'clamp(10px, 2vw, 20px)',
  padding: 'clamp(10px, 2vw, 20px)',
  height: '100%',
  width: '100%',
  minHeight: '0',
  minWidth: '0',
  boxSizing: 'border-box',
  alignContent: 'center',
  justifyContent: 'center',
});

export const createWiiStripGridStyle = ({ columns, rows, totalPages, currentPage, isAnimating }) => {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.max(0, Math.min(Number(currentPage) || 0, safeTotalPages - 1));
  const pageStepPercent = 100 / safeTotalPages;

  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns * safeTotalPages}, minmax(0, 1fr))`,
    // Equal fr tracks only — shared rows must not grow with widget content (see WiiChannelStrip).
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    gap: 'clamp(10px, 1.2vw, 16px)',
    padding: 'clamp(18px, 3vh, 32px) clamp(14px, 2vw, 26px) clamp(136px, 18vh, 220px)',
    height: '100%',
    width: `${safeTotalPages * 100}%`,
    minHeight: '0',
    minWidth: '0',
    boxSizing: 'border-box',
    alignContent: 'stretch',
    justifyContent: 'stretch',
    position: 'absolute',
    inset: 0,
    transform: `translateX(-${safeCurrentPage * pageStepPercent}%)`,
    transition: isAnimating
      ? `transform ${PAGE_FLIP_S}s cubic-bezier(0.22, 0.61, 0.36, 1)`
      : 'none',
    willChange: 'transform',
  };
};

