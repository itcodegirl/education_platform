import { APP_ROUTES, toPathFromLegacyHash } from './routePaths';

function isSameOriginReferrer() {
  if (typeof window === 'undefined') return false;
  if (!document.referrer) return false;
  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function getCurrentPath() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

export function navigateTo(path, { replace = false } = {}) {
  if (typeof window === 'undefined') return;
  if (!path || path === getCurrentPath()) return;

  const method = replace ? 'replaceState' : 'pushState';
  window.history[method](null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function closeRouteOrGoHome() {
  if (typeof window === 'undefined') return;
  if (window.history.length > 1 && isSameOriginReferrer()) {
    window.history.back();
    return;
  }
  navigateTo(APP_ROUTES.home, { replace: true });
}

export { toPathFromLegacyHash };
