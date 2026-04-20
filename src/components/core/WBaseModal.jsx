import React, { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Dialog } from '@headlessui/react';
import { m } from 'framer-motion';
import Button from '../../ui/WButton';
import { useDialogExitPresence } from '../../hooks/useDialogExitPresence';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { PLAYFUL_SPRINGS, PLAYFUL_VARIANTS } from '../../design/playfulMotion';

const MotionDiv = m.div;

function WBaseModal({
  title,
  onClose,
  children,
  footerContent,
  className = '',
  maxWidth = '1200px',
  /** Default closed so callers that omit `isOpen` do not flash an open modal. */
  isOpen = false,
}) {
  const sharedPlayfulSpring = PLAYFUL_SPRINGS.navLayout;
  const { modalSpringTransitions, modalStaggeredEntrance } = useMotionFeedback();
  const { allowMount, onPanelAnimationComplete } = useDialogExitPresence(isOpen);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const backdropTransition = modalSpringTransitions ? sharedPlayfulSpring : { duration: 0.2 };
  const panelTransition = modalSpringTransitions ? sharedPlayfulSpring : { duration: 0.22 };

  const backdropVariants = useMemo(
    () => ({
      open: { opacity: 1 },
      closed: { opacity: 0 },
    }),
    []
  );

  const panelVariants = useMemo(
    () => ({
      open: PLAYFUL_VARIANTS.modalPanelAnimate,
      closed: PLAYFUL_VARIANTS.modalPanelExit,
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
          className="fixed inset-0 bg-[hsl(var(--bg-overlay))] backdrop-blur-[8px]"
          aria-hidden="true"
          variants={backdropVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
          transition={backdropTransition}
        />
      </div>

      <div className="fixed inset-0 z-[99999] overflow-y-auto pointer-events-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel
            className={`relative z-[99999] w-full min-w-0 max-w-[min(1240px,96vw)] sm:max-w-[98vw] ${className}`}
            style={{ maxWidth }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inner motion layer: reliable `onAnimationComplete` + variants vs `Dialog.Panel as={motion}`. */}
            <MotionDiv
              layout
              className="max-h-[min(88dvh,920px)] min-h-0 overflow-hidden flex flex-col w-full bg-[hsl(var(--surface-primary))] rounded-[2.2rem] border-[3px] border-[hsl(var(--color-pure-white)/0.85)] shadow-[var(--playful-shadow-elevated)]"
              variants={panelVariants}
              initial="closed"
              animate={isOpen ? 'open' : 'closed'}
              transition={panelTransition}
              onAnimationComplete={onPanelAnimationComplete}
            >
              <MotionDiv
                className="flex justify-between items-center p-7 border-b-[3px] border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary)/0.72)]"
                initial={modalStaggeredEntrance ? { opacity: 0, y: -8 } : false}
                animate={modalStaggeredEntrance ? { opacity: 1, y: 0 } : false}
                transition={modalStaggeredEntrance ? { ...sharedPlayfulSpring, delay: 0.04 } : undefined}
              >
                <Dialog.Title as="h2" className="m-0 playful-hero-text text-[hsl(var(--text-primary))]">
                  {title}
                </Dialog.Title>
                <Button
                  variant="tertiary"
                  onClick={handleClose}
                  className="!bg-none !border-none text-2xl !p-1 !min-w-auto !w-auto"
                >
                  ×
                </Button>
              </MotionDiv>

              <MotionDiv
                className="p-7 overflow-y-auto flex-1 min-h-0 scrollbar-soft scroll-region-inset pb-10"
                initial={modalStaggeredEntrance ? { opacity: 0, y: 8 } : false}
                animate={modalStaggeredEntrance ? { opacity: 1, y: 0 } : false}
                transition={modalStaggeredEntrance ? { ...sharedPlayfulSpring, delay: 0.08 } : undefined}
              >
                {children}
              </MotionDiv>

              {footerContent && (
                <MotionDiv
                  className="flex justify-end items-center px-8 py-5 gap-4 min-h-16 sticky bottom-0 left-0 right-0 z-10 bg-[hsl(var(--surface-secondary))] border-t-[3px] border-[hsl(var(--border-primary))] shadow-[var(--playful-inner-glow)]"
                  initial={modalStaggeredEntrance ? { opacity: 0, y: 10 } : false}
                  animate={modalStaggeredEntrance ? { opacity: 1, y: 0 } : false}
                  transition={modalStaggeredEntrance ? { ...sharedPlayfulSpring, delay: 0.14 } : undefined}
                >
                  {typeof footerContent === 'function' ? footerContent({ handleClose }) : footerContent}
                </MotionDiv>
              )}
            </MotionDiv>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );

  return createPortal(modalTree, document.body);
}

WBaseModal.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  footerContent: PropTypes.node,
  className: PropTypes.string,
  maxWidth: PropTypes.string,
  isOpen: PropTypes.bool,
};

export default WBaseModal;
