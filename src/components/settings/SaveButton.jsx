import React, { useState } from 'react';
import WButton from '../../ui/WButton';

const SaveButton = ({ 
  onSave, 
  variant = "primary", 
  size = "lg", 
  className = "",
  children = "Save Settings"
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus({ type: '', message: '' });
      
      await onSave();
      
      setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ type: '', message: '' });
      }, 3000);
      
    } catch (error) {
      setSaveStatus({ type: 'error', message: `Failed to save settings: ${error.message}` });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveStatus({ type: '', message: '' });
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Save Status Message */}
      {saveStatus.message && (
        <div className={`p-3 rounded-md text-center mb-4 ${
          saveStatus.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {saveStatus.message}
        </div>
      )}

      {/* Save Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <WButton
          onClick={handleSave}
          variant={variant}
          size={size}
          className={className}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : children}
        </WButton>
      </div>
    </>
  );
};

export default SaveButton;
