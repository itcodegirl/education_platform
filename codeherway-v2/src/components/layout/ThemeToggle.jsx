// ═══════════════════════════════════════════════
// THEME TOGGLE — Floating dark/light switch
// ═══════════════════════════════════════════════

import { useTheme } from '../../providers';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle theme">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
