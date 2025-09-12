import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

const fallbackToast: ToastContextValue = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {}
};

const ToastContext = createContext<ToastContextValue>(fallbackToast);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2);
    const toast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const getToastStyles = (type: Toast['type']) => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: 12,
      color: '#fff',
      fontWeight: 600,
      fontSize: 14,
      minWidth: 250,
      maxWidth: 400,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: 'translateX(0)',
      opacity: 1,
      animation: 'slideIn 0.3s ease'
    };

    const backgrounds = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
      info: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
    };

    return { ...baseStyle, background: backgrounds[type] };
  };

  return (
    <div
      style={getToastStyles(toast.type)}
      onClick={() => onRemove(toast.id)}
    >
      {toast.message}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}