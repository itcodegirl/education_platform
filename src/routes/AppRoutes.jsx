import { lazy, Suspense, useEffect, useState } from 'react';
import { useTheme, useAuth, useProgressData } from '../providers';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { LessonSkeleton, ConnectionError } from '../components/shared/SkeletonLoader';
import { Logo } from '../components/shared/Logo';
import { AdminRoute } from './guards/AdminRoute';
import { closeRouteOrGoHome, getCurrentPath, toPathFromLegacyHash } from './routeUtils';
import { APP_ROUTES, parsePublicProfilePath } from './routePaths';

const AdminDashboard = lazy(() =>
  import('../components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const ProfilePage = lazy(() =>
  import('../components/shared/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const Styleguide = lazy(() =>
  import('../components/shared/Styleguide').then((m) => ({ default: m.Styleguide })),
);
const PublicProfile = lazy(() =>
  import('../components/shared/PublicProfile').then((m) => ({ default: m.PublicProfile })),
);

function RouteLoadingScreen({ theme, size = 'sm', children }) {
  return (
    <div className={`loading-screen ${theme}`} role="status" aria-live="polite">
      <div className="loading-pulse">
        {size === 'lg' ? <Logo size="lg" showTagline /> : <Logo size={size} />}
        {children}
      </div>
    </div>
  );
}

export default function AppRoutes() {
  const { theme } = useTheme();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { dataLoaded, loadError, retryLoad } = useProgressData();
  const [path, setPath] = useState(() => getCurrentPath());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncPath = () => {
      const legacyPath = toPathFromLegacyHash(window.location.hash || '');
      if (legacyPath) {
        window.history.replaceState(null, '', `${legacyPath}${window.location.search}`);
      }
      setPath(getCurrentPath());
    };

    syncPath();
    window.addEventListener('popstate', syncPath);
    window.addEventListener('hashchange', syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('hashchange', syncPath);
    };
  }, []);

  if (path === APP_ROUTES.styleguide) {
    return (
      <div className={theme}>
        <Suspense
          fallback={
            <RouteLoadingScreen theme={theme}>
              <p>Loading styleguide...</p>
            </RouteLoadingScreen>
          }
        >
          <Styleguide onClose={closeRouteOrGoHome} />
        </Suspense>
      </div>
    );
  }

  const publicHandle = parsePublicProfilePath(path);
  if (publicHandle) {
    return (
      <div className={theme}>
        <Suspense
          fallback={
            <RouteLoadingScreen theme={theme}>
              <p>Loading public profile...</p>
            </RouteLoadingScreen>
          }
        >
          <PublicProfile handle={publicHandle} onClose={closeRouteOrGoHome} />
        </Suspense>
      </div>
    );
  }

  if (authLoading) {
    return (
      <RouteLoadingScreen theme={theme} size="lg">
        <p style={{ marginTop: '16px', opacity: 0.5 }}>Checking your account session...</p>
      </RouteLoadingScreen>
    );
  }

  if (!user) return <AuthLayout />;

  if (profile?.is_disabled) {
    return (
      <div className={`loading-screen ${theme}`} role="status" aria-live="polite">
        <div className="disabled-screen">
          <span className="disabled-icon" aria-hidden="true">[ ]</span>
          <h2 className="disabled-title">Account Disabled</h2>
          <p className="disabled-msg">Your account has been disabled. Contact support if this is a mistake.</p>
          <a href="mailto:hello@cinova.app" className="disabled-link">Contact Support</a>
          <button type="button" className="disabled-logout" onClick={() => signOut()}>Log Out</button>
        </div>
      </div>
    );
  }

  if (path === APP_ROUTES.profile) {
    return (
      <div className={theme}>
        <Suspense
          fallback={
            <RouteLoadingScreen theme={theme}>
              <p>Loading profile...</p>
            </RouteLoadingScreen>
          }
        >
          <ProfilePage onClose={closeRouteOrGoHome} />
        </Suspense>
      </div>
    );
  }

  if (path === APP_ROUTES.admin) {
    return (
      <AdminRoute
        fallback={<AppLayout />}
        loadingFallback={
          <RouteLoadingScreen theme={theme}>
            <p>Checking admin access...</p>
          </RouteLoadingScreen>
        }
      >
        <div className={theme}>
          <Suspense
            fallback={
              <RouteLoadingScreen theme={theme}>
                <p>Loading admin dashboard...</p>
              </RouteLoadingScreen>
            }
          >
            <AdminDashboard onClose={closeRouteOrGoHome} />
          </Suspense>
        </div>
      </AdminRoute>
    );
  }

  if (loadError) {
    return (
      <div className={`loading-screen ${theme}`}>
        <ConnectionError onRetry={retryLoad} />
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className={`shell ${theme}`} role="status" aria-live="polite">
        <div className="sidebar skeleton-sidebar-wrap">
          <div className="skeleton-brand-area"><div className="skeleton-line skeleton-w60 skeleton-h16"></div></div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-module">
              <div className="skeleton-line skeleton-w80 skeleton-h14"></div>
              <div className="skeleton-line skeleton-w50 skeleton-h10"></div>
            </div>
          ))}
        </div>
        <div className="main-shell">
          <div className="topbar"><div className="skeleton-line skeleton-w40 skeleton-h14"></div></div>
          <div className="lesson-container"><LessonSkeleton /></div>
        </div>
      </div>
    );
  }

  return <AppLayout />;
}

