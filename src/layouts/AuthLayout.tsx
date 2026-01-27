import { Outlet, Link, Navigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES, APP_NAME } from '@/lib/constants';

export function AuthLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Redirect if already authenticated
  if (!isLoading && isAuthenticated && user) {
    // Redirect based on role
    switch (user.role) {
      case 'admin':
        return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
      case 'reviewer':
        return <Navigate to={ROUTES.REVIEWER_DASHBOARD} replace />;
      case 'commissioner':
        return <Navigate to={ROUTES.COMMISSIONER_DASHBOARD} replace />;
      default:
        return <Navigate to={ROUTES.MY_REQUESTS} replace />;
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </Link>
          
          <h1 className="text-4xl font-bold mb-4">
            Professional Legal Documents,<br />Made Simple
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Create legally binding affidavits in minutes with our AI-powered platform. 
            Fast, accurate, and professionally reviewed.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm text-primary-foreground/70">Documents Created</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-sm text-primary-foreground/70">Approval Rate</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">10min</div>
              <div className="text-sm text-primary-foreground/70">Average Time</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm text-primary-foreground/70">Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">{APP_NAME}</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
