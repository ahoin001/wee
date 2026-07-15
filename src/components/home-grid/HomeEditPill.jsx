import React, { useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PenLine } from 'lucide-react';
import { createWeeSideNavPeekVariants, useWeeMotion } from '../../design/weeMotion';
import { WeeGlassPill, WeePillFloorShadow } from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useHomeBoardArrange } from '../../hooks/useHomeBoardArrange';

const COMPACT_PX = 40;
const EXPANDED_PX = 128;

/**
 * Compact, always-discoverable **Edit Home** entry: glass disc that morphs open to a
 * labeled pill on hover/focus (Pill Morph Reveal — horizontal twin of HomePageIndicator).
 * Right-click on the board and Ctrl+E stay as secondary entries.
 *
 * Mount in `.channel-space-chrome__stack` next to HomePageIndicator; visible only on the
 * live Home space and hidden while Edit Home is already active.
 */
function HomeEditPill() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const { pillOpen, pillClose } = useWeeMotion();
  const activeSpaceId = useConsolidatedAppStore((s) => s.spaces.activeSpaceId);
  const { arrangeMode, enterArrange } = useHomeBoardArrange();

  const revealed = hovered || focused;

  const variants = useMemo(
    () =>
      createWeeSideNavPeekVariants(null, {
        compactSize: COMPACT_PX,
        expandedWidth: EXPANDED_PX,
        expandedHeight: COMPACT_PX,
        pillClose,
        pillOpen,
        reducedMotion,
      }),
    [pillClose, pillOpen, reducedMotion]
  );

  if (activeSpaceId !== 'home' || arrangeMode) return null;

  return (
    <div
      className="pointer-events-none absolute z-[1]"
      style={{
        right: 'max(1.25rem, env(safe-area-inset-right))',
        bottom:
          'calc(var(--channel-ribbon-crest-clearance) + var(--channel-page-indicator-band) - 2.55rem)',
      }}
    >
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
          className="relative z-10 overflow-hidden rounded-full !shadow-none"
        >
          <button
            type="button"
            onClick={() => enterArrange()}
            aria-label="Edit Home — arrange tiles and widgets"
            className="flex h-full w-full items-center justify-center gap-2 whitespace-nowrap rounded-full text-[hsl(var(--text-secondary))] transition-colors hover:text-[hsl(var(--text-primary))] focus-visible:outline-none"
          >
            <PenLine size={15} strokeWidth={2.5} aria-hidden className="shrink-0" />
            {revealed ? (
              <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                Edit Home
              </span>
            ) : null}
          </button>
        </WeeGlassPill>
      </div>
    </div>
  );
}

export default React.memo(HomeEditPill);
