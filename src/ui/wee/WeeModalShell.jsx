import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useWeeMotion, WEE_VARIANTS } from '../../design/weeMotion';
import './wee-modal.css';

/**
 * Headless UI Dialog + wee visual shell: backdrop blur, rounded shell, optional left rail slot.
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
}) {
  const {
    backdropTransition,
    modalTransition,
  } = useWeeMotion();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const effectiveMaxWidth =
    maxWidth ?? (showRail ? 'min(1160px, 95vw)' : 'min(1280px, 96vw)');

  const panelLayoutClass = showRail && rail ? 'md:flex-row' : 'flex-col';

  const modalTree = (
    <AnimatePresence>
      {isOpen && (
        <Dialog as="div" className="relative z-[99999]" open={isOpen} onClose={handleClose}>
          <div className="fixed inset-0 z-[99998] pointer-events-auto">
            <motion.div
              className="fixed inset-0 backdrop-blur-[12px] bg-[hsl(var(--wee-overlay-backdrop))]"
              aria-hidden="true"
              initial={WEE_VARIANTS.modalBackdropInitial}
              animate={WEE_VARIANTS.modalBackdropAnimate}
              exit={WEE_VARIANTS.modalBackdropExit}
              transition={backdropTransition}
            />
          </div>

          <div className="fixed inset-0 z-[99999] overflow-y-auto pointer-events-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <Dialog.Panel
                as={motion.div}
                className={`
                  relative z-[99999] flex w-full overflow-hidden flex-col
                  border-[0.5rem] border-[hsl(var(--wee-border-outer))]
                  rounded-[var(--wee-radius-shell)] bg-[hsl(var(--wee-surface-shell))]
                  shadow-[var(--wee-shadow-modal)]
                  max-h-[88vh] min-h-0
                  ${panelLayoutClass}
                  ${className}
                `.trim()}
                style={{ maxWidth: effectiveMaxWidth }}
                initial={WEE_VARIANTS.modalPanelInitial}
                animate={WEE_VARIANTS.modalPanelAnimate}
                exit={WEE_VARIANTS.modalPanelExit}
                transition={modalTransition}
                onClick={(e) => e.stopPropagation()}
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

                  <div className="wee-modal-scroll min-h-0 flex-1 overflow-y-auto bg-[hsl(var(--wee-surface-well))] px-8 py-8 md:px-12 md:py-10">
                    {children}
                  </div>

                  {footerContent && (
                    <div className="shrink-0 border-t-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-input))] px-8 py-5 md:px-10">
                      {typeof footerContent === 'function' ? footerContent({ handleClose }) : footerContent}
                    </div>
                  )}
                </div>
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
};

WeeModalShell.defaultProps = {
  isOpen: true,
  rail: null,
  footerContent: null,
  maxWidth: null,
  showRail: true,
  className: '',
  panelClassName: '',
};

export default WeeModalShell;
