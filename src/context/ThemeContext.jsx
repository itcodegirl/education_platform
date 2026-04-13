// ═══════════════════════════════════════════════
// THEME CONTEXT — Dark/Light mode
// ═══════════════════════════════════════════════

import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeContext = createContext({ theme: 'dark', toggle: () => {} });

function detectInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  } catch {
    /* ignore */
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('chw-theme', detectInitialTheme());

  const toggle = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    [setTheme],
  );

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
