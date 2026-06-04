'use client';

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3.5 glass-strong rounded-2xl shadow-glass-lg transition-all duration-300 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'}`}>
      {type === 'success' ? (
        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors ml-1">
        <X className="w-3.5 h-3.5 text-gray-400 dark:text-gray-300" />
      </button>
    </div>
  );
}

// Toast context
interface ToastItem { id: string; message: string; type: 'success' | 'error'; }
interface ToastContextType { showToast: (message: string, type?: 'success' | 'error') => void; }
const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </ToastContext.Provider>
  );
}
