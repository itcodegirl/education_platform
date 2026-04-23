// ═══════════════════════════════════════════════
// APP — Providers + Routes. That's it.
// ═══════════════════════════════════════════════

import { useEffect } from 'react';
import { AuthProvider, ThemeProvider, ProgressProvider, CourseContentProvider } from './providers';
import { ToastProvider } from './components/shared/Toast';
import { InstallPrompt } from './components/shared/InstallPrompt';
import { initializeAnalytics } from './lib/analytics';
import AppRoutes from './routes/AppRoutes';
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
              <AppRoutes />
            </ToastProvider>
          </CourseContentProvider>
        </ProgressProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
