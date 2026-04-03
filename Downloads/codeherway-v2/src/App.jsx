// ═══════════════════════════════════════════════
// APP — Providers + Routes. That's it.
// ═══════════════════════════════════════════════

import { AuthProvider, ThemeProvider, ProgressProvider } from './providers';
import AppRoutes from './routes/AppRoutes';
import './styles/App.css';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProgressProvider>
          <AppRoutes />
        </ProgressProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
