import { lazy, Suspense, useEffect, useState } from 'react';
import { useTheme, useAuth, useProgressData } from '../providers';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { LessonSkeleton, ConnectionError } from '../components/shared/SkeletonLoader';
import { Logo } from '../components/shared/Logo';

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

function parsePublicProfileHash(hash = '') {
  const match = hash.match(/^#u\/([^/?#]+)/);
  if (!match) return null;

  const handle = decodeURIComponent(match[1]);
  if (!/^[A-Za-z0-9_-]{2,30}$/.test(handle)) return null;
  return handle;
}

function clearHash() {
  if (typeof window === 'undefined') return;
  window.location.hash = '';
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

export default function AppRoutes() {
  const { theme } = useTheme();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { dataLoaded, loadError, retryLoad } = useProgressData();
  const [hash, setHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : '',
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncHash = () => setHash(window.location.hash || '');
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  if (hash === '#styleguide') {
    return (
      <div className={theme}>
        <Suspense
          fallback={
            <RouteLoadingScreen theme={theme}>
              <p>Loading styleguide...</p>
            </RouteLoadingScreen>
          }
        >
          <Styleguide onClose={clearHash} />
        </Suspense>
      </div>
    );
  }

  const publicHandle = parsePublicProfileHash(hash);
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
          <PublicProfile handle={publicHandle} onClose={clearHash} />
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
          <a href="mailto:hello@codeherway.com" className="disabled-link">Contact Support</a>
          <button type="button" className="disabled-logout" onClick={() => signOut()}>Log Out</button>
        </div>
      </div>
    );
  }

  if (hash === '#profile') {
    return (
      <div className={theme}>
        <Suspense
          fallback={
            <RouteLoadingScreen theme={theme}>
              <p>Loading profile...</p>
            </RouteLoadingScreen>
          }
        >
          <ProfilePage onClose={clearHash} />
        </Suspense>
      </div>
    );
  }

  if (hash === '#admin') {
    return (
      <div className={theme}>
        <Suspense
          fallback={
            <RouteLoadingScreen theme={theme}>
              <p>Loading admin dashboard...</p>
            </RouteLoadingScreen>
          }
        >
          <AdminDashboard onClose={clearHash} />
        </Suspense>
      </div>
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
    );
  }

  return <AppLayout />;
}
