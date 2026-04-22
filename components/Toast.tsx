'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

function SingleToast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const isSuccess = item.type === 'success';
  const accent = isSuccess ? '#10b981' : '#ef4444';

  return (
    <div
      className="toast-enter pointer-events-auto flex w-full items-start gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-xl"
      style={{
        borderTop: '1px solid #e2e8f0',
        borderRight: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        borderLeft: `4px solid ${accent}`,
      }}
      role="alert"
    >
      {/* Icon */}
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ background: isSuccess ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}
      >
        {isSuccess ? (
          <svg className="h-3.5 w-3.5" fill="none" stroke={accent} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" stroke={accent} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Label + message */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: accent }}>
          {isSuccess ? 'Success' : 'Error'}
        </p>
        <p className="text-sm text-slate-700 leading-snug">{item.message}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(item.id)}
        className="mt-0.5 shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (msg) => addToast('success', msg),
      error: (msg) => addToast('error', msg),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Portal — fixed top-right, above everything including modals */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none w-full max-w-sm"
      >
        {toasts.map((t) => (
          <SingleToast key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
