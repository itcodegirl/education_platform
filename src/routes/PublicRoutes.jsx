import { lazy, Suspense } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { PublicOnlyRoute } from './guards/PublicOnlyRoute';
import { GuardScreen } from './guards/GuardScreen';
import { ROUTE_NAMES, closeHashRoute } from './routeState';

const Styleguide = lazy(() =>
  import('../components/shared/Styleguide').then((m) => ({ default: m.Styleguide })),
);

const PublicProfile = lazy(() =>
  import('../components/shared/PublicProfile').then((m) => ({ default: m.PublicProfile })),
);

export function PublicRoutes({ route, authenticatedFallback = null }) {
  switch (route.name) {
    case ROUTE_NAMES.STYLEGUIDE:
      return (
        <PublicLayout>
          <Suspense fallback={<GuardScreen message="Loading styleguide..." />}>
            <Styleguide onClose={closeHashRoute} />
          </Suspense>
        </PublicLayout>
      );

    case ROUTE_NAMES.PUBLIC_PROFILE:
      return (
        <PublicLayout>
          <Suspense fallback={<GuardScreen message="Loading profile..." />}>
            <PublicProfile handle={route.handle} onClose={closeHashRoute} />
          </Suspense>
        </PublicLayout>
      );

    case ROUTE_NAMES.AUTH:
    default:
      return (
        <PublicLayout showBrand={false}>
          <PublicOnlyRoute
            fallback={authenticatedFallback}
            loadingFallback={<GuardScreen message="Loading..." />}
          >
            <AuthLayout />
          </PublicOnlyRoute>
        </PublicLayout>
      );
  }
}
