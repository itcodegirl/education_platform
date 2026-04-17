import { useAuth } from '../../providers';
import { GuardScreen } from './GuardScreen';

export function ProtectedRoute({
  children,
  fallback = null,
  loadingFallback = null,
  requireProfile = true,
  allowDisabled = false,
}) {
  const { user, profile, loading } = useAuth();

  const isProfilePending = user && requireProfile && profile === null;

  if (loading || isProfilePending) {
    return loadingFallback ?? <GuardScreen message="Checking access..." />;
  }

  if (!user) return fallback;
  if (!allowDisabled && profile?.is_disabled) return fallback;

  return children;
}
