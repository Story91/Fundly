import React, { useEffect } from 'react';

const Toast = ({ id, message, type = 'info', onRemove, autoRemove = true }) => {
  useEffect(() => {
    if (autoRemove) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, 5000); // Auto remove after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [id, onRemove, autoRemove]);

  const getToastStyles = () => {
    const baseStyles = {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '400px',
      position: 'relative',
      overflow: 'hidden',
      animation: 'slideIn 0.3s ease-out',
      cursor: 'pointer'
    };

    // Type-specific colors
    let typeStyles = {};
    
    if (type === 'success' || message.includes('✅') || message.includes('🎉')) {
      typeStyles = {
        borderLeft: '4px solid #10b981',
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#059669'
      };
    } else if (type === 'error' || message.includes('❌')) {
      typeStyles = {
        borderLeft: '4px solid #ef4444',
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#dc2626'
      };
    } else if (type === 'info' || message.includes('🔍') || message.includes('💰') || message.includes('🎯')) {
      typeStyles = {
        borderLeft: '4px solid #3b82f6',
        background: 'rgba(59, 130, 246, 0.1)',
        color: '#2563eb'
      };
    } else if (message.includes('🔐')) {
      typeStyles = {
        borderLeft: '4px solid #f59e0b',
        background: 'rgba(245, 158, 11, 0.1)',
        color: '#d97706'
      };
    }

    return { ...baseStyles, ...typeStyles };
  };

  return (
    <div 
      style={getToastStyles()}
      onClick={() => onRemove(id)}
    >
      <div style={{ flex: 1 }}>
        {message}
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          opacity: 0.6,
          padding: '0',
          marginLeft: '8px'
        }}
      >
        ×
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onRemove={removeToast}
              autoRemove={toast.autoRemove}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default ToastContainer;