'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icon =
    type === 'success' ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-500" />
    );

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-card shadow-lg transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      }`}
    >
      {icon}
      <p className="text-sm font-medium text-gray-800">{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}

// ============================================================
// Toast Context for global toast management
// ============================================================

import { createContext, useContext, useCallback } from 'react';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}
