import React, { useCallback } from 'react';
import './SplashScreen.css';

function SplashScreen({ fadingOut, onFadeOutEnd }) {
  const handleTransitionEnd = useCallback(
    (event) => {
      if (event.target !== event.currentTarget || event.propertyName !== 'opacity') return;
      if (fadingOut) onFadeOutEnd?.();
    },
    [fadingOut, onFadeOutEnd]
  );

  return (
    <div
      className={`splash-screen${fadingOut ? ' fade-out' : ''}`}
      onTransitionEnd={handleTransitionEnd}
      aria-hidden={fadingOut || undefined}
    >
      <div className="splash-glass-bg" />
      <div className="splash-content">
        <div className="exotic-spinner">
          <div className="spinner-drop spinner-drop1" />
          <div className="spinner-drop spinner-drop2" />
          <div className="spinner-drop spinner-drop3" />
          <div className="spinner-drop spinner-drop4" />
        </div>
        <h1 className="splash-title">Wee Desktop Launcher</h1>
      </div>
    </div>
  );
}

export default SplashScreen;
