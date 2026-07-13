import React, { useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  createWeeSideNavPeekVariants,
  useWeeMotion,
} from '../../design/weeMotion';
import { WeeGlassPill, WeePillFloorShadow } from '../../ui/wee';
import useChannelOperations from '../../utils/useChannelOperations';

const COMPACT_PX = 40;
const DOT_STEP_PX = 22;

/**
 * Pill Morph Reveal page indicator for the Home board: compact page-count disc that expands
 * into clickable page dots on hover/focus. Horizontal twin of `WeeGooeySideNavButton`.
 * Mount inside a Home `ChannelSpaceProvider` — reads navigation via `useChannelOperations`.
 */
function HomePageIndicator() {
  const { navigation, goToPage } = useChannelOperations();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const { pillOpen, pillClose } = useWeeMotion();

  const totalPages = Math.max(1, Number(navigation.totalPages) || 1);
  const currentPage = Math.max(0, Math.min(Number(navigation.currentPage) || 0, totalPages - 1));
  const revealed = hovered || focused;
  const expandedWidth = Math.max(COMPACT_PX + 16, totalPages * DOT_STEP_PX + 24);

  const variants = useMemo(
    () =>
      createWeeSideNavPeekVariants(null, {
        compactSize: COMPACT_PX,
        expandedWidth,
        expandedHeight: COMPACT_PX,
        pillClose,
        pillOpen,
        reducedMotion,
      }),
    [expandedWidth, pillClose, pillOpen, reducedMotion]
  );

  if (totalPages <= 1) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[5] flex justify-center md:bottom-4">
      <div
        className="pointer-events-auto relative flex items-center justify-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <WeePillFloorShadow expanded={revealed} reducedMotion={reducedMotion} />
        <WeeGlassPill
          motion
          initial={false}
          animate={revealed ? 'open' : 'closed'}
          variants={variants}
          className="relative z-10 flex items-center justify-center gap-2 overflow-hidden rounded-full !shadow-none px-2"
          role="tablist"
          aria-label="Home page"
        >
          {revealed ? (
            Array.from({ length: totalPages }, (_, page) => {
              const active = page === currentPage;
              return (
                <button
                  key={`home-page-dot-${page}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Go to Home page ${page + 1}`}
                  onClick={() => goToPage(page)}
                  className={`h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-150 ${
                    active
                      ? 'scale-125 bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--text-tertiary)/0.45)] hover:bg-[hsl(var(--text-tertiary)/0.7)]'
                  }`}
                />
              );
            })
          ) : (
            <span
              className="text-[10px] font-black uppercase tracking-wide text-[hsl(var(--text-secondary))]"
              aria-hidden
            >
              {currentPage + 1}/{totalPages}
            </span>
          )}
        </WeeGlassPill>
      </div>
    </div>
  );
}

export default React.memo(HomePageIndicator);
