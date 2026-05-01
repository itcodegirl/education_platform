import { useAuth } from '../../providers';
import { GuardScreen } from './GuardScreen';

export function AdminRoute({
  children,
  fallback = null,
  loadingFallback = null,
}) {
<<<<<<< HEAD
  const { user, profile, loading } = useAuth();

  const isProfilePending = user && profile === null;
=======
  const { user, profile, loading, profileLoading } = useAuth();

  const isProfilePending = user && profileLoading;
>>>>>>> origin/main

  if (loading || isProfilePending) {
    return loadingFallback ?? <GuardScreen message="Checking admin access..." />;
  }

  if (!user) return fallback;
  if (profile?.is_disabled) return fallback;
  if (!profile?.is_admin) return fallback;

  return children;
}
