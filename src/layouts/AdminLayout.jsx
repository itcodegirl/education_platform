export function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">Skip to main content</a>
      <main id="admin-main" className="admin-shell-main">
        {children}
      </main>
    </div>
  );
}
