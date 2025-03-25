import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration !== Infinity) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  // Define styles based on toast type
  let backgroundColor = '';
  let textColor = 'white';
  let icon = null;

  switch (type) {
    case 'success':
      backgroundColor = '#059669'; // green-600
      icon = (
        <svg className="h-5 w-5" style={{ color: 'white', height: '1.25rem', width: '1.25rem' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'error':
      backgroundColor = '#DC2626'; // red-600
      icon = (
        <svg className="h-5 w-5" style={{ color: 'white', height: '1.25rem', width: '1.25rem' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'warning':
      backgroundColor = '#F59E0B'; // yellow-500
      icon = (
        <svg className="h-5 w-5" style={{ color: 'white', height: '1.25rem', width: '1.25rem' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'info':
    default:
      backgroundColor = '#2563EB'; // blue-600
      icon = (
        <svg className="h-5 w-5" style={{ color: 'white', height: '1.25rem', width: '1.25rem' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
  }

  return (
    <div style={{ 
      pointerEvents: 'auto', 
      marginBottom: '0.75rem',
      width: '100%'
    }}>
      <div style={{ 
        backgroundColor: backgroundColor,
        color: textColor,
        borderRadius: '0.375rem', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(229, 231, 235, 0.5)'
      }}>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flexShrink: 0 }}>
              {icon}
            </div>
            <div style={{ marginLeft: '0.75rem', flex: 1 }}>
              <p style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: 'white',
                margin: 0
              }}>
                {message}
              </p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button
                onClick={() => onClose(id)}
                style={{ 
                  display: 'inline-flex', 
                  borderRadius: '0.375rem', 
                  padding: '0.375rem',
                  outline: 'none',
                  color: 'white',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: '0' }}>Dismiss</span>
                <svg style={{ height: '1.25rem', width: '1.25rem' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;