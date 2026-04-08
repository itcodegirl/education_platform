import { useTheme } from '../../providers';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      title="Toggle theme"
      aria-label={`Switch to ${nextTheme} theme`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
