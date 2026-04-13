// ═══════════════════════════════════════════════
// APP — Providers + Routes. That's it.
// ═══════════════════════════════════════════════

import { AuthProvider, ThemeProvider, ProgressProvider, CourseContentProvider } from './providers';
import { ToastProvider } from './components/shared/Toast';
import { InstallPrompt } from './components/shared/InstallPrompt';
import AppRoutes from './routes/AppRoutes';
import './styles/App.css';

export default function App() {
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
