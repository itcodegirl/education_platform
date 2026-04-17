import { useTheme, useAuth, useProgress } from '../providers';
import { Logo } from '../components/shared/Logo';
import { AuthLayout } from '../layouts/AuthLayout';
import { PublicRoutes } from './PublicRoutes';
import { AppRouteBranch } from './AppRouteBranch';
import { AdminRouteBranch } from './AdminRouteBranch';
import { ROUTE_SECTIONS, ROUTE_NAMES, getCurrentRoute } from './routeState';

export default function AppRoutes() {
  const { theme } = useTheme();
  const { profile, loading: authLoading, signOut } = useAuth();
  const { dataLoaded, loadError, retryLoad } = useProgress();
  const route = getCurrentRoute();

  // Public routes are resolved before auth loading so styleguide and
  // public profile pages remain accessible to signed-out visitors.
  if (
    route.section === ROUTE_SECTIONS.PUBLIC &&
    route.name !== ROUTE_NAMES.AUTH
  ) {
    return <PublicRoutes route={route} />;
  }

  const authFallback = <AuthLayout />;
  const appHomeRoute = { section: ROUTE_SECTIONS.APP, name: ROUTE_NAMES.APP_HOME };
  const authenticatedFallback = (
    <AppRouteBranch
      route={appHomeRoute}
      theme={theme}
      dataLoaded={dataLoaded}
      loadError={loadError}
      retryLoad={retryLoad}
      unauthenticatedFallback={authFallback}
    />
  );

  if (
    route.section === ROUTE_SECTIONS.PUBLIC &&
    route.name === ROUTE_NAMES.AUTH
  ) {
    return (
      <PublicRoutes
        route={route}
        authenticatedFallback={authenticatedFallback}
      />
    );
  }

  if (authLoading) {
    return (
      <div className={`loading-screen ${theme}`}>
        <div className="loading-pulse">
          <Logo size="lg" showTagline />
          <p style={{ marginTop: '16px', opacity: 0.5 }}>Loading...</p>
        </div>
      </div>
    );
  }

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

  if (route.section === ROUTE_SECTIONS.ADMIN) {
    return <AdminRouteBranch fallback={authenticatedFallback} />;
  }

  return (
    <AppRouteBranch
      route={route}
      theme={theme}
      dataLoaded={dataLoaded}
      loadError={loadError}
      retryLoad={retryLoad}
      unauthenticatedFallback={authFallback}
    />
  );
}
