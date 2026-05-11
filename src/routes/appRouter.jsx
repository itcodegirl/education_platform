import { lazy, Suspense, useEffect } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { COURSE_LOADER_IDS, loadCourseRuntime } from '../data';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { AuthLayout } from '../layouts/AuthLayout';
import { Logo } from '../components/shared/Logo';
import { APP_ROUTES, parsePublicProfilePath } from './routePaths';
import { closeRouteOrGoHome, toPathFromLegacyHash } from './routeUtils';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const Styleguide = lazy(() =>
  import('../components/shared/Styleguide').then((module) => ({ default: module.Styleguide })),
);
const PublicProfilePageRoute = lazy(() =>
  import('./PublicProfileRoute').then((module) => ({ default: module.PublicProfileRoute })),
);
const ProtectedAppProvidersLayout = lazy(() =>
  import('./ProtectedAppRoutes').then((module) => ({ default: module.ProtectedAppProvidersLayout })),
);
const ProtectedHomeRoute = lazy(() =>
  import('./ProtectedAppRoutes').then((module) => ({ default: module.ProtectedHomeRoute })),
);
const ProtectedLearnRoute = lazy(() =>
  import('./ProtectedAppRoutes').then((module) => ({ default: module.ProtectedLearnRoute })),
);
const ProtectedProfileRoute = lazy(() =>
  import('./ProtectedAppRoutes').then((module) => ({ default: module.ProtectedProfileRoute })),
);
const ProtectedAdminDashboardRoute = lazy(() =>
  import('./ProtectedAppRoutes').then((module) => ({ default: module.ProtectedAdminDashboardRoute })),
);

export async function learnRouteAction(args) {
  const module = await import('./learnRouteActions');
  return module.learnRouteAction(args);
}

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

function AccountCheckErrorScreen({ theme, onRetry, onSignOut }) {
  return (
    <div className={`loading-screen ${theme}`} role="alert" aria-live="assertive">
      <div className="disabled-screen">
        <span className="disabled-icon" aria-hidden="true">!</span>
        <h2 className="disabled-title">We could not verify your account</h2>
        <p className="disabled-msg">
          Your lessons are safe, but CodeHerWay needs to confirm your profile before opening the learning dashboard.
        </p>
        <button type="button" className="disabled-logout" onClick={onRetry}>
          Try Again
        </button>
        <button type="button" className="disabled-link" onClick={onSignOut}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { theme } = useTheme();
  const {
    user,
    profile,
    profileError,
    loading: authLoading,
    profileLoading,
    refreshProfile,
    signOut,
  } = useAuth();

  if (authLoading || (user && profileLoading)) {
    return (
      <RouteLoadingScreen theme={theme} size="lg">
        <p style={{ marginTop: '16px', opacity: 0.5 }}>Opening your learning dashboard...</p>
      </RouteLoadingScreen>
    );
  }

  if (!user) return <AuthLayout />;
  if (profileError) {
    return <AccountCheckErrorScreen theme={theme} onRetry={refreshProfile} onSignOut={signOut} />;
  }
  if (profile?.is_disabled) {
    return <DisabledAccountScreen theme={theme} onSignOut={signOut} />;
  }

  return children;
}

function RouteShell() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const legacyPath = toPathFromLegacyHash(location.hash || '');
    if (!legacyPath) return;
    navigate(`${legacyPath}${location.search || ''}`, { replace: true });
  }, [location.hash, location.search, navigate]);

  return <Outlet />;
}

function StyleguideRoute() {
  const { theme } = useTheme();
  return (
    <div className={theme}>
      <Suspense
        fallback={(
          <RouteLoadingScreen theme={theme}>
            <p>Opening styleguide...</p>
          </RouteLoadingScreen>
        )}
      >
        <Styleguide onClose={closeRouteOrGoHome} />
      </Suspense>
    </div>
  );
}

function PublicProfileRouteShell() {
  const { theme } = useTheme();
  const { handle } = useLoaderData();

  return (
    <div className={theme}>
      <Suspense
        fallback={(
          <RouteLoadingScreen theme={theme}>
            <p>Opening public profile...</p>
          </RouteLoadingScreen>
        )}
      >
        <PublicProfilePageRoute handle={handle} onClose={closeRouteOrGoHome} />
      </Suspense>
    </div>
  );
}

function ProtectedShellLoadingScreen({ message }) {
  const { theme } = useTheme();

  return (
    <RouteLoadingScreen theme={theme}>
      <p>{message}</p>
    </RouteLoadingScreen>
  );
}

function ProtectedAppShellRoute() {
  const { theme } = useTheme();

  return (
    <ProtectedRoute>
      <Suspense
        fallback={(
          <RouteLoadingScreen theme={theme} size="lg">
            <p style={{ marginTop: '16px', opacity: 0.5 }}>Preparing your learning dashboard...</p>
          </RouteLoadingScreen>
        )}
      >
        <ProtectedAppProvidersLayout />
      </Suspense>
    </ProtectedRoute>
  );
}

function HomeRoute() {
  return (
    <Suspense fallback={<ProtectedShellLoadingScreen message="Loading your lesson workspace..." />}>
      <ProtectedHomeRoute />
    </Suspense>
  );
}

function LearnRoute() {
  const { courseId } = useLoaderData();

  return (
    <Suspense fallback={<ProtectedShellLoadingScreen message="Loading this lesson..." />}>
      <ProtectedLearnRoute preloadCourseId={courseId} />
    </Suspense>
  );
}

function ProfileRouteShell() {
  return (
    <Suspense fallback={<ProtectedShellLoadingScreen message="Opening profile..." />}>
      <ProtectedProfileRoute />
    </Suspense>
  );
}

function AdminDashboardRouteShell() {
  return (
    <Suspense fallback={<ProtectedShellLoadingScreen message="Opening admin dashboard..." />}>
      <ProtectedAdminDashboardRoute />
    </Suspense>
  );
}

export async function publicProfileRouteLoader({ params }) {
  const safeHandle = parsePublicProfilePath(`${APP_ROUTES.publicProfileBase}/${params.handle || ''}`);
  if (!safeHandle) {
    throw redirect(APP_ROUTES.home);
  }
  return { handle: safeHandle };
}

export async function learnRouteLoader({ params }) {
  const { courseId = '', moduleId = '', lessonId = '' } = params;

  if (!COURSE_LOADER_IDS.includes(courseId)) {
    throw redirect(APP_ROUTES.home);
  }

  try {
    const loadedCourse = await loadCourseRuntime(courseId);
    const moduleMatch = loadedCourse.modules.find((module) => module.id === moduleId);
    if (!moduleMatch) {
      throw new Error('Unknown module');
    }

    if (lessonId !== 'quiz') {
      const lessonMatch = moduleMatch.lessons.find((lesson) => lesson.id === lessonId);
      if (!lessonMatch) {
        throw new Error('Unknown lesson');
      }
    }

    return { courseId, moduleId, lessonId };
  } catch {
    throw redirect(APP_ROUTES.home);
  }
}

const STYLEGUIDE_SEGMENT = APP_ROUTES.styleguide.replace(/^\//, '');
const PROFILE_SEGMENT = APP_ROUTES.profile.replace(/^\//, '');
const ADMIN_SEGMENT = APP_ROUTES.admin.replace(/^\//, '');
const PUBLIC_PROFILE_SEGMENT = `${APP_ROUTES.publicProfileBase.replace(/^\//, '')}/:handle`;
const LEARN_SEGMENT = `${APP_ROUTES.learnBase.replace(/^\//, '')}/:courseId/:moduleId/:lessonId`;

export const appRouter = createBrowserRouter([
  {
    path: APP_ROUTES.home,
    action: learnRouteAction,
    element: <RouteShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: STYLEGUIDE_SEGMENT, element: <StyleguideRoute /> },
      { path: PUBLIC_PROFILE_SEGMENT, loader: publicProfileRouteLoader, element: <PublicProfileRouteShell /> },
      {
        element: <ProtectedAppShellRoute />,
        children: [
          { index: true, element: <HomeRoute /> },
          { path: PROFILE_SEGMENT, element: <ProfileRouteShell /> },
          { path: ADMIN_SEGMENT, element: <AdminDashboardRouteShell /> },
          { path: LEARN_SEGMENT, loader: learnRouteLoader, action: learnRouteAction, element: <LearnRoute /> },
        ],
      },
      { path: '*', element: <Navigate to={APP_ROUTES.home} replace /> },
    ],
  },
]);
