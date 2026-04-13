import React, { useState, useEffect } from 'react';
import {
  CSS_COLOR_PURE_WHITE_90,
  CSS_WII_BLUE,
} from '../design/runtimeColorStrings.js';

function CountdownOverlay({ isVisible, onComplete }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (!isVisible) {
      setCount(3);
      return;
    }

    const interval = setInterval(() => {
      setCount(prevCount => {
        if (prevCount <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'hsl(var(--color-pure-black) / 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div style={{
        background: CSS_COLOR_PURE_WHITE_90,
        borderRadius: '20px',
        padding: '40px 60px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-modal)',
        border: `3px solid ${CSS_WII_BLUE}`,
        animation: count === 3 ? 'pulse 0.5s ease-in-out' : 'none'
      }}>
        <div style={{
          fontSize: '120px',
          fontWeight: 'bold',
          color: CSS_WII_BLUE,
          marginBottom: '20px',
          fontFamily: 'Arial, sans-serif',
          textShadow: '0 4px 8px hsl(var(--wii-blue) / 0.3)'
        }}>
          {count}
        </div>
        <div style={{
          fontSize: '24px',
          color: 'hsl(var(--text-primary))',
          fontWeight: '500'
        }}>
          Taking screenshot...
        </div>
      </div>
    </div>
  );
}

export default CountdownOverlay; 