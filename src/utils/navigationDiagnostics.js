const NAVIGATION_DEBUG_STORAGE_KEY = 'debug-navigation';

function isDebugValueEnabled(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

export function isNavigationDebugEnabled() {
  if (typeof window === 'undefined') return false;

  try {
    return isDebugValueEnabled(window.localStorage?.getItem(NAVIGATION_DEBUG_STORAGE_KEY));
  } catch {
    return false;
  }
}

function sanitizeDiagnosticValue(value) {
  if (value == null) return value;
  if (['string', 'number', 'boolean'].includes(typeof value)) return value;
  return String(value);
}

export function logNavigationDiagnostic(eventName, details = {}) {
  if (!isNavigationDebugEnabled()) return;

  const safeDetails = Object.fromEntries(
    Object.entries(details).map(([key, value]) => [key, sanitizeDiagnosticValue(value)]),
  );

  console.info('[CodeHerWay navigation]', eventName, safeDetails);
}
