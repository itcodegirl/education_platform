// ═══════════════════════════════════════════════
// TOAST — Lightweight notification system
// Usage: const toast = useToast();
//        toast.show('Copied to clipboard!');
// ═══════════════════════════════════════════════

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((text, duration = 2500) => {
    setMessage(text);
    setVisible(true);
    setTimeout(() => setVisible(false), duration);
    setTimeout(() => setMessage(null), duration + 300);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div className={`toast ${visible ? 'toast-in' : 'toast-out'}`} role="status" aria-live="polite">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
