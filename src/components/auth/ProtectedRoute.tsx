import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/lib/constants';
import type { UserRole } from '@/types';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole | UserRole[];
  requireSuperuser?: boolean;
}

export function ProtectedRoute({ children, requiredRoles, requireSuperuser }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    // Redirect to home if user doesn't have required role
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (requireSuperuser && !user?.is_superuser) {
    return <Navigate to={ROUTES.ADMIN_TYPES} replace />;
  }

  return <>{children}</>;
}
