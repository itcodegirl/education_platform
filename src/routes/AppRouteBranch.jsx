import { lazy, Suspense } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { LessonSkeleton, ConnectionError } from '../components/shared/SkeletonLoader';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { GuardScreen } from './guards/GuardScreen';
import { ROUTE_NAMES, closeHashRoute } from './routeState';

const ProfilePage = lazy(() =>
  import('../components/shared/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

export function AppRouteBranch({
  route,
  theme,
  dataLoaded,
  loadError,
  retryLoad,
  unauthenticatedFallback = null,
}) {
  if (route.name === ROUTE_NAMES.PROFILE) {
    return (
      <ProtectedRoute
        fallback={unauthenticatedFallback}
        loadingFallback={<GuardScreen message="Loading profile..." />}
      >
        <Suspense fallback={<GuardScreen message="Loading profile..." />}>
          <ProfilePage onClose={closeHashRoute} />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (loadError) {
    return (
      <ProtectedRoute
        fallback={unauthenticatedFallback}
        loadingFallback={<GuardScreen message="Checking access..." />}
      >
        <div className={`loading-screen ${theme}`}>
          <ConnectionError onRetry={retryLoad} />
        </div>
      </ProtectedRoute>
    );
  }

  if (!dataLoaded) {
    return (
      <ProtectedRoute
        fallback={unauthenticatedFallback}
        loadingFallback={<GuardScreen message="Checking access..." />}
      >
        <div className={`shell ${theme}`}>
          <div className="sb sk-sidebar-wrap">
            <div className="sk-brand-area"><div className="sk-line sk-w60 sk-h16"></div></div>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="sk-module">
                <div className="sk-line sk-w80 sk-h14"></div>
                <div className="sk-line sk-w50 sk-h10"></div>
              </div>
            ))}
          </div>
          <div className="mn">
            <div className="topbar"><div className="sk-line sk-w40 sk-h14"></div></div>
            <div className="lv-wrap"><LessonSkeleton /></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute
      fallback={unauthenticatedFallback}
      loadingFallback={<GuardScreen message="Checking access..." />}
    >
      <AppLayout />
    </ProtectedRoute>
  );
}
