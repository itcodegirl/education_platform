// ═══════════════════════════════════════════════
// APP ROUTES — All render gates in one place
// Auth → Disabled → Overlay → Error → Loading → App
//
// Overlay routing (profile / admin) is tracked in React
// state instead of window.location.hash, so closing an
// overlay no longer triggers a full page reload. The
// URL hash is still honoured for deep links — existing
// #profile / #admin bookmarks work, and hashchange
// events update the overlay — but once React is mounted
// we clear the hash so a subsequent manual reload
// doesn't re-enter the overlay.
// ═══════════════════════════════════════════════

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useTheme, useAuth, useProgress } from '../providers';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { LessonSkeleton, ConnectionError } from '../components/shared/SkeletonLoader';

// Admin is lazy — most users never see it
const AdminDashboard = lazy(() =>
  import('../components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);
const ProfilePage = lazy(() =>
  import('../components/shared/ProfilePage').then(m => ({ default: m.ProfilePage }))
);

function readOverlayFromHash() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (hash === '#profile') return 'profile';
  if (hash === '#admin') return 'admin';
  return null;
}

export default function AppRoutes() {
  const { theme } = useTheme();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { dataLoaded, loadError, retryLoad } = useProgress();

  // overlay ∈ { null | 'profile' | 'admin' }
  const [overlay, setOverlay] = useState(() => readOverlayFromHash());

  const closeOverlay = useCallback(() => {
    setOverlay(null);
    // Keep the URL bar in sync so a subsequent manual reload doesn't
    // re-enter the overlay. replaceState avoids scrolling the page and
    // doesn't trigger an extra hashchange roundtrip.
    if (typeof window !== 'undefined' && window.location.hash) {
      const { pathname, search } = window.location;
      window.history.replaceState(null, '', pathname + search);
    }
  }, []);

  const openOverlay = useCallback((name) => {
    setOverlay(name);
  }, []);

  // Support deep-linked #profile / #admin bookmarks even after the
  // first render — a user could paste a URL with a hash into the
  // address bar of an already-mounted app.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => {
      const next = readOverlayFromHash();
      if (next) setOverlay(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // ─── Loading (auth check in progress) ─────
  if (authLoading) {
    return (
      <div className={`loading-screen ${theme}`}>
        <div className="loading-pulse">
          <span className="loading-bolt">⚡</span>
          <p>Loading CodeHerWay...</p>
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

  // ─── Profile overlay ───────────────────────
  if (overlay === 'profile') {
    return (
      <div className={theme}>
        <Suspense fallback={
          <div className="loading-screen">
            <div className="loading-pulse"><span className="loading-bolt">⚡</span><p>Loading profile...</p></div>
          </div>
        }>
          <ProfilePage onClose={closeOverlay} />
        </Suspense>
      </div>
    );
  }

  // ─── Admin overlay ─────────────────────────
  if (overlay === 'admin') {
    return (
      <div className={theme}>
        <Suspense fallback={
          <div className="loading-screen">
            <div className="loading-pulse"><span className="loading-bolt">⚡</span><p>Loading admin...</p></div>
          </div>
        }>
          <AdminDashboard onClose={closeOverlay} />
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
  return <AppLayout onOpenOverlay={openOverlay} />;
}
