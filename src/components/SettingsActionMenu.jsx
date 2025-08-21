import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import WToggle from '../ui/WToggle';
import Button from '../ui/WButton';
import './SettingsActionMenu.css';

const SettingsActionMenu = forwardRef(({ isOpen, onClose, position = { x: 0, y: 0 } }, ref) => {
  const { ui, actions } = useConsolidatedAppStore();
  const { isDarkMode, useCustomCursor, cursorStyle, showDock, classicMode } = ui;
  
  // Debug: Log current state values
  console.log('[SettingsActionMenu] Current state:', { isDarkMode, useCustomCursor, showDock });
  
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle custom cursor application
  useEffect(() => {
    if (useCustomCursor) {
      // Add class to body to enable global cursor hiding
      document.body.classList.add('custom-cursor-enabled');
      
      // Create custom cursor element if it doesn't exist
      let customCursor = document.getElementById('wii-custom-cursor');
      if (!customCursor) {
        customCursor = document.createElement('div');
        customCursor.id = 'wii-custom-cursor';
        document.body.appendChild(customCursor);
      }
      
      // Set cursor style
      console.log('[SettingsActionMenu] Setting cursor style to:', cursorStyle);
      customCursor.setAttribute('data-style', cursorStyle);
      
      // Show custom cursor
      customCursor.style.display = 'block';
      
      // Simple mouse tracking for better performance
      const handleMouseMove = (e) => {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
      };
      
      // Simple click effects
      const handleMouseDown = () => {
        customCursor.classList.add('clicking');
      };
      
      const handleMouseUp = () => {
        customCursor.classList.remove('clicking');
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Cleanup function
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        customCursor.classList.remove('clicking');
      };
    } else {
      // Remove class from body to restore default cursors
      document.body.classList.remove('custom-cursor-enabled');
      
      // Hide custom cursor
      const customCursor = document.getElementById('wii-custom-cursor');
      if (customCursor) {
        customCursor.style.display = 'none';
        customCursor.classList.remove('clicking');
      }
    }
  }, [useCustomCursor, cursorStyle]);

  // Handle visibility with animation (same as WBaseModal)
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
    }
    // Note: We don't handle closing here anymore - that's done by handleClose
  }, [isOpen]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsAnimating(false);
    // Wait for close animation to complete before hiding the component and calling onClose
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  }, [onClose]);

  // Toggle functions
  const toggleDarkMode = useCallback(() => {
    console.log('[SettingsActionMenu] Toggling dark mode from:', isDarkMode, 'to:', !isDarkMode);
    actions.setUIState({ isDarkMode: !isDarkMode });
  }, [isDarkMode, actions]);

  const toggleDock = useCallback(() => {
    console.log('[SettingsActionMenu] Toggling dock from:', showDock, 'to:', !showDock);
    actions.setUIState({ showDock: !showDock });
  }, [showDock, actions]);

  const toggleCustomCursor = useCallback(() => {
    console.log('[SettingsActionMenu] Toggling custom cursor from:', useCustomCursor, 'to:', !useCustomCursor);
    actions.setUIState({ useCustomCursor: !useCustomCursor });
  }, [useCustomCursor, actions]);

  const toggleDockMode = useCallback(() => {
    console.log('[SettingsActionMenu] Toggling dock mode from:', classicMode, 'to:', !classicMode);
    actions.setUIState({ classicMode: !classicMode });
  }, [classicMode, actions]);

  const toggleFullscreen = useCallback(() => {
    if (window.api?.toggleFullscreen) {
      window.api.toggleFullscreen();
    }
  }, []);

  const toggleFrame = useCallback(() => {
    if (window.api?.toggleFrame) {
      window.api.toggleFrame();
    }
  }, []);

  const openSettingsModal = useCallback(() => {
    actions.setUIState({ showSettingsModal: true });
    handleClose();
  }, [actions, handleClose]);

  const openDevTools = useCallback(() => {
    if (window.api?.openDevTools) {
      window.api.openDevTools();
    }
    handleClose();
  }, [handleClose]);

  const openUpdatesTab = useCallback(() => {
    actions.setUIState({ showSettingsModal: true, settingsActiveTab: 'updates' });
    handleClose();
  }, [actions, handleClose]);

  const openSoundModal = useCallback(() => {
    actions.setUIState({ showSettingsModal: true, settingsActiveTab: 'sounds' });
    handleClose();
  }, [actions, handleClose]);

  const closeApp = useCallback(() => {
    if (window.api?.closeApp) {
      window.api.closeApp();
    } else {
      // Fallback: try to close the window
      window.close();
    }
    handleClose();
  }, [handleClose]);

  // Expose handleClose method to parent via ref
  useImperativeHandle(ref, () => ({
    handleClose
  }), [handleClose]);

  if (!isVisible) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={handleClose}>
        {/* Backdrop - synchronized with modal animation */}
        <div 
          className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 z-[9999] ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        {/* Menu Container */}
        <div className="fixed inset-0 overflow-y-auto z-[10000]">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel 
              className={`settings-action-menu w-[95%] max-h-[95vh] min-w-[400px] bg-[hsl(var(--surface-primary))] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden flex flex-col lg:w-[90%] lg:min-w-[350px] md:w-[95%] md:min-w-[300px] sm:w-[98%] sm:min-w-[280px] relative z-[10000]`}
              style={{
                maxHeight: '70vh',
                animation: isAnimating 
                  ? 'settingsMenuSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                  : 'settingsMenuSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="menu-content">
                <div className="menu-header">
                  <Dialog.Title as="h3" className="m-0 text-xl font-semibold text-[hsl(var(--text-primary))]">
                    Quick Settings
                  </Dialog.Title>
                  <button 
                    className="close-button"
                    onClick={handleClose}
                    title="Close menu"
                  >
                    ✕
                  </button>
                </div>

                <div className="menu-sections-container">
                  <div className="menu-section">
                    <h4>Quick Actions</h4>
                    <div className="toggle-item">
                      <WToggle
                        checked={classicMode}
                        onChange={toggleDockMode}
                        label="Classic Dock Mode"
                      />
                    </div>
                    <div className="toggle-item">
                      <WToggle
                        checked={isDarkMode}
                        onChange={toggleDarkMode}
                        label="Dark Mode"
                      />
                      {isDarkMode && (
                        <div className="ml-2 text-xs text-[hsl(var(--text-secondary))]">
                          🌙 Active
                        </div>
                      )}
                    </div>
                    <div className="toggle-item">
                      <WToggle
                        checked={useCustomCursor}
                        onChange={toggleCustomCursor}
                        label="Custom Cursor"
                      />
                    </div>
                    <div className="toggle-item">
                      <WToggle
                        checked={showDock}
                        onChange={toggleDock}
                        label="Show Dock"
                      />
                    </div>
                  </div>

                  <div className="menu-section">
                    <h4>Window Controls</h4>
                    <div className="toggle-item">
                      <Button
                        variant="secondary"
                        onClick={toggleFrame}
                        className="action-button"
                      >
                        Toggle Frame
                      </Button>
                    </div>
                    <div className="toggle-item">
                      <Button
                        variant="secondary"
                        onClick={toggleFullscreen}
                        className="action-button"
                      >
                        Toggle Fullscreen
                      </Button>
                    </div>
                  </div>

                  <div className="menu-section">
                    <h4>Advanced</h4>
                    <div className="toggle-item">
                      <Button
                        variant="secondary"
                        onClick={openSettingsModal}
                        className="action-button"
                      >
                        Open Settings
                      </Button>
                    </div>
                    <div className="toggle-item">
                      <Button
                        variant="secondary"
                        onClick={openSoundModal}
                        className="action-button"
                      >
                        Manage Sounds
                      </Button>
                    </div>
                    <div className="toggle-item">
                      <Button
                        variant="secondary"
                        onClick={openUpdatesTab}
                        className="action-button"
                      >
                        Check for Updates
                      </Button>
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="toggle-item">
                        <Button
                          variant="secondary"
                          onClick={openDevTools}
                          className="action-button"
                        >
                          Developer Tools
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="menu-section">
                    <h4>App</h4>
                    <div className="toggle-item">
                      <Button
                        variant="danger-primary"
                        onClick={closeApp}
                        className="action-button"
                      >
                        Close App
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});

SettingsActionMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
};

export default SettingsActionMenu;
