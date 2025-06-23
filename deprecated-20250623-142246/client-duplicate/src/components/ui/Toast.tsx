import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  };

  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };

  return (
    <div
      className={cn(
        'transform transition-all duration-300 ease-out',
        isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      )}
    >
      <div
        className={cn(
          'flex items-start p-4 rounded-lg shadow-lg border',
          'min-w-[320px] max-w-md',
          backgrounds[toast.type]
        )}
      >
        <div className="flex-shrink-0">{icons[toast.type]}</div>
        <div className="ml-3 flex-1">
          <p className={cn('text-sm font-medium', textColors[toast.type])}>
            {toast.title}
          </p>
          {toast.message && (
            <p className={cn('mt-1 text-sm', textColors[toast.type], 'opacity-90')}>
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={cn(
                'mt-2 text-sm font-medium underline',
                textColors[toast.type],
                'hover:opacity-80 transition-opacity'
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className={cn(
            'ml-4 flex-shrink-0 rounded-md p-1.5',
            'hover:bg-white hover:bg-opacity-50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            toast.type === 'success' && 'focus:ring-green-500',
            toast.type === 'error' && 'focus:ring-red-500',
            toast.type === 'warning' && 'focus:ring-yellow-500',
            toast.type === 'info' && 'focus:ring-blue-500'
          )}
        >
          <X className={cn('h-4 w-4', textColors[toast.type])} />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>,
    document.body
  );
};

// Toast hook
let toastId = 0;
const toastListeners: ((toasts: Toast[]) => void)[] = [];
let currentToasts: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...currentToasts]));
};

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = `toast-${++toastId}`;
  const newToast = { ...toast, id };
  currentToasts = [...currentToasts, newToast];
  notifyListeners();
  return id;
};

const removeToast = (id: string) => {
  currentToasts = currentToasts.filter((toast) => toast.id !== id);
  notifyListeners();
};

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) toastListeners.splice(index, 1);
    };
  }, []);

  const toast = {
    success: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'success', title, duration: 5000, ...options }),
    error: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'error', title, duration: 7000, ...options }),
    warning: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'warning', title, duration: 6000, ...options }),
    info: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'info', title, duration: 5000, ...options }),
    remove: removeToast,
  };

  return { toasts, toast };
};

// Global toast methods for use outside React components
export const toast = {
  success: (title: string, options?: Partial<Toast>) =>
    addToast({ type: 'success', title, duration: 5000, ...options }),
  error: (title: string, options?: Partial<Toast>) =>
    addToast({ type: 'error', title, duration: 7000, ...options }),
  warning: (title: string, options?: Partial<Toast>) =>
    addToast({ type: 'warning', title, duration: 6000, ...options }),
  info: (title: string, options?: Partial<Toast>) =>
    addToast({ type: 'info', title, duration: 5000, ...options }),
  remove: removeToast,
};