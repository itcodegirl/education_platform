import { describe, it, expect } from 'vitest';
import { APP_ROUTES } from './routePaths';
import { APP_ROUTE_KIND, resolveAppRoute } from './resolveAppRoute';

describe('resolveAppRoute', () => {
  it('resolves explicit top-level routes', () => {
    expect(resolveAppRoute(APP_ROUTES.styleguide)).toEqual({ kind: APP_ROUTE_KIND.styleguide });
    expect(resolveAppRoute(APP_ROUTES.profile)).toEqual({ kind: APP_ROUTE_KIND.profile });
    expect(resolveAppRoute(APP_ROUTES.admin)).toEqual({ kind: APP_ROUTE_KIND.admin });
  });

  it('resolves public profile routes with valid handles', () => {
    expect(resolveAppRoute('/u/jenna-dev')).toEqual({
      kind: APP_ROUTE_KIND.publicProfile,
      publicHandle: 'jenna-dev',
    });
  });

  it('falls back to app route for unknown or invalid paths', () => {
    expect(resolveAppRoute('/u/!invalid')).toEqual({ kind: APP_ROUTE_KIND.app });
    expect(resolveAppRoute('/somewhere-else')).toEqual({ kind: APP_ROUTE_KIND.app });
  });
});
