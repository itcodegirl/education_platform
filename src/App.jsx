// ═══════════════════════════════════════════════
// APP — Providers + Routes. That's it.
// ═══════════════════════════════════════════════

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider, ThemeProvider, ProgressProvider, CourseContentProvider } from './providers';
import { ToastProvider } from './components/shared/Toast';
import { InstallPrompt } from './components/shared/InstallPrompt';
import { initializeAnalytics } from './lib/analytics';
import { appRouter } from './routes/appRouter';
import './styles/App.css';

export default function App() {
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return (
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
  );
}
