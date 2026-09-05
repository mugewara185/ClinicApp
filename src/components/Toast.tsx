/**
 * Toast Notification System
 * Lightweight, accessible toast component with auto-dismiss.
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { ToastType } from '../shared/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ---------------------------------------------------------------------------
// Individual Toast
// ---------------------------------------------------------------------------
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error:   <AlertCircle  className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info:    <Info          className="w-5 h-5 text-blue-500" />,
};

const COLORS: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50',
  error:   'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info:    'border-blue-200 bg-blue-50',
};

const SingleToast = ({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) => (
  <div
    role="alert"
    aria-live="polite"
    className={clsx(
      'flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full',
      'animate-in slide-in-from-right-4 fade-in duration-300',
      COLORS[toast.type]
    )}
  >
    <span className="mt-0.5 shrink-0">{ICONS[toast.type]}</span>
    <p className="flex-1 text-sm text-slate-700 leading-snug">{toast.message}</p>
    <button
      onClick={() => onDismiss(toast.id)}
      aria-label="Dismiss"
      className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = { id, type, message, duration };
      setToasts(prev => [...prev.slice(-4), item]); // max 5 visible

      if (duration > 0) {
        const timer = setTimeout(() => hideToast(id), duration);
        timers.current.set(id, timer);
      }
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <SingleToast toast={toast} onDismiss={hideToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
