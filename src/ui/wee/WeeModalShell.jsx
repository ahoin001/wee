import React, { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Dialog } from '@headlessui/react';
import { m } from 'framer-motion';
import { X } from 'lucide-react';
import { useDialogExitPresence } from '../../hooks/useDialogExitPresence';
import { useWeeMotion, WEE_VARIANTS } from '../../design/weeMotion';
import './wee-modal.css';

const MotionDiv = m.div;

/**
 * Headless UI Dialog + wee visual shell: backdrop blur, rounded shell, optional left rail slot.
 * Close motion: `useDialogExitPresence` + variant `open`/`closed` so Headless does not unmount early.
 */
function WeeModalShell({
  isOpen,
  onClose,
  headerTitle,
  rail,
  children,
  footerContent,
  maxWidth,
  showRail = true,
  className = '',
  panelClassName = '',
  onExitAnimationComplete,
}) {
  const { backdropTransition, modalTransition } = useWeeMotion();
  const { allowMount, onPanelAnimationComplete } = useDialogExitPresence(isOpen, onExitAnimationComplete);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const effectiveMaxWidth =
    maxWidth ?? (showRail ? 'min(1160px, 95vw)' : 'min(1280px, 96vw)');

  const panelLayoutClass = showRail && rail ? 'md:flex-row' : 'flex-col';

  const backdropVariants = useMemo(
    () => ({
      open: { opacity: 1 },
      closed: WEE_VARIANTS.modalBackdropExit,
    }),
    []
  );

  const panelVariants = useMemo(
    () => ({
      open: WEE_VARIANTS.modalPanelAnimate,
      closed: WEE_VARIANTS.modalPanelExit,
    }),
    []
  );

  if (typeof document === 'undefined') {
    return null;
  }

  if (!allowMount) {
    return null;
  }

  const modalTree = (
    <Dialog as="div" className="relative z-[99999]" open={true} onClose={handleClose}>
      <div className="fixed inset-0 z-[99998] pointer-events-auto">
        <MotionDiv
          className="fixed inset-0 backdrop-blur-[12px] bg-[hsl(var(--wee-overlay-backdrop))]"
          aria-hidden="true"
          variants={backdropVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
          transition={backdropTransition}
        />
      </div>

      <div className="fixed inset-0 z-[99999] overflow-y-auto pointer-events-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <Dialog.Panel
            className="wee-modal-panel relative z-[99999] w-full"
            style={{ maxWidth: effectiveMaxWidth }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Plain Panel + inner motion.div: Framer completion/variants on a real motion node (not Headless `as={motion}`). */}
            <MotionDiv
              layout
              className={`
                  flex w-full min-h-0 max-h-[min(88dvh,920px)] overflow-hidden flex-col
                  border-[0.5rem] border-[hsl(var(--wee-border-outer))]
                  rounded-[var(--wee-radius-shell)] bg-[hsl(var(--wee-surface-shell))]
                  shadow-[var(--wee-shadow-modal)]
                  ${panelLayoutClass}
                  ${className}
                `.trim()}
              variants={panelVariants}
              initial="closed"
              animate={isOpen ? 'open' : 'closed'}
              transition={modalTransition}
              onAnimationComplete={onPanelAnimationComplete}
            >
              {showRail && rail}

              <div className={`flex min-h-0 min-w-0 flex-1 flex-col bg-[hsl(var(--wee-surface-shell))] ${panelClassName}`}>
                <div className="flex shrink-0 items-center justify-between border-b-2 border-[hsl(var(--border-primary)/0.35)] px-8 py-6 md:px-10 md:py-7">
                  <Dialog.Title
                    as="h2"
                    className="m-0 max-w-[85%] text-left text-2xl font-black uppercase italic tracking-tighter text-[hsl(var(--wee-text-header))] md:text-3xl"
                  >
                    {headerTitle}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full p-3 text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--state-hover))] hover:text-[hsl(var(--text-primary))]"
                    aria-label="Close dialog"
                  >
                    <X size={24} strokeWidth={2} aria-hidden />
                  </button>
                </div>

                <m.div
                  layout
                  className="wee-modal-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[hsl(var(--wee-surface-well))] px-8 py-8 md:px-12 md:py-10"
                >
                  {children}
                </m.div>

                {footerContent && (
                  <div className="shrink-0 border-t-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-input))] px-8 py-5 md:px-10">
                    {typeof footerContent === 'function' ? footerContent({ handleClose }) : footerContent}
                  </div>
                )}
              </div>
            </MotionDiv>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );

  return createPortal(modalTree, document.body);
}

WeeModalShell.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  headerTitle: PropTypes.string.isRequired,
  rail: PropTypes.node,
  children: PropTypes.node.isRequired,
  footerContent: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  maxWidth: PropTypes.string,
  showRail: PropTypes.bool,
  className: PropTypes.string,
  panelClassName: PropTypes.string,
  onExitAnimationComplete: PropTypes.func,
};

WeeModalShell.defaultProps = {
  isOpen: true,
  rail: null,
  footerContent: null,
  maxWidth: null,
  showRail: true,
  className: '',
  panelClassName: '',
  onExitAnimationComplete: undefined,
};

export default WeeModalShell;
