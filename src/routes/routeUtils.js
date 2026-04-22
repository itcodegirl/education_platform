function isSameOriginReferrer() {
  if (typeof window === 'undefined') return false;
  if (!document.referrer) return false;
  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function toPathFromLegacyHash(hash = '') {
  if (!hash || hash === '#') return null;
  if (hash === '#admin') return '/admin';
  if (hash === '#profile') return '/profile';
  if (hash === '#styleguide') return '/styleguide';

  const publicMatch = hash.match(/^#u\/([^/?#]+)/);
  if (publicMatch) {
    return `/u/${encodeURIComponent(decodeURIComponent(publicMatch[1]))}`;
  }

  const learnMatch = hash.match(/^#learn\/([^/]+)\/([^/]+)\/([^/?#]+)/);
  if (learnMatch) {
    return `/learn/${encodeURIComponent(decodeURIComponent(learnMatch[1]))}/${encodeURIComponent(decodeURIComponent(learnMatch[2]))}/${encodeURIComponent(decodeURIComponent(learnMatch[3]))}`;
  }

  return null;
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
  navigateTo('/', { replace: true });
}
