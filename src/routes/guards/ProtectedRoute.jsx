import { useAuth } from '../../providers';
import { GuardScreen } from './GuardScreen';

export function ProtectedRoute({
  children,
  fallback = null,
  loadingFallback = null,
  requireProfile = true,
  allowDisabled = false,
}) {
  const { user, profile, loading, profileLoading } = useAuth();

  const isProfilePending = user && requireProfile && profileLoading;

  if (loading || isProfilePending) {
    return loadingFallback ?? <GuardScreen message="Checking access..." />;
  }

  if (!user) return fallback;
  if (!allowDisabled && profile?.is_disabled) {
    return (
      <div className="eb-screen">
        <div className="eb-card">
          <span className="eb-icon" aria-hidden="true">🔒</span>
          <h2 className="eb-title">Account disabled</h2>
          <p className="eb-msg">
            Your account has been disabled. Please contact{' '}
            <a href="mailto:hello@codeherway.com">hello@codeherway.com</a> for help.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
