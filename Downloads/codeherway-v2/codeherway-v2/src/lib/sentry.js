// ═══════════════════════════════════════════════
// SENTRY — Error monitoring initialization
//
// Set VITE_SENTRY_DSN in your .env to enable.
// Get your DSN from: https://sentry.io → Project Settings → Client Keys
// Free tier: 5K errors/month
// ═══════════════════════════════════════════════

import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
  });
}

export { Sentry };
