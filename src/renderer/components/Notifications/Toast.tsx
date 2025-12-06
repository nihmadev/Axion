import React, { useEffect } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon, InfoIcon } from '../ZenSidebar/icons';
import '../../styles/components/toast.css';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 5000,
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircleIcon size={18} />;
      case 'warning': return <AlertTriangleIcon size={18} />;
      case 'error': return <XCircleIcon size={18} />;
      default: return <InfoIcon size={18} />;
    }
  };

  return (
    <div className={`toast toast--${type}`} onClick={onClose}>
      <span className="toast__icon">{getIcon()}</span>
      <span className="toast__message">{message}</span>
    </div>
  );
};
