/**
 * Fluid glass tip / tooltip — same WeeGlassPill + pillOpen/pillClose language as the space rail.
 * Prefer this over ad-hoc rounded-full badge tips or native `title` chrome.
 *
 * Tips portal to `document.body` when anchored so parent `overflow: hidden` cannot clip them.
 */
import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';
import { getWeePopoverEntrance, useWeeMotion } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import WeeGlassPill from './WeeGlassPill';
import WeePillFloorShadow from './WeePillFloorShadow';

const MotionDiv = m.div;

const GAP_PX = 10;

/**
 * Fixed placement + Framer x/y so placement and scale share one transform.
 * @param {DOMRect | { top: number, left: number, width: number, height: number, bottom?: number, right?: number }} anchor
 * @param {'top' | 'bottom' | 'left' | 'right'} side
 */
function portalPlacement(anchor, side) {
  if (!anchor) return null;
  const midX = anchor.left + anchor.width / 2;
  const midY = anchor.top + anchor.height / 2;
  const bottom = anchor.bottom ?? anchor.top + anchor.height;
  const right = anchor.right ?? anchor.left + anchor.width;

  if (side === 'bottom') {
    return {
      style: { position: 'fixed', left: midX, top: bottom + GAP_PX, zIndex: 100000 },
      x: '-50%',
      y: '0%',
    };
  }
  if (side === 'left') {
    return {
      style: { position: 'fixed', left: anchor.left - GAP_PX, top: midY, zIndex: 100000 },
      x: '-100%',
      y: '-50%',
    };
  }
  if (side === 'right') {
    return {
      style: { position: 'fixed', left: right + GAP_PX, top: midY, zIndex: 100000 },
      x: '0%',
      y: '-50%',
    };
  }
  return {
    style: { position: 'fixed', left: midX, top: anchor.top - GAP_PX, zIndex: 100000 },
    x: '-50%',
    y: '-100%',
  };
}

function PopoverBubble({ label, gooey, reducedMotion }) {
  return (
    <div className="relative flex flex-col items-center">
      <WeeGlassPill
        motion
        className={[
          'relative z-10 max-w-[min(16rem,72vw)] rounded-[1.35rem] px-3.5 py-2',
          gooey ? 'will-change-transform' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {typeof label === 'string' ? (
          <span className="block text-center text-[10px] font-black uppercase italic leading-snug tracking-[0.14em] text-[hsl(var(--text-primary))]">
            {label}
          </span>
        ) : (
          label
        )}
      </WeeGlassPill>
      <WeePillFloorShadow
        expanded={false}
        reducedMotion={reducedMotion}
        className="-bottom-3 w-10 opacity-80"
      />
    </div>
  );
}

PopoverBubble.propTypes = {
  label: PropTypes.node,
  gooey: PropTypes.bool,
  reducedMotion: PropTypes.bool,
};

/**
 * Presentational popover bubble.
 * Pass `anchor` (getBoundingClientRect) to portal above the board; omit for in-flow absolute.
 */
export function WeePopover({
  open = false,
  content = null,
  side = 'top',
  className = '',
  id = undefined,
  role = 'tooltip',
  anchor = null,
}) {
  const { reducedMotion, pillOpen } = useWeeMotion();
  const mf = useMotionFeedback();
  const gooey = mf.gooey?.enabled !== false && !reducedMotion;
  const label = typeof content === 'string' ? content.trim() : content;
  const portal = Boolean(anchor) && typeof document !== 'undefined';
  const placement = portal ? portalPlacement(anchor, side) : null;
  const entrance = getWeePopoverEntrance(side, reducedMotion, pillOpen, {
    drift: !portal,
  });

  if (label == null || label === '') return null;

  const bubble = (
    <AnimatePresence>
      {open && (!portal || placement) ? (
        <MotionDiv
          key="wee-popover"
          id={id}
          role={role}
          className={[
            'pointer-events-none',
            portal ? '' : 'absolute z-[80]',
            !portal && side === 'top' ? 'bottom-full left-1/2 mb-2.5 -translate-x-1/2' : '',
            !portal && side === 'bottom' ? 'top-full left-1/2 mt-2.5 -translate-x-1/2' : '',
            !portal && side === 'left' ? 'right-full top-1/2 mr-2.5 -translate-y-1/2' : '',
            !portal && side === 'right' ? 'left-full top-1/2 ml-2.5 -translate-y-1/2' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={portal ? placement.style : entrance.style}
          initial={
            portal
              ? { opacity: 0, scale: 0.86, x: placement.x, y: placement.y }
              : entrance.initial
          }
          animate={
            portal
              ? { opacity: 1, scale: 1, x: placement.x, y: placement.y }
              : entrance.animate
          }
          exit={
            portal
              ? {
                  opacity: 0,
                  scale: 0.9,
                  x: placement.x,
                  y: placement.y,
                  transition: entrance.exit?.transition || entrance.transition,
                }
              : entrance.exit
          }
          transition={entrance.transition}
        >
          <PopoverBubble label={label} gooey={gooey} reducedMotion={reducedMotion} />
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  );

  if (portal) {
    return createPortal(bubble, document.body);
  }
  return bubble;
}

WeePopover.propTypes = {
  open: PropTypes.bool,
  content: PropTypes.node,
  side: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  className: PropTypes.string,
  id: PropTypes.string,
  role: PropTypes.string,
  anchor: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    bottom: PropTypes.number,
    right: PropTypes.number,
  }),
};

/**
 * Trigger wrapper — opens a portaled {@link WeePopover} on hover / focus.
 */
export function WeeHoverTip({
  content = null,
  side = 'top',
  disabled = false,
  children,
  className = '',
  popoverClassName = '',
}) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const tipId = useId();
  const show = Boolean(open && !disabled && content);

  const syncAnchor = () => {
    const el = wrapRef.current;
    if (!el) return;
    setAnchor(el.getBoundingClientRect());
  };

  useLayoutEffect(() => {
    if (!show) return undefined;
    syncAnchor();
    const onReposition = () => syncAnchor();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [show]);

  return (
    <span
      ref={wrapRef}
      className={['relative inline-flex max-w-full', className].filter(Boolean).join(' ')}
      onMouseEnter={() => {
        syncAnchor();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => {
        syncAnchor();
        setOpen(true);
      }}
      onBlur={() => setOpen(false)}
    >
      {typeof children === 'function' ? children({ open: show, tipId }) : children}
      <WeePopover
        open={show}
        content={content}
        side={side}
        id={tipId}
        className={popoverClassName}
        anchor={anchor}
      />
    </span>
  );
}

WeeHoverTip.propTypes = {
  content: PropTypes.node,
  side: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  disabled: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  className: PropTypes.string,
  popoverClassName: PropTypes.string,
};

export default WeePopover;
