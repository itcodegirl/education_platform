// ═══════════════════════════════════════════════
// APP — Providers + Routes wrapped in a top-level
// ErrorBoundary.
//
// The router has its own RouteErrorBoundary for errors thrown
// inside a route, but anything that throws *outside* the router
// (a provider's first render, an InstallPrompt render, the
// ToastProvider) used to bring down the whole app to a blank
// page. Wrapping at this level guarantees a visible fallback
// screen with retry/reload, no matter where in the tree the
// crash originated.
// ═══════════════════════════════════════════════

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider, ThemeProvider, ProgressProvider, CourseContentProvider } from './providers';
import { ToastProvider } from './components/shared/Toast';
import { InstallPrompt } from './components/shared/InstallPrompt';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { initializeAnalytics } from './lib/analytics';
import { appRouter } from './routes/appRouter';
import './styles/App.css';

export default function App() {
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ProgressProvider>
            <CourseContentProvider>
              <ToastProvider>
                <InstallPrompt />
                <RouterProvider router={appRouter} />
              </ToastProvider>
            </CourseContentProvider>
          </ProgressProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
