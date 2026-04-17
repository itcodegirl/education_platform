import { lazy, Suspense } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminRoute } from './guards/AdminRoute';
import { GuardScreen } from './guards/GuardScreen';
import { closeHashRoute } from './routeState';

const AdminDashboard = lazy(() =>
  import('../components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);

export function AdminRouteBranch({ fallback = null }) {
  return (
    <AdminRoute
      fallback={fallback}
      loadingFallback={<GuardScreen message="Checking admin access..." />}
    >
      <AdminLayout>
        <Suspense fallback={<GuardScreen message="Loading admin..." />}>
          <AdminDashboard onClose={closeHashRoute} />
        </Suspense>
      </AdminLayout>
    </AdminRoute>
  );
}
