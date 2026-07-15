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
 *
 * Mount in `.channel-space-chrome__stack` (viewport chrome above the dock) — not inside the
 * transformed space-world track, or the ribbon paints over it. Reads Home via
 * `useChannelOperations('home')`.
 *
 * Sits at the top of `--channel-page-indicator-band`, just under the channel grid and clear
 * of `--channel-ribbon-crest-clearance` (wave + time pill).
 */
function HomePageIndicator() {
  const { navigation, goToPage } = useChannelOperations('home');
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
    <div
      className="pointer-events-none absolute inset-x-0 z-[1] flex justify-center"
      style={{
        /* Top of reserved indicator band — snug under grid, above ribbon crest */
        bottom:
          'calc(var(--channel-ribbon-crest-clearance) + var(--channel-page-indicator-band) - 2.55rem)',
      }}
    >
      <div
        className="pointer-events-auto relative flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary)/0.75)]"
        role="group"
        aria-label={`Home pages — page ${currentPage + 1} of ${totalPages}`}
        tabIndex={0}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          // Keep expanded while focus moves between the dots inside the pill.
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
        }}
      >
        {/* Screen-reader page announcement (dots are hover/focus-revealed) */}
        <span className="sr-only" aria-live="polite">
          Page {currentPage + 1} of {totalPages}
        </span>
        <WeePillFloorShadow expanded={revealed} reducedMotion={reducedMotion} />
        <WeeGlassPill
          motion
          initial={false}
          animate={revealed ? 'open' : 'closed'}
          variants={variants}
          className="relative z-10 flex items-center justify-center gap-2 overflow-hidden rounded-full !shadow-none px-2"
        >
          {revealed ? (
            Array.from({ length: totalPages }, (_, page) => {
              const active = page === currentPage;
              return (
                <button
                  key={`home-page-dot-${page}`}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  aria-label={`Go to Home page ${page + 1}`}
                  onClick={() => goToPage(page)}
                  className={`h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary)/0.75)] ${
                    active
                      ? 'scale-125 bg-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--text-tertiary)/0.45)] hover:bg-[hsl(var(--text-tertiary)/0.7)]'
                  }`}
                />
              );
            })
          ) : (
            <span
              className="text-[length:var(--font-size-micro)] font-black uppercase tracking-wide text-[hsl(var(--text-secondary))]"
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
