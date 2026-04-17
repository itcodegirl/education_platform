import { useAuth } from '../../providers';
import { GuardScreen } from './GuardScreen';

export function PublicOnlyRoute({
  children,
  fallback = null,
  loadingFallback = null,
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return loadingFallback ?? <GuardScreen message="Loading..." />;
  }

  if (user) return fallback;

  return children;
}
