import { Logo } from '../components/shared/Logo';

export function PublicLayout({ children, showBrand = true }) {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#public-main">Skip to main content</a>

      {showBrand && (
        <header className="public-shell-header" aria-label="Public shell">
          <div className="public-shell-inner">
            <Logo size="sm" />
          </div>
        </header>
      )}

      <main id="public-main" className="public-shell-main">
        {children}
      </main>
    </div>
  );
}
