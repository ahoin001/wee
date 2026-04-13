import React from 'react';
import './SplashScreen.css';

function SplashScreen({ fadingOut }) {
  return (
    <div className={`splash-screen${fadingOut ? ' fade-out' : ''}`}>
      <div className="splash-glass-bg" />
      <div className="splash-content">
        <div className="exotic-spinner">
          <div className="spinner-drop spinner-drop1" />
          <div className="spinner-drop spinner-drop2" />
          <div className="spinner-drop spinner-drop3" />
          <div className="spinner-drop spinner-drop4" />
        </div>
        <h1 className="splash-title">Wii Desktop Launcher</h1>
        <div className="splash-subtitle">Loading your Wii experience...</div>
      </div>
    </div>
  );
}

export default SplashScreen; 