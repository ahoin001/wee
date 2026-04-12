import { useEffect } from 'react';

export const useCursorEffect = (useCustomCursor, cursorStyle) => {
  useEffect(() => {
    if (useCustomCursor) {
      document.body.classList.add('custom-cursor-enabled');

      let customCursor = document.getElementById('wii-custom-cursor');
      if (!customCursor) {
        customCursor = document.createElement('div');
        customCursor.id = 'wii-custom-cursor';
        document.body.appendChild(customCursor);
      }

      customCursor.setAttribute('data-style', cursorStyle || 'classic');
      customCursor.style.display = 'block';

      const handleMouseMove = (e) => {
        customCursor.style.left = `${e.clientX}px`;
        customCursor.style.top = `${e.clientY}px`;
      };

      const handleMouseDown = () => customCursor.classList.add('clicking');
      const handleMouseUp = () => customCursor.classList.remove('clicking');

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
  }, [useCustomCursor, cursorStyle]);
};

export const useThemeEffect = (isDarkMode) => {
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
      return;
    }

    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
    document.documentElement.setAttribute('data-theme', 'light');
  }, [isDarkMode]);
};

export const useBackgroundMusicEffects = ({
  appReady,
  soundSettings,
  startBackgroundMusic,
  stopBackgroundMusic,
  updateBackgroundMusic,
}) => {
  useEffect(() => {
    if (appReady && soundSettings?.backgroundMusicEnabled) {
      startBackgroundMusic();
    }
  }, [appReady, soundSettings?.backgroundMusicEnabled, startBackgroundMusic]);

  useEffect(() => {
    if (appReady && soundSettings?.backgroundMusicEnabled) {
      updateBackgroundMusic();
    }
  }, [appReady, soundSettings, updateBackgroundMusic]);

  useEffect(() => {
    if (!appReady) {
      return;
    }

    if (soundSettings?.backgroundMusicEnabled) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [appReady, soundSettings?.backgroundMusicEnabled, startBackgroundMusic, stopBackgroundMusic]);

  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, [stopBackgroundMusic]);
};

export const useFullscreenEffect = ({ appReady, startInFullscreen }) => {
  useEffect(() => {
    if (appReady && window.api?.setFullscreen) {
      window.api.setFullscreen(startInFullscreen);
    }
  }, [appReady, startInFullscreen]);
};

export const useGlobalKeyHandlers = ({
  showSettingsActionMenu,
  settingsActionMenuRef,
  closeSettingsActionMenu,
  handleSettingsActionMenuOpen,
  openDevTools,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F12' || event.keyCode === 123) {
        event.preventDefault();
        openDevTools();
      } else if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        openDevTools();
      } else if (event.ctrlKey && event.shiftKey && event.key === 'J') {
        event.preventDefault();
        openDevTools();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (showSettingsActionMenu) {
        if (settingsActionMenuRef.current?.handleClose) {
          settingsActionMenuRef.current.handleClose();
        } else {
          closeSettingsActionMenu();
        }
        return;
      }

      handleSettingsActionMenuOpen();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [
    showSettingsActionMenu,
    settingsActionMenuRef,
    closeSettingsActionMenu,
    handleSettingsActionMenuOpen,
    openDevTools,
  ]);
};
