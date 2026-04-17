export const ROUTE_SECTIONS = {
  PUBLIC: 'public',
  APP: 'app',
  ADMIN: 'admin',
};

export const ROUTE_NAMES = {
  AUTH: 'auth',
  STYLEGUIDE: 'styleguide',
  PUBLIC_PROFILE: 'public-profile',
  PROFILE: 'profile',
  APP_HOME: 'app-home',
  ADMIN_DASHBOARD: 'admin-dashboard',
};

export function getCurrentRoute() {
  if (typeof window === 'undefined') {
    return { section: ROUTE_SECTIONS.PUBLIC, name: ROUTE_NAMES.AUTH };
  }

  const hash = window.location.hash || '';

  if (hash === '#styleguide') {
    return { section: ROUTE_SECTIONS.PUBLIC, name: ROUTE_NAMES.STYLEGUIDE };
  }

  const publicProfileMatch = hash.match(/^#u\/([^/?#]+)/);
  if (publicProfileMatch) {
    const handle = decodeURIComponent(publicProfileMatch[1]);
    if (/^[A-Za-z0-9_-]{2,30}$/.test(handle)) {
      return {
        section: ROUTE_SECTIONS.PUBLIC,
        name: ROUTE_NAMES.PUBLIC_PROFILE,
        handle,
      };
    }
  }

  if (hash === '#profile') {
    return { section: ROUTE_SECTIONS.APP, name: ROUTE_NAMES.PROFILE };
  }

  if (hash === '#admin') {
    return { section: ROUTE_SECTIONS.ADMIN, name: ROUTE_NAMES.ADMIN_DASHBOARD };
  }

  return { section: ROUTE_SECTIONS.APP, name: ROUTE_NAMES.APP_HOME };
}

export function closeHashRoute() {
  if (typeof window === 'undefined') return;
  window.location.hash = '';
  window.location.reload();
}
