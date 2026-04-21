// Optional Sentry bootstrap. Safe no-op when env flags are missing.

let captureExceptionFn = null;

function parseSampleRate(raw) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

function shouldEnableSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return false;

  // Default behavior: enabled in production if DSN is present.
  const enabledFlag = import.meta.env.VITE_SENTRY_ENABLED;
  if (enabledFlag == null || enabledFlag === '') {
    return import.meta.env.PROD;
  }

  return String(enabledFlag).toLowerCase() === 'true';
}

export async function initSentry() {
  if (!shouldEnableSentry()) return;

  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE),
  });

  captureExceptionFn = Sentry.captureException;
}

export function reportException(error, context = {}) {
  if (typeof captureExceptionFn !== 'function') return;
  captureExceptionFn(error, { extra: context });
}
