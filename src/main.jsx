// ═══════════════════════════════════════════════
// MAIN — Entry point. ErrorBoundary + App.
// ═══════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// ─── Self-hosted fonts ─────────────────────────
// Bundled via @fontsource(-variable) packages so we can drop
// fonts.googleapis.com / fonts.gstatic.com from the CSP entirely.
// Inter ships as a variable font (single file, 100-900), Poppins +
// Space Mono as discrete weights.
import '@fontsource-variable/inter';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';

// ─── Service worker registration ───────────────
// Moved out of an inline <script> in index.html because the strict
// CSP blocks inline-script execution. Importing from a module works
// because Vite serves it from our own origin, matching 'self'.
import './lib/registerSW';
import { initSentry } from './lib/sentry';

import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

initSentry().catch(() => {
  // Optional telemetry should never block rendering.
});

const CHUNK_RELOAD_KEY = 'chw:chunk-reload-at';
const CHUNK_RELOAD_WINDOW_MS = 15000;

function getChunkErrorMessage(errorLike) {
  if (!errorLike) return '';
  if (typeof errorLike === 'string') return errorLike;
  return (
    errorLike.message ||
    errorLike.reason?.message ||
    errorLike.target?.src ||
    ''
  );
}

function isChunkLoadError(errorLike) {
  const message = String(getChunkErrorMessage(errorLike));
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    (message.includes('Loading chunk') && message.includes('failed'))
  );
}

function recoverFromChunkLoad(errorLike) {
  if (!isChunkLoadError(errorLike)) return false;

  const lastAttempt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
  if (Date.now() - lastAttempt < CHUNK_RELOAD_WINDOW_MS) {
    return false;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));

  const url = new URL(window.location.href);
  url.searchParams.set('refresh', String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

window.addEventListener('error', (event) => {
  recoverFromChunkLoad(event.error || event.message || event);
});

window.addEventListener('unhandledrejection', (event) => {
  if (recoverFromChunkLoad(event.reason || event)) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
