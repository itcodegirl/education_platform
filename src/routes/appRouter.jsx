import { lazy, Suspense, useEffect } from 'react';
import {
  createBrowserRouter,
  json,
  Navigate,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { COURSE_LOADER_IDS, COURSES, loadCourse } from '../data';
import { supabase } from '../lib/supabaseClient';
import { useAuth, useCourseContent, useProgressData, useTheme } from '../providers';
import { createRecoverableLearnActionWrite } from './learnRouteRecovery';
import { resolveStableLessonKeyAcrossCourses } from '../utils/lessonKeys';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { LessonSkeleton, ConnectionError } from '../components/shared/SkeletonLoader';
import { Logo } from '../components/shared/Logo';
import { AdminRoute } from './guards/AdminRoute';
import { APP_ROUTES, parsePublicProfilePath } from './routePaths';
import { closeRouteOrGoHome, toPathFromLegacyHash } from './routeUtils';
import { RouteErrorBoundary } from './RouteErrorBoundary';

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
        <span className="disabled-icon" aria-hidden="true">[ ]</span>
        <h2 className="disabled-title">Account Disabled</h2>
        <p className="disabled-msg">Your account has been disabled. Contact support if this is a mistake.</p>
        <a href="mailto:hello@codeherway.com" className="disabled-link">Contact Support</a>
        <button type="button" className="disabled-logout" onClick={onSignOut}>Log Out</button>
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

export function ProtectedRoute({ children }) {
  const { theme } = useTheme();
  const { user, profile, loading: authLoading, profileLoading, signOut } = useAuth();

  if (authLoading || (user && profileLoading)) {
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

  return children;
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
    <ProtectedRoute>
      <AppDataGate theme={theme} dataLoaded={dataLoaded} loadError={loadError} retryLoad={retryLoad} />
    </ProtectedRoute>
  );
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
            <p>Loading styleguide...</p>
          </RouteLoadingScreen>
        )}
      >
        <Styleguide onClose={closeRouteOrGoHome} />
      </Suspense>
    </div>
  );
}

function PublicProfileRoute() {
  const { theme } = useTheme();
  const { handle } = useLoaderData();

  return (
    <div className={theme}>
      <Suspense
        fallback={(
          <RouteLoadingScreen theme={theme}>
            <p>Loading public profile...</p>
          </RouteLoadingScreen>
        )}
      >
        <PublicProfile handle={handle} onClose={closeRouteOrGoHome} />
      </Suspense>
    </div>
  );
}

function ProfileRoute() {
  const { theme } = useTheme();

  return (
    <ProtectedRoute>
      <div className={theme}>
        <Suspense
          fallback={(
            <RouteLoadingScreen theme={theme}>
              <p>Loading profile...</p>
            </RouteLoadingScreen>
          )}
        >
          <ProfilePage onClose={closeRouteOrGoHome} />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}

function AdminDashboardRoute() {
  const { theme } = useTheme();
  const { dataLoaded, loadError, retryLoad } = useProgressData();

  return (
    <ProtectedRoute>
      <AdminRoute
        fallback={<AppDataGate theme={theme} dataLoaded={dataLoaded} loadError={loadError} retryLoad={retryLoad} />}
        loadingFallback={(
          <RouteLoadingScreen theme={theme}>
            <p>Checking admin access...</p>
          </RouteLoadingScreen>
        )}
      >
        <div className={theme}>
          <Suspense
            fallback={(
              <RouteLoadingScreen theme={theme}>
                <p>Loading admin dashboard...</p>
              </RouteLoadingScreen>
            )}
          >
            <AdminDashboard onClose={closeRouteOrGoHome} />
          </Suspense>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  );
}

function LearnRoute() {
  const { courseId } = useLoaderData();
  return <ProtectedAppDataRoute preloadCourseId={courseId} />;
}

function HomeRoute() {
  return <ProtectedAppDataRoute />;
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
    const loadedCourse = await loadCourse(courseId);
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

export async function learnRouteAction({ request }) {

  const contentType = request.headers.get('content-type') || '';
  let payload = {};

  try {
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    }
  } catch {
    return json({ ok: false, error: 'Invalid action payload' }, { status: 400 });
  }

  const intent = typeof payload.intent === 'string' ? payload.intent : '';
  const mode = typeof payload.mode === 'string' ? payload.mode : 'toggle';

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.id) {
    return json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  if (intent === 'toggle-progress') {
    const rawLessonKey = typeof payload.lessonKey === 'string' ? payload.lessonKey.trim() : '';
    if (!rawLessonKey) {
      return json({ ok: false, error: 'Missing lesson key' }, { status: 400 });
    }

    const recoverableWrite = createRecoverableLearnActionWrite(intent, payload);

    const stableLessonKey = resolveStableLessonKeyAcrossCourses(rawLessonKey, COURSES);
    const lessonKey = stableLessonKey || rawLessonKey;
    const candidateKeys = [...new Set([lessonKey, rawLessonKey])];
    const shouldComplete = mode === 'complete' ? true : mode === 'uncomplete' ? false : undefined;

    const { data: existing, error: existingError } = await supabase
      .from('progress')
      .select('lesson_key')
      .eq('user_id', user.id)
      .in('lesson_key', candidateKeys);
    if (existingError) {
      return json({ ok: false, intent, error: existingError.message, recoverableWrite }, { status: 500 });
    }

    const hasCompletion = Array.isArray(existing) && existing.length > 0;
    const nextCompleted = typeof shouldComplete === 'boolean' ? shouldComplete : !hasCompletion;

    if (nextCompleted) {
      const { error } = await supabase
        .from('progress')
        .upsert({ user_id: user.id, lesson_key: lessonKey, completed_at: new Date().toISOString() });
      if (error) return json({ ok: false, intent, error: error.message, recoverableWrite }, { status: 500 });
    } else {
      const { error } = await supabase
        .from('progress')
        .delete()
        .eq('user_id', user.id)
        .in('lesson_key', candidateKeys);
      if (error) return json({ ok: false, intent, error: error.message, recoverableWrite }, { status: 500 });
    }

    return json({
      ok: true,
      intent,
      lessonKey,
      completed: nextCompleted,
    });
  }

  if (intent === 'toggle-bookmark') {
    const rawLessonKey = typeof payload.lessonKey === 'string' ? payload.lessonKey.trim() : '';
    const courseId = typeof payload.courseId === 'string' ? payload.courseId : '';
    const lessonTitle = typeof payload.lessonTitle === 'string' ? payload.lessonTitle : '';
    if (!rawLessonKey || !courseId || !lessonTitle) {
      return json({ ok: false, error: 'Missing bookmark fields' }, { status: 400 });
    }

    const recoverableWrite = createRecoverableLearnActionWrite(intent, payload);

    const stableLessonKey = resolveStableLessonKeyAcrossCourses(rawLessonKey, COURSES);
    const lessonKey = stableLessonKey || rawLessonKey;
    const candidateKeys = [...new Set([lessonKey, rawLessonKey])];
    const shouldSave = mode === 'save' ? true : mode === 'remove' ? false : undefined;

    const { data: existing, error: existingError } = await supabase
      .from('bookmarks')
      .select('lesson_key')
      .eq('user_id', user.id)
      .in('lesson_key', candidateKeys);
    if (existingError) {
      return json({ ok: false, intent, error: existingError.message, recoverableWrite }, { status: 500 });
    }

    const hasBookmark = Array.isArray(existing) && existing.length > 0;
    const nextSaved = typeof shouldSave === 'boolean' ? shouldSave : !hasBookmark;

    if (nextSaved) {
      const { error } = await supabase.from('bookmarks').upsert({
        user_id: user.id,
        lesson_key: lessonKey,
        course_id: courseId,
        lesson_title: lessonTitle,
      });
      if (error) return json({ ok: false, intent, error: error.message, recoverableWrite }, { status: 500 });
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .in('lesson_key', candidateKeys);
      if (error) return json({ ok: false, intent, error: error.message, recoverableWrite }, { status: 500 });
    }

    return json({
      ok: true,
      intent,
      lessonKey,
      saved: nextSaved,
    });
  }

  return json({ ok: false, error: 'Unknown action intent' }, { status: 400 });
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
      { index: true, element: <HomeRoute /> },
      { path: STYLEGUIDE_SEGMENT, element: <StyleguideRoute /> },
      { path: PUBLIC_PROFILE_SEGMENT, loader: publicProfileRouteLoader, element: <PublicProfileRoute /> },
      { path: PROFILE_SEGMENT, element: <ProfileRoute /> },
      { path: ADMIN_SEGMENT, element: <AdminDashboardRoute /> },
      { path: LEARN_SEGMENT, loader: learnRouteLoader, action: learnRouteAction, element: <LearnRoute /> },
      { path: '*', element: <Navigate to={APP_ROUTES.home} replace /> },
    ],
  },
]);

