// ═══════════════════════════════════════════════
// AUTH LAYOUT — Auth page + guest preview option
// ═══════════════════════════════════════════════

import { lazy, Suspense, useState } from 'react';
import { AuthPage } from '../components/auth/AuthPage';

const GuestPreviewRoute = lazy(() =>
  import('../routes/GuestPreviewRoute').then((module) => ({ default: module.GuestPreviewRoute })),
);

export function AuthLayout() {
  const [showPreview, setShowPreview] = useState(false);

  if (showPreview) {
    return (
      <Suspense
        fallback={(
          <main className="auth-page" aria-busy="true">
            <div className="auth-card" role="status" aria-live="polite">
              <p>Opening lesson preview...</p>
            </div>
          </main>
        )}
      >
        <GuestPreviewRoute onBack={() => setShowPreview(false)} />
      </Suspense>
    );
  }

  return <AuthPage onPreview={() => setShowPreview(true)} />;
}
