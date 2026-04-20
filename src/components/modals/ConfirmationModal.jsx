import React from 'react';
import { WBaseModal } from '../core';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import { useUIState } from '../../utils/useConsolidatedAppHooks';

/**
 * Global Confirmation Modal Component
 * 
 * This component provides a reusable confirmation modal that can be used throughout the app.
 * It's controlled by the Zustand store and can be triggered from anywhere in the app.
 * 
 * Usage Examples:
 * 
 * // Simple delete confirmation
 * const { confirmDelete } = useUIState();
 * confirmDelete('My Item', () => deleteItem());
 * 
 * // Custom confirmation
 * const { confirmAction } = useUIState();
 * confirmAction(
 *   'Save Changes', 
 *   'Do you want to save your changes?', 
 *   () => saveChanges(),
 *   null,
 *   'Save',
 *   'primary'
 * );
 * 
 * // Full custom modal
 * const { openConfirmationModal } = useUIState();
 * openConfirmationModal({
 *   title: 'Custom Title',
 *   message: 'Custom message with <strong>HTML</strong>',
 *   confirmText: 'Proceed',
 *   cancelText: 'Go Back',
 *   confirmVariant: 'danger-primary',
 *   onConfirm: () => customAction(),
 *   onCancel: () => customCancel()
 * });
 */
const ConfirmationModal = () => {
  const { 
    showConfirmationModal, 
    confirmationModalData, 
    closeConfirmationModal 
  } = useUIState();
  const modalData = confirmationModalData || {};
  const title = modalData.title || 'Confirm action';
  const message = modalData.message || 'Are you sure you want to continue?';
  const cancelText = modalData.cancelText || 'Cancel';
  const confirmText = modalData.confirmText || 'Confirm';
  const confirmVariant = modalData.confirmVariant || 'primary';

  const handleConfirm = () => {
    if (modalData.onConfirm) {
      modalData.onConfirm();
    }
    closeConfirmationModal();
  };

  const handleCancel = () => {
    if (modalData.onCancel) {
      modalData.onCancel();
    }
    closeConfirmationModal();
  };

  return (
    <WBaseModal
      isOpen={showConfirmationModal}
      title={title}
      onClose={handleCancel}
      maxWidth="600px"
      footerContent={() => (
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button 
            variant={confirmVariant} 
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      )}
    >
      <div className="py-5">
        <div 
          dangerouslySetInnerHTML={{ __html: message }}
          className="mb-4 leading-relaxed text-[hsl(var(--text-primary))]"
        />
      </div>
    </WBaseModal>
  );
};

export default ConfirmationModal; 


