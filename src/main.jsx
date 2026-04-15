// ═══════════════════════════════════════════════
// MAIN — Entry point. ErrorBoundary + App.
// ═══════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';

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

// ─── Monaco editor loader ──────────────────────
// Must run before any component mounts a Monaco editor. Configures
// @monaco-editor/react to use our Vite-bundled, minimal Monaco build
// instead of fetching monaco-editor from cdn.jsdelivr.net at runtime
// (which the CSP `script-src 'self'` blocks).
import './lib/monacoLoader';

// ─── Service worker registration ───────────────
// Moved out of an inline <script> in index.html because the strict
// CSP blocks inline-script execution. Importing from a module works
// because Vite serves it from our own origin, matching 'self'.
import './lib/registerSW';

import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

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
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
