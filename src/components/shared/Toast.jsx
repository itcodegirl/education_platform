// ═══════════════════════════════════════════════
// TOAST — Lightweight notification system
// Usage: const toast = useToast();
//        toast.show('Copied to clipboard!');
// ═══════════════════════════════════════════════

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
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

  const show = useCallback((text, duration = 2500) => {
    clearToastTimers();
    setMessage(text);
    setVisible(true);
    hideTimerRef.current = setTimeout(() => setVisible(false), duration);
    clearTimerRef.current = setTimeout(() => {
      setMessage(null);
      hideTimerRef.current = null;
      clearTimerRef.current = null;
    }, duration + 300);
  }, [clearToastTimers]);

  useEffect(() => clearToastTimers, [clearToastTimers]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div
          className={`toast ${visible ? 'toast-in' : 'toast-out'}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
