// ═══════════════════════════════════════════════
// APP ROUTES — All render gates in one place
// Auth → Disabled → Admin → Error → Loading → App
// ═══════════════════════════════════════════════

import { lazy, Suspense } from 'react';
import { useTheme, useAuth, useProgress } from '../providers';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { LessonSkeleton, ConnectionError } from '../components/shared/SkeletonLoader';
import { Logo } from '../components/shared/Logo';

// Admin is lazy — most users never see it
const AdminDashboard = lazy(() =>
  import('../components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);
const ProfilePage = lazy(() =>
  import('../components/shared/ProfilePage').then(m => ({ default: m.ProfilePage }))
);
// Styleguide is public (no auth required) and lazy — design review only.
const Styleguide = lazy(() =>
  import('../components/shared/Styleguide').then(m => ({ default: m.Styleguide }))
);

export default function AppRoutes() {
  const { theme } = useTheme();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { dataLoaded, loadError, retryLoad } = useProgress();

  // ─── Styleguide route (public, no auth) ───
  // Deliberately checked before authLoading so anyone can preview the
  // design system — useful for code review, design handoff, and as a
  // portfolio artifact.
  if (typeof window !== 'undefined' && window.location.hash === '#styleguide') {
    return (
      <div className={theme}>
        <Suspense fallback={
          <div className="loading-screen">
            <div className="loading-pulse"><Logo size="sm" /><p>Loading styleguide...</p></div>
          </div>
        }>
          <Styleguide onClose={() => { window.location.hash = ''; window.location.reload(); }} />
        </Suspense>
      </div>
    );
  }

  // ─── Loading (auth check in progress) ─────
  if (authLoading) {
    return (
      <div className={`loading-screen ${theme}`}>
        <div className="loading-pulse">
          <Logo size="lg" showTagline />
          <p style={{marginTop: '16px', opacity: 0.5}}>Loading...</p>
        </div>
      </div>
    );
  }

  // ─── Not logged in ────────────────────────
  if (!user) return <AuthLayout />;

  // ─── Account disabled ─────────────────────
  if (profile?.is_disabled) {
    return (
      <div className={`loading-screen ${theme}`}>
        <div className="disabled-screen">
          <span className="disabled-icon">🚫</span>
          <h2 className="disabled-title">Account Disabled</h2>
          <p className="disabled-msg">Your account has been disabled. Contact support if this is a mistake.</p>
          <a href="mailto:hello@codeherway.com" className="disabled-link">Contact Support</a>
          <button type="button" className="disabled-logout" onClick={() => signOut()}>Log Out</button>
        </div>
      </div>
    );
  }

  // ─── Profile route ─────────────────────────
  if (window.location.hash === '#profile') {
    return (
      <div className={theme}>
        <Suspense fallback={
          <div className="loading-screen">
            <div className="loading-pulse"><Logo size="sm" /><p>Loading profile...</p></div>
          </div>
        }>
          <ProfilePage onClose={() => { window.location.hash = ''; window.location.reload(); }} />
        </Suspense>
      </div>
    );
  }

  // ─── Admin route ──────────────────────────
  if (window.location.hash === '#admin') {
    return (
      <div className={theme}>
        <Suspense fallback={
          <div className="loading-screen">
            <div className="loading-pulse"><Logo size="sm" /><p>Loading admin...</p></div>
          </div>
        }>
          <AdminDashboard onClose={() => { window.location.hash = ''; window.location.reload(); }} />
        </Suspense>
      </div>
    );
  }

  // ─── Database error ───────────────────────
  if (loadError) {
    return (
      <div className={`loading-screen ${theme}`}>
        <ConnectionError onRetry={retryLoad} />
      </div>
    );
  }

  // ─── Data loading (skeleton) ──────────────
  if (!dataLoaded) {
    return (
      <div className={`shell ${theme}`}>
        <div className="sb sk-sidebar-wrap">
          <div className="sk-brand-area"><div className="sk-line sk-w60 sk-h16"></div></div>
          {[1,2,3,4,5,6].map(i => (
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

  // ─── Main app ─────────────────────────────
  return <AppLayout />;
}
