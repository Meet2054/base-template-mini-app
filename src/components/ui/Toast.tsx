import React, { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300); // Match this with the animation duration in globals.css
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColorMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  const textColorMap = {
    success: 'text-white',
    error: 'text-white',
    info: 'text-white',
    warning: 'text-gray-900',
  };

  return (
    <div
      className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 
        ${bgColorMap[type]} ${textColorMap[type]}
        ${isExiting ? 'notification-slide-out' : 'notification-slide-in'}`}
      role="alert"
    >
      {message}
    </div>
  );
};

export default Toast;