import { lazy, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import { ProgressProvider, useProgressData } from '../providers/ProgressProvider';
import { CourseContentProvider, useCourseContent } from '../providers/CourseContentProvider';
import { ToastProvider } from '../components/shared/Toast';
import { AppLayout } from '../layouts/AppLayout';
import { LessonSkeleton, ConnectionError } from '../components/shared/SkeletonLoader';
import { Logo } from '../components/shared/Logo';
import { AdminRoute } from './guards/AdminRoute';
import { closeRouteOrGoHome } from './routeUtils';
import '../styles/App.css';

const AdminDashboard = lazy(() =>
  import('../components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const ProfilePage = lazy(() =>
  import('../components/shared/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

function ProtectedRouteLoadingScreen({ theme, children }) {
  return (
    <div className={`loading-screen ${theme}`} role="status" aria-live="polite">
      <div className="loading-pulse">
        <Logo size="sm" />
        {children}
      </div>
    </div>
  );
}

function AppDataGate({ theme, dataLoaded, loadError, retryLoad }) {
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
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="skeleton-module">
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

function ProtectedAppDataRoute({ preloadCourseId = '' }) {
  const { theme } = useTheme();
  const { dataLoaded, loadError, retryLoad } = useProgressData();
  const { ensureLoaded } = useCourseContent();

  useEffect(() => {
    if (!preloadCourseId) return;
    ensureLoaded(preloadCourseId);
  }, [ensureLoaded, preloadCourseId]);

  return (
    <AppDataGate
      theme={theme}
      dataLoaded={dataLoaded}
      loadError={loadError}
      retryLoad={retryLoad}
    />
  );
}

export function ProtectedAppProvidersLayout() {
  return (
    <ProgressProvider>
      <CourseContentProvider>
        <ToastProvider>
          <Outlet />
        </ToastProvider>
      </CourseContentProvider>
    </ProgressProvider>
  );
}

export function ProtectedHomeRoute() {
  return <ProtectedAppDataRoute />;
}

export function ProtectedLearnRoute({ preloadCourseId = '' }) {
  return <ProtectedAppDataRoute preloadCourseId={preloadCourseId} />;
}

export function ProtectedProfileRoute() {
  const { theme } = useTheme();

  return (
    <div className={theme}>
      <Suspense
        fallback={(
          <ProtectedRouteLoadingScreen theme={theme}>
            <p>Opening profile...</p>
          </ProtectedRouteLoadingScreen>
        )}
      >
        <ProfilePage onClose={closeRouteOrGoHome} />
      </Suspense>
    </div>
  );
}

export function ProtectedAdminDashboardRoute() {
  const { theme } = useTheme();
  const { dataLoaded, loadError, retryLoad } = useProgressData();

  return (
    <AdminRoute
      fallback={<AppDataGate theme={theme} dataLoaded={dataLoaded} loadError={loadError} retryLoad={retryLoad} />}
      loadingFallback={(
        <ProtectedRouteLoadingScreen theme={theme}>
          <p>Checking admin access...</p>
        </ProtectedRouteLoadingScreen>
      )}
    >
      <div className={theme}>
        <Suspense
          fallback={(
            <ProtectedRouteLoadingScreen theme={theme}>
              <p>Opening admin dashboard...</p>
            </ProtectedRouteLoadingScreen>
          )}
        >
          <AdminDashboard onClose={closeRouteOrGoHome} />
        </Suspense>
      </div>
    </AdminRoute>
  );
}
