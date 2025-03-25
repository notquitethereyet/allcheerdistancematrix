import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ToastContainer, { ToastData } from '../components/ToastContainer';
import { ToastType } from '../components/Toast';
import ReactDOM from 'react-dom';

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
}

// Create context with default values
const ToastContext = createContext<ToastContextType>({
  addToast: () => '',
  removeToast: () => {},
  removeAllToasts: () => {},
});

// Hook to use the toast context
export const useToast = () => useContext(ToastContext);

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Create a portal container for the toast notifications
  useEffect(() => {
    // Check if a toast portal already exists
    let container = document.getElementById('toast-portal-container');
    
    // If not, create one
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-portal-container';
      document.body.appendChild(container);
    }
    
    setPortalContainer(container);
    
    // Clean up on unmount
    return () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  const addToast = (message: string, type: ToastType = 'info', duration = 5000): string => {
    const id = uuidv4();
    
    setToasts((prevToasts) => {
      // Limit the number of toasts
      const updatedToasts = [...prevToasts, { id, type, message, duration }];
      return updatedToasts.slice(-maxToasts);
    });
    
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
        removeAllToasts,
      }}
    >
      {children}
      {portalContainer && ReactDOM.createPortal(
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />,
        portalContainer
      )}
    </ToastContext.Provider>
  );
};