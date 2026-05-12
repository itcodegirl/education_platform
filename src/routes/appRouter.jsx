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
import { Logo } from '../components/shared/Logo';
import { APP_ROUTES, parsePublicProfilePath, routeIdMatches } from './routePaths';
import { closeRouteOrGoHome, toPathFromLegacyHash } from './routeUtils';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const AuthLayout = lazy(() =>
  import('../layouts/AuthLayout').then((module) => ({ default: module.AuthLayout })),
);
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

function loadedCourseHasModuleQuiz(loadedCourse, moduleId) {
  return (loadedCourse.quizzes || []).some((quiz) =>
    quiz?.moduleId != null && routeIdMatches(quiz.moduleId, moduleId),
  );
}

function buildCourseRecoveryPath(courseId, moduleData = null, loadedCourse = null) {
  const fallbackModule = moduleData || loadedCourse?.modules?.[0];
  const fallbackLesson = fallbackModule?.lessons?.[0];
  if (!courseId || !fallbackModule?.id || !fallbackLesson?.id) {
    return APP_ROUTES.home;
  }

  return `${APP_ROUTES.learnBase}/${encodeURIComponent(courseId)}/${encodeURIComponent(
    fallbackModule.id,
  )}/${encodeURIComponent(fallbackLesson.id)}`;
}

function RouteLoadingScreen({ theme, size = 'sm', children }) {
  return (
    <div className={`loading-screen ${theme}`} role="status" aria-live="polite" aria-busy="true">
      <div className="loading-pulse">
        {size === 'lg' ? <Logo size="lg" showTagline /> : <Logo size={size} />}
        {children}
      </div>
    </div>
  );
}

function LoadingMessage({ children }) {
  return <p className="route-loading-message">{children}</p>;
}

function AccountStatusScreen({
  actions,
  icon,
  idPrefix,
  message,
  theme,
  title,
}) {
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-desc`;

  return (
    <div
      className={`loading-screen ${theme}`}
      role="alert"
      aria-live="assertive"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="disabled-screen">
        <span className="disabled-icon" aria-hidden="true">{icon}</span>
        <h2 id={titleId} className="disabled-title">{title}</h2>
        <p id={descriptionId} className="disabled-msg">{message}</p>
        <div className="disabled-actions">
          {actions}
        </div>
      </div>
    </div>
  );
}

function DisabledAccountScreen({ theme, onSignOut }) {
  return (
    <AccountStatusScreen
      theme={theme}
      idPrefix="disabled-account"
      icon="!"
      title="Account disabled"
      message="Your account has been disabled. Contact support if this is a mistake."
      actions={(
        <>
          <a href="mailto:hello@codeherway.com" className="disabled-link">Contact support</a>
          <button type="button" className="disabled-logout" onClick={onSignOut}>Log out</button>
        </>
      )}
    />
  );
}

function AccountCheckErrorScreen({ theme, onRetry, onSignOut }) {
  return (
    <AccountStatusScreen
      theme={theme}
      idPrefix="account-check-error"
      icon="!"
      title="We could not verify your account"
      message="Your lessons are safe, but CodeHerWay needs to confirm your profile before opening the learning dashboard."
      actions={(
        <>
          <button type="button" className="disabled-link" onClick={onRetry}>
            Try again
          </button>
          <button type="button" className="disabled-logout" onClick={onSignOut}>Log out</button>
        </>
      )}
    />
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
        <LoadingMessage>Opening your learning dashboard...</LoadingMessage>
      </RouteLoadingScreen>
    );
  }

  if (!user) {
    return (
      <Suspense
        fallback={(
          <RouteLoadingScreen theme={theme} size="lg">
            <LoadingMessage>Opening CodeHerWay...</LoadingMessage>
          </RouteLoadingScreen>
        )}
      >
        <AuthLayout />
      </Suspense>
    );
  }
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
            <LoadingMessage>Opening styleguide...</LoadingMessage>
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
            <LoadingMessage>Opening public profile...</LoadingMessage>
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
      <LoadingMessage>{message}</LoadingMessage>
    </RouteLoadingScreen>
  );
}

function RouteHydrateFallback() {
  const { theme } = useTheme();

  return (
    <RouteLoadingScreen theme={theme} size="lg">
      <LoadingMessage>Opening CodeHerWay...</LoadingMessage>
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
            <LoadingMessage>Preparing your learning dashboard...</LoadingMessage>
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

  const loadedCourse = await loadCourseRuntime(courseId);
  const moduleMatch = loadedCourse.modules.find((module) => routeIdMatches(module.id, moduleId));
  if (!moduleMatch) {
    throw redirect(buildCourseRecoveryPath(courseId, null, loadedCourse));
  }

  if (lessonId === 'quiz') {
    if (!loadedCourseHasModuleQuiz(loadedCourse, moduleMatch.id)) {
      throw redirect(buildCourseRecoveryPath(courseId, moduleMatch, loadedCourse));
    }
  } else {
    const lessonMatch = moduleMatch.lessons.find((lesson) => routeIdMatches(lesson.id, lessonId));
    if (!lessonMatch) {
      throw redirect(buildCourseRecoveryPath(courseId, moduleMatch, loadedCourse));
    }
  }

  return { courseId, moduleId, lessonId };
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
    hydrateFallbackElement: <RouteHydrateFallback />,
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
