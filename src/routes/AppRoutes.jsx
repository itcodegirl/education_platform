import { lazy, Suspense, useEffect } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useRoutes } from 'react-router-dom';
import { useTheme, useAuth, useCourseContent, useProgressData } from '../providers';
import { COURSES } from '../data';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { LessonSkeleton, ConnectionError } from '../components/shared/SkeletonLoader';
import { Logo } from '../components/shared/Logo';
import { AdminRoute } from './guards/AdminRoute';
import { APP_ROUTES, parsePublicProfilePath } from './routePaths';
import { closeRouteOrGoHome, toPathFromLegacyHash } from './routeUtils';

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

function DisabledAccountScreen({ theme, onSignOut }) {
  return (
    <div className={`loading-screen ${theme}`} role="status" aria-live="polite">
      <div className="disabled-screen">
        <span className="disabled-icon" aria-hidden="true">⊘</span>
        <h2 className="disabled-title">Account disabled</h2>
        <p className="disabled-msg">Your account has been disabled. Contact support if this is a mistake.</p>
        <a href="mailto:hello@codeherway.com" className="disabled-link">Contact support</a>
        <button type="button" className="disabled-logout" onClick={onSignOut}>Log out</button>
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

function PublicProfileRoute({ theme }) {
  const { handle = '' } = useParams();
  const validatedHandle = parsePublicProfilePath(`${APP_ROUTES.publicProfileBase}/${handle}`);

  if (!validatedHandle) {
    return <Navigate to={APP_ROUTES.home} replace />;
  }

  return (
    <div className={theme}>
      <Suspense
        fallback={
          <RouteLoadingScreen theme={theme}>
            <p>Loading public profile...</p>
          </RouteLoadingScreen>
        }
      >
        <PublicProfile handle={validatedHandle} onClose={closeRouteOrGoHome} />
      </Suspense>
    </div>
  );
}

function LearnRouteLoader({ children }) {
  const { courseId = '' } = useParams();
  const { ensureLoaded } = useCourseContent();
  const isKnownCourse = COURSES.some((course) => course.id === courseId);

  useEffect(() => {
    if (!isKnownCourse) return;
    ensureLoaded(courseId);
  }, [courseId, ensureLoaded, isKnownCourse]);

  if (!isKnownCourse) {
    return <Navigate to={APP_ROUTES.home} replace />;
  }

  return children;
}

export default function AppRoutes() {
  const { theme } = useTheme();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { dataLoaded, loadError, retryLoad } = useProgressData();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const legacyPath = toPathFromLegacyHash(location.hash || '');
    if (!legacyPath) return;
    navigate(`${legacyPath}${location.search || ''}`, { replace: true });
  }, [location.hash, location.search, navigate]);

  const renderProtected = (element) => {
    if (authLoading) {
      return (
        <RouteLoadingScreen theme={theme} size="lg">
          <p style={{ marginTop: '16px', opacity: 0.5 }}>Checking your account session...</p>
        </RouteLoadingScreen>
      );
    }

    if (!user) return <AuthLayout />;

    if (profile?.is_disabled) {
      return <DisabledAccountScreen theme={theme} onSignOut={signOut} />;
    }

    return element;
  };

  const routes = useRoutes([
    {
      path: APP_ROUTES.styleguide,
      element: (
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
      ),
    },
    {
      path: `${APP_ROUTES.publicProfileBase}/:handle`,
      element: <PublicProfileRoute theme={theme} />,
    },
    {
      path: APP_ROUTES.profile,
      element: renderProtected(
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
        </div>,
      ),
    },
    {
      path: APP_ROUTES.admin,
      element: renderProtected(
        <AdminRoute
          fallback={<AppDataGate theme={theme} dataLoaded={dataLoaded} loadError={loadError} retryLoad={retryLoad} />}
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
        </AdminRoute>,
      ),
    },
    {
      path: `${APP_ROUTES.learnBase}/:courseId/:moduleId/:lessonId`,
      element: renderProtected(
        <LearnRouteLoader>
          <AppDataGate theme={theme} dataLoaded={dataLoaded} loadError={loadError} retryLoad={retryLoad} />
        </LearnRouteLoader>,
      ),
    },
    {
      path: APP_ROUTES.home,
      element: renderProtected(
        <AppDataGate theme={theme} dataLoaded={dataLoaded} loadError={loadError} retryLoad={retryLoad} />,
      ),
    },
    {
      path: '*',
      element: <Navigate to={APP_ROUTES.home} replace />,
    },
  ]);

  return routes;
}


