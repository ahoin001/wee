import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: 'hsl(var(--text-secondary))',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        border: '2px solid hsl(var(--border-primary))',
        borderTop: '2px solid hsl(var(--primary))',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '12px'
      }} />
      <div>{message}</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner; 