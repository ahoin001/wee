import React, { useState, useEffect } from 'react';

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
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px 60px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        border: '3px solid #0099ff',
        animation: count === 3 ? 'pulse 0.5s ease-in-out' : 'none'
      }}>
        <div style={{
          fontSize: '120px',
          fontWeight: 'bold',
          color: '#0099ff',
          marginBottom: '20px',
          fontFamily: 'Arial, sans-serif',
          textShadow: '0 4px 8px rgba(0, 153, 255, 0.3)'
        }}>
          {count}
        </div>
        <div style={{
          fontSize: '24px',
          color: '#333',
          fontWeight: '500'
        }}>
          Taking screenshot...
        </div>
      </div>
    </div>
  );
}

export default CountdownOverlay; 