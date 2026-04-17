import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../../ui/WButton';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { PLAYFUL_SPRINGS, PLAYFUL_VARIANTS } from '../../design/playfulMotion';

function WBaseModal({ 
  title, 
  onClose, 
  children, 
  footerContent,
  className = '',
  maxWidth = '1200px',
  isOpen = true
}) {
  const sharedPlayfulSpring = PLAYFUL_SPRINGS.navLayout;
  const { modalSpringTransitions, modalStaggeredEntrance } = useMotionFeedback();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const modalTree = (
    <AnimatePresence>
      {isOpen && (
      <Dialog as="div" className="relative z-[99999]" open={isOpen} onClose={handleClose}>
        {/* Full-screen overlay: captures pointer events (not clipped by transformed ancestors) */}
        <div className="fixed inset-0 z-[99998] pointer-events-auto">
          <motion.div
            className="fixed inset-0 bg-[hsl(var(--bg-overlay))] backdrop-blur-[8px]"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={modalSpringTransitions ? sharedPlayfulSpring : { duration: 0.2 }}
          />
        </div>

        {/* Modal */}
        <div className="fixed inset-0 z-[99999] overflow-y-auto pointer-events-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel
              as={motion.div}
              className={`w-[95%] max-h-[85vh] min-w-[800px] bg-[hsl(var(--surface-primary))] rounded-[2.2rem] border-[3px] border-[hsl(var(--color-pure-white)/0.85)] shadow-[var(--playful-shadow-elevated)] overflow-hidden flex flex-col lg:w-[90%] lg:min-w-[600px] md:w-[95%] md:min-w-[400px] sm:w-[98%] sm:min-w-[320px] relative z-[99999] ${className}`}
              style={{ maxWidth }}
              initial={PLAYFUL_VARIANTS.modalPanelInitial}
              animate={PLAYFUL_VARIANTS.modalPanelAnimate}
              exit={PLAYFUL_VARIANTS.modalPanelExit}
              transition={modalSpringTransitions ? sharedPlayfulSpring : { duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.div
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
              </motion.div>

              {/* Content */}
              <motion.div
                className="p-7 overflow-y-auto flex-1 min-h-0 scrollbar-soft scroll-region-inset pb-10"
                initial={modalStaggeredEntrance ? { opacity: 0, y: 8 } : false}
                animate={modalStaggeredEntrance ? { opacity: 1, y: 0 } : false}
                transition={modalStaggeredEntrance ? { ...sharedPlayfulSpring, delay: 0.08 } : undefined}
              >
                {children}
              </motion.div>

              {/* Footer */}
              {footerContent && (
                <motion.div
                  className="flex justify-end items-center px-8 py-5 gap-4 min-h-16 sticky bottom-0 left-0 right-0 z-10 bg-[hsl(var(--surface-secondary))] border-t-[3px] border-[hsl(var(--border-primary))] shadow-[var(--playful-inner-glow)]"
                  initial={modalStaggeredEntrance ? { opacity: 0, y: 10 } : false}
                  animate={modalStaggeredEntrance ? { opacity: 1, y: 0 } : false}
                  transition={modalStaggeredEntrance ? { ...sharedPlayfulSpring, delay: 0.14 } : undefined}
                >
                  {typeof footerContent === 'function' ? footerContent({ handleClose }) : footerContent}
                </motion.div>
              )}
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return null;
  }

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