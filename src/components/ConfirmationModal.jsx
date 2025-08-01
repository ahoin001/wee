import React from 'react';
import BaseModal from './BaseModal';
import Button from '../ui/Button';
import Text from '../ui/Text';
import useUIStore from '../utils/useUIStore';

/**
 * Global Confirmation Modal Component
 * 
 * This component provides a reusable confirmation modal that can be used throughout the app.
 * It's controlled by the Zustand store and can be triggered from anywhere in the app.
 * 
 * Usage Examples:
 * 
 * // Simple delete confirmation
 * const { confirmDelete } = useUIStore();
 * confirmDelete('My Item', () => deleteItem());
 * 
 * // Custom confirmation
 * const { confirmAction } = useUIStore();
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
 * const { openConfirmationModal } = useUIStore();
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
  } = useUIStore();

  const handleConfirm = () => {
    if (confirmationModalData.onConfirm) {
      confirmationModalData.onConfirm();
    }
    closeConfirmationModal();
  };

  const handleCancel = () => {
    if (confirmationModalData.onCancel) {
      confirmationModalData.onCancel();
    }
    closeConfirmationModal();
  };

  if (!showConfirmationModal) return null;

  return (
    <BaseModal
      isOpen={showConfirmationModal}
      title={confirmationModalData.title}
      onClose={handleCancel}
      maxWidth="500px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={handleCancel}>
            {confirmationModalData.cancelText}
          </Button>
          <Button 
            variant={confirmationModalData.confirmVariant} 
            onClick={handleConfirm}
          >
            {confirmationModalData.confirmText}
          </Button>
        </div>
      )}
    >
      <div style={{ padding: '20px 0' }}>
        <div 
          dangerouslySetInnerHTML={{ __html: confirmationModalData.message }}
          style={{ 
            marginBottom: 16,
            lineHeight: '1.5',
            color: 'hsl(var(--text-primary))'
          }}
        />
      </div>
    </BaseModal>
  );
};

export default ConfirmationModal; 