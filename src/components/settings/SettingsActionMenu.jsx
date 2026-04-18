import React, { useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import {
  Code2,
  Layers,
  Maximize,
  Monitor,
  Moon,
  Mouse,
  Music,
  RefreshCw,
  Settings,
  Square,
  X,
} from 'lucide-react';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import WToggle from '../../ui/WToggle';
import WeeButton from '../../ui/wee/WeeButton';
import { useWeeMotion } from '../../design/weeMotion';
import './SettingsActionMenu.css';

function QuickToggleRow({ label, icon: Icon, active, onToggle }) {
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-[var(--wee-radius-rail-item)] border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] p-4 text-left transition-colors hover:border-[hsl(var(--primary)/0.35)] hover:bg-[hsl(var(--state-hover)/0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))]"
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {Icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--wee-surface-well))] text-[hsl(var(--wee-text-rail-muted))]">
            <Icon size={20} strokeWidth={2.2} aria-hidden />
          </span>
        ) : null}
        <span className="text-[11px] font-black uppercase italic tracking-wide text-[hsl(var(--wee-text-header))]">
          {label}
        </span>
      </span>
      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <WToggle checked={active} onChange={onToggle} disableLabelClick />
      </span>
    </div>
  );
}

QuickToggleRow.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  active: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

function ActionButtonRow({ label, icon: Icon, onClick }) {
  return (
    <WeeButton
      type="button"
      variant="secondary"
      className="w-full justify-start gap-3 !normal-case !tracking-normal"
      onClick={onClick}
    >
      {Icon ? <Icon size={18} strokeWidth={2.2} className="shrink-0 text-[hsl(var(--text-secondary))]" aria-hidden /> : null}
      <span className="text-sm font-semibold">{label}</span>
    </WeeButton>
  );
}

ActionButtonRow.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  onClick: PropTypes.func.isRequired,
};

const SettingsActionMenu = forwardRef(({ isOpen, onClose }, ref) => {
  const { isDarkMode, useCustomCursor, cursorStyle, showDock, classicMode } = useConsolidatedAppStore(
    useShallow((state) => ({
      isDarkMode: state.ui.isDarkMode,
      useCustomCursor: state.ui.useCustomCursor,
      cursorStyle: state.ui.cursorStyle,
      showDock: state.ui.showDock,
      classicMode: state.ui.classicMode,
    }))
  );
  const setUIState = useConsolidatedAppStore((state) => state.actions.setUIState);
  const { backdropTransition, modalTransition } = useWeeMotion();

  useEffect(() => {
    if (useCustomCursor) {
      document.body.classList.add('custom-cursor-enabled');

      let customCursor = document.getElementById('wii-custom-cursor');
      if (!customCursor) {
        customCursor = document.createElement('div');
        customCursor.id = 'wii-custom-cursor';
        document.body.appendChild(customCursor);
      }

      customCursor.setAttribute('data-style', cursorStyle);
      customCursor.style.display = 'block';

      const handleMouseMove = (e) => {
        customCursor.style.left = `${e.clientX}px`;
        customCursor.style.top = `${e.clientY}px`;
      };

      const handleMouseDown = () => {
        customCursor.classList.add('clicking');
      };

      const handleMouseUp = () => {
        customCursor.classList.remove('clicking');
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        customCursor.classList.remove('clicking');
      };
    }

    document.body.classList.remove('custom-cursor-enabled');
    const customCursor = document.getElementById('wii-custom-cursor');
    if (customCursor) {
      customCursor.style.display = 'none';
      customCursor.classList.remove('clicking');
    }
    return undefined;
  }, [useCustomCursor, cursorStyle]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const toggleDarkMode = useCallback(() => {
    setUIState({ isDarkMode: !isDarkMode });
  }, [isDarkMode, setUIState]);

  const toggleDock = useCallback(() => {
    setUIState({ showDock: !showDock });
  }, [showDock, setUIState]);

  const toggleCustomCursor = useCallback(() => {
    setUIState({ useCustomCursor: !useCustomCursor });
  }, [useCustomCursor, setUIState]);

  const toggleDockMode = useCallback(() => {
    setUIState({ classicMode: !classicMode });
  }, [classicMode, setUIState]);

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
    setUIState({ showSettingsModal: true });
    handleClose();
  }, [setUIState, handleClose]);

  const openDevTools = useCallback(() => {
    if (window.api?.openDevTools) {
      window.api.openDevTools();
    }
    handleClose();
  }, [handleClose]);

  const openUpdatesTab = useCallback(() => {
    setUIState({ showSettingsModal: true, settingsActiveTab: 'updates' });
    handleClose();
  }, [setUIState, handleClose]);

  const openSoundModal = useCallback(() => {
    setUIState({ showSettingsModal: true, settingsActiveTab: 'sounds' });
    handleClose();
  }, [setUIState, handleClose]);

  const closeApp = useCallback(() => {
    if (window.api?.closeApp) {
      window.api.closeApp();
    } else {
      window.close();
    }
    handleClose();
  }, [handleClose]);

  useImperativeHandle(
    ref,
    () => ({
      handleClose,
    }),
    [handleClose]
  );

  if (typeof document === 'undefined') {
    return null;
  }

  const tree = (
    <AnimatePresence>
      {isOpen ? (
        <>
          <m.button
            type="button"
            key="quick-menu-backdrop"
            aria-label="Close quick menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            className="fixed inset-0 z-[100000] cursor-default border-0 bg-[hsl(var(--wee-overlay-backdrop))] backdrop-blur-[8px]"
            onClick={handleClose}
          />
          <m.div
            key="quick-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wee-quick-menu-title"
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={modalTransition}
            className="fixed bottom-6 right-6 top-6 z-[100001] flex w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-[var(--wee-radius-shell)] border-[0.5rem] border-[hsl(var(--wee-border-outer))] bg-[hsl(var(--wee-surface-well))] shadow-[var(--wee-shadow-modal)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-[hsl(var(--border-primary)/0.25)] bg-[hsl(var(--wee-surface-shell))] px-8 pb-6 pt-10 md:px-10">
              <div className="min-w-0">
                <p className="m-0 text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--wee-text-rail-muted))]">
                  System control
                </p>
                <h2
                  id="wee-quick-menu-title"
                  className="m-0 mt-1 text-2xl font-black uppercase italic tracking-tighter text-[hsl(var(--wee-text-header))] md:text-3xl"
                >
                  Quick menu
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 rounded-full p-3 text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--state-hover))] hover:text-[hsl(var(--text-primary))]"
                aria-label="Close quick menu"
              >
                <X size={24} strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="wee-modal-scroll min-h-0 flex-1 space-y-10 overflow-y-auto px-8 py-8 md:px-10">
              <section className="space-y-4">
                <p className="ml-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--wee-text-rail-muted))]">
                  Quick toggles
                </p>
                <div className="flex flex-col gap-3">
                  <QuickToggleRow
                    label="Classic dock"
                    icon={Monitor}
                    active={classicMode}
                    onToggle={toggleDockMode}
                  />
                  <QuickToggleRow label="Dark mode" icon={Moon} active={isDarkMode} onToggle={toggleDarkMode} />
                  <QuickToggleRow
                    label="Custom cursor"
                    icon={Mouse}
                    active={useCustomCursor}
                    onToggle={toggleCustomCursor}
                  />
                  <QuickToggleRow label="Show dock" icon={Layers} active={showDock} onToggle={toggleDock} />
                </div>
              </section>

              <section className="space-y-4">
                <p className="ml-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--wee-text-rail-muted))]">
                  Window controls
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <ActionButtonRow label="Toggle frame" icon={Square} onClick={toggleFrame} />
                  <ActionButtonRow label="Toggle fullscreen" icon={Maximize} onClick={toggleFullscreen} />
                </div>
              </section>

              <section className="space-y-4">
                <p className="ml-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--wee-text-rail-muted))]">
                  Advanced
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <ActionButtonRow label="Open settings" icon={Settings} onClick={openSettingsModal} />
                  <ActionButtonRow label="Manage sounds" icon={Music} onClick={openSoundModal} />
                  <ActionButtonRow label="Check for updates" icon={RefreshCw} onClick={openUpdatesTab} />
                </div>
              </section>

              {process.env.NODE_ENV === 'development' ? (
                <section className="space-y-4">
                  <p className="ml-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--wee-text-rail-muted))]">
                    Developer
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <ActionButtonRow label="Developer tools" icon={Code2} onClick={openDevTools} />
                  </div>
                </section>
              ) : null}

              <section className="space-y-4">
                <p className="ml-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--wee-text-rail-muted))]">
                  App
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <WeeButton type="button" variant="danger" className="w-full" onClick={closeApp}>
                    Close app
                  </WeeButton>
                </div>
              </section>
            </div>

            <div className="shrink-0 border-t-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-input))] px-8 py-5 md:px-10">
              <div className="flex justify-center">
                <WeeButton type="button" variant="primary" onClick={handleClose}>
                  Finish
                </WeeButton>
              </div>
            </div>
          </m.div>
        </>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(tree, document.body);
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
