import React, { createContext, useContext, useState } from 'react';
import Toast, { ToastProps } from '../ui/Toast';

interface ToastContextType {
  showToast: (props: Omit<ToastProps, 'onClose'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface Toast extends ToastProps {
  id: string;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (props: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...props, id }]);
  };

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-0 right-0 p-4 space-y-4 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => handleClose(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};