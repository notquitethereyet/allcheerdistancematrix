import React from 'react';
import Toast, { ToastType } from './Toast';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast,
}) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        width: '320px',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;