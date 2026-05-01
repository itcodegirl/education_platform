import { APP_ROUTES, parsePublicProfilePath } from './routePaths';

export const APP_ROUTE_KIND = Object.freeze({
  styleguide: 'styleguide',
  publicProfile: 'publicProfile',
  profile: 'profile',
  admin: 'admin',
  app: 'app',
});

export function resolveAppRoute(path = '') {
  if (path === APP_ROUTES.styleguide) {
    return { kind: APP_ROUTE_KIND.styleguide };
  }

  const publicHandle = parsePublicProfilePath(path);
  if (publicHandle) {
    return {
      kind: APP_ROUTE_KIND.publicProfile,
      publicHandle,
    };
  }

  if (path === APP_ROUTES.profile) {
    return { kind: APP_ROUTE_KIND.profile };
  }

  if (path === APP_ROUTES.admin) {
    return { kind: APP_ROUTE_KIND.admin };
  }

  return { kind: APP_ROUTE_KIND.app };
}
