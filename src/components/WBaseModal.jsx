import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import Button from '../ui/WButton';

function WBaseModal({ 
  title, 
  onClose, 
  children, 
  footerContent,
  className = '',
  maxWidth = '1200px',
  isOpen = true
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    // Wait for close animation to complete
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={handleClose}>
        {/* Backdrop - synchronized with modal animation */}
        <div 
          className="fixed inset-0 bg-[hsl(var(--bg-overlay))] backdrop-blur-[4px] transition-opacity duration-300"
          style={{
            opacity: isAnimating ? 1 : 0
          }}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel 
              className={`w-[95%] max-h-[85vh] min-w-[800px] bg-[hsl(var(--surface-primary))] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden flex flex-col lg:w-[90%] lg:min-w-[600px] md:w-[95%] md:min-w-[400px] sm:w-[98%] sm:min-w-[320px] ${className}`}
              style={{ 
                maxWidth,
                animation: isAnimating 
                  ? 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                  : 'modalSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-[hsl(var(--border-primary))]">
                <Dialog.Title as="h2" className="m-0 text-2xl font-semibold text-[hsl(var(--text-primary))]">
                  {title}
                </Dialog.Title>
                <Button 
                  variant="tertiary" 
                  onClick={handleClose}
                  className="!bg-none !border-none text-2xl !p-1 !min-w-auto !w-auto"
                >
                  ×
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 40 }}>
                {children}
              </div>

              {/* Footer */}
              {footerContent && (
                <div className="flex justify-end items-center px-8 py-4 gap-4 min-h-16 sticky bottom-0 left-0 right-0 z-10 bg-[hsl(var(--surface-secondary))] border-t border-[hsl(var(--border-primary))] shadow-[var(--shadow-sm)]">
                  {typeof footerContent === 'function' ? footerContent({ handleClose }) : footerContent}
                </div>
              )}
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
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