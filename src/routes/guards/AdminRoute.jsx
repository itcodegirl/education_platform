import { useAuth } from '../../providers';
import { GuardScreen } from './GuardScreen';

export function AdminRoute({
  children,
  fallback = null,
  loadingFallback = null,
}) {
  const { user, profile, loading, profileLoading } = useAuth();

  const isProfilePending = user && profileLoading;

  if (loading || isProfilePending) {
    return loadingFallback ?? <GuardScreen message="Checking admin access..." />;
  }

  if (!user) return fallback;
  if (profile?.is_disabled) return fallback;
  if (!profile?.is_admin) return fallback;

  return children;
}
