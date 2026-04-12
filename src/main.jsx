// ═══════════════════════════════════════════════
// MAIN — Entry point. ErrorBoundary + App.
// ═══════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Monaco is lazy-loaded by the code editor components themselves —
// see src/lib/monacoLoader.js and its call sites in CodePreview /
// CodeChallenge. Do NOT import the loader from here, or Vite pulls
// the entire Monaco package (all language modes, ~4 MB) into the
// initial bundle.

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
