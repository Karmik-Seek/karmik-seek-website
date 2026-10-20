'use client';

import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          return (
            <div
              key={t.id}
              role="alert"
              className="glass-strong flex items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm font-medium shadow-lift pointer-events-auto transition-all"
              style={{
                background: isSuccess ? 'rgb(243 250 245 / 0.95)' : 'rgb(254 242 245 / 0.95)',
                border: isSuccess ? '1px solid rgba(62, 123, 91, 0.35)' : '1px solid rgba(122, 47, 94, 0.35)',
                color: isSuccess ? 'var(--color-sage-600)' : 'var(--color-wine-700)',
              }}
            >
              {isSuccess ? (
                <CheckCircle2 size={18} className="shrink-0" style={{ color: 'var(--color-sage-600)' }} />
              ) : (
                <AlertCircle size={18} className="shrink-0" style={{ color: 'var(--color-wine-700)' }} />
              )}
              <span className="flex-1" style={{ color: 'var(--color-ink)' }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
