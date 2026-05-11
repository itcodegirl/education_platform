// ═══════════════════════════════════════════════
// TOAST — Lightweight notification system
// Usage: const toast = useToast();
//        toast.show('Copied to clipboard!');
// ═══════════════════════════════════════════════

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext({ show: () => {} });
const DEFAULT_TOAST_DURATION_MS = 2500;

function normalizeToastOptions(options) {
  if (typeof options === 'number') {
    return { duration: options, tone: 'status' };
  }

  const tone = options?.tone || options?.variant || 'status';
  return {
    duration: options?.duration ?? DEFAULT_TOAST_DURATION_MS,
    tone: ['alert', 'assertive', 'danger', 'error'].includes(tone) ? 'error' : tone,
  };
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef(null);
  const clearTimerRef = useRef(null);

  const clearToastTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const show = useCallback((text, options = DEFAULT_TOAST_DURATION_MS) => {
    const { duration, tone } = normalizeToastOptions(options);
    clearToastTimers();
    setToast({ text, tone });
    setVisible(true);
    hideTimerRef.current = setTimeout(() => setVisible(false), duration);
    clearTimerRef.current = setTimeout(() => {
      setToast(null);
      hideTimerRef.current = null;
      clearTimerRef.current = null;
    }, duration + 300);
  }, [clearToastTimers]);

  useEffect(() => clearToastTimers, [clearToastTimers]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          className={`toast toast-${toast.tone} ${visible ? 'toast-in' : 'toast-out'}`}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          {toast.text}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
