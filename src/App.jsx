// ═══════════════════════════════════════════════
// APP — Providers + Routes. That's it.
// ═══════════════════════════════════════════════

import { AuthProvider, ThemeProvider, ProgressProvider } from './providers';
import { ToastProvider } from './components/shared/Toast';
import { InstallPrompt } from './components/shared/InstallPrompt';
import AppRoutes from './routes/AppRoutes';
import './styles/App.css';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProgressProvider>
          <ToastProvider>
            <InstallPrompt />
            <AppRoutes />
          </ToastProvider>
        </ProgressProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
