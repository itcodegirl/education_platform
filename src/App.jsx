// ═══════════════════════════════════════════════
// APP — Providers + Routes wrapped in a top-level
// ErrorBoundary.
//
// The router has its own RouteErrorBoundary for errors thrown
// inside a route, but anything that throws *outside* the router
// (a provider's first render or the InstallPrompt render) used to
// bring down the whole app to a blank
// page. Wrapping at this level guarantees a visible fallback
// screen with retry/reload, no matter where in the tree the
// crash originated.
// ═══════════════════════════════════════════════

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { InstallPrompt } from './components/shared/InstallPrompt';
import { PWAUpdatePrompt } from './components/shared/PWAUpdatePrompt';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { appRouter } from './routes/appRouter';
import './styles/public-app.css';

export default function App() {
  useEffect(() => {
    let cleanupWebVitals = () => {};
    let cancelled = false;

    void import('./lib/analytics')
      .then(async (analyticsModule) => {
        analyticsModule.initializeAnalytics();
        const webVitalsModule = await import('./lib/webVitals');
        if (!cancelled) {
          cleanupWebVitals = webVitalsModule.observeWebVitals(analyticsModule.trackEvent);
        }
      });

    return () => {
      cancelled = true;
      cleanupWebVitals();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <InstallPrompt />
          <PWAUpdatePrompt />
          <RouterProvider router={appRouter} />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
