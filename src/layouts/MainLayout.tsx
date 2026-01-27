import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, Menu, User, LogOut, ChevronDown, Search, Stamp, ClipboardCheck, LayoutDashboard, Users, BookOpen, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { useState } from 'react';

// Role-based navigation configuration
const getRoleNavigation = (role: string | undefined) => {
  switch (role) {
    case 'admin':
      return [
        { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
        { label: 'Affidavit Types', href: ROUTES.ADMIN_TYPES, icon: FileText },
        { label: 'Users', href: ROUTES.ADMIN_USERS, icon: Users },
        { label: 'Costs', href: ROUTES.ADMIN_COSTS, icon: DollarSign },
        { label: 'Learning', href: ROUTES.ADMIN_LEARNING, icon: BookOpen },
        { label: 'Friction Reports', href: ROUTES.ADMIN_FRICTION, icon: AlertTriangle },
      ];
    case 'reviewer':
      return [
        { label: 'Dashboard', href: ROUTES.REVIEWER_DASHBOARD, icon: LayoutDashboard },
        { label: 'Review Queue', href: ROUTES.REVIEWER_QUEUE, icon: ClipboardCheck },
      ];
    case 'commissioner':
      return [
        { label: 'Dashboard', href: ROUTES.COMMISSIONER_DASHBOARD, icon: LayoutDashboard },
        { label: 'Lookup Request', href: ROUTES.COMMISSIONER_LOOKUP, icon: Search },
        { label: 'My Stamps', href: ROUTES.COMMISSIONER_STAMPS, icon: Stamp },
      ];
    default:
      return [
        { label: 'My Requests', href: ROUTES.MY_REQUESTS, icon: FileText },
        { label: 'New Request', href: ROUTES.AFFIDAVIT_TYPES, icon: Search },
      ];
  }
};

export function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLandingPage = location.pathname === ROUTES.HOME;

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  // On landing page, show only Dashboard for admin/staff, otherwise show full navigation
  const roleNavigation = (isLandingPage && user?.role === 'admin') 
    ? [{ label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard }]
    : (isLandingPage && user?.role === 'reviewer')
    ? [{ label: 'Dashboard', href: ROUTES.REVIEWER_DASHBOARD, icon: LayoutDashboard }]
    : (isLandingPage && user?.role === 'commissioner')
    ? [{ label: 'Dashboard', href: ROUTES.COMMISSIONER_DASHBOARD, icon: LayoutDashboard }]
    : getRoleNavigation(user?.role);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - Minimalist */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-primary hidden sm:inline-block">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Navigation - Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {/* Role-based navigation links */}
            {isAuthenticated && user && (
              <nav className="flex items-center gap-1">
                {roleNavigation.map((item) => (
                  <Button key={item.href} variant="ghost" size="sm" asChild>
                    <Link to={item.href} className="flex items-center gap-1.5">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </nav>
            )}

            {!isAuthenticated && (
              <Button variant="outline" size="sm" asChild>
                <Link to={ROUTES.AFFIDAVIT_TYPES} className="flex items-center gap-1.5">
                  <Search className="h-4 w-4" />
                  Browse Affidavits
                </Link>
              </Button>
            )}

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span>{user.first_name}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-primary capitalize">{user.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.PROFILE}>Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild>
                <Link to={ROUTES.LOGIN}>Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-2 mt-8">
                {isAuthenticated && user ? (
                  <>
                    {/* User info */}
                    <div className="px-2 py-3 mb-2 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-primary capitalize">{user.role}</p>
                    </div>
                    
                    {/* Role-based navigation */}
                    {roleNavigation.map((item) => (
                      <Link 
                        key={item.href}
                        to={item.href} 
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    
                    <hr className="my-2" />
                    
                    <Link to={ROUTES.PROFILE} onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <User className="h-4 w-4" />
                        Profile Settings
                      </Button>
                    </Link>
                    <Button variant="destructive" onClick={handleLogout} className="w-full mt-2">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link 
                      to={ROUTES.AFFIDAVIT_TYPES}
                      onClick={() => setMobileOpen(false)}
                      className="text-base font-medium py-2 flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Browse Affidavits
                    </Link>
                    <hr className="my-2" />
                    <Link to={ROUTES.LOGIN} onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link to={ROUTES.REGISTER} onClick={() => setMobileOpen(false)}>
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer - Professional */}
      <footer className="border-t bg-primary text-primary-foreground">
        <div className="container py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5" />
                <span className="font-bold">{APP_NAME}</span>
              </div>
              <p className="text-sm text-primary-foreground/70">
                Official affidavit preparation service for Trinidad & Tobago. 
                Secure, fast, and Commissioner-ready.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
                <Link to={ROUTES.AFFIDAVIT_TYPES} className="hover:text-primary-foreground">Affidavit Types</Link>
                <Link to={ROUTES.DECISION_TREE} className="hover:text-primary-foreground">Help Me Choose</Link>
                <Link to={ROUTES.MY_REQUESTS} className="hover:text-primary-foreground">Track My Request</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
                <Link to="#" className="hover:text-primary-foreground">Privacy Policy</Link>
                <Link to="#" className="hover:text-primary-foreground">Terms of Service</Link>
                <Link to="#" className="hover:text-primary-foreground">Contact Us</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-sm text-primary-foreground/60">
            <p>© {new Date().getFullYear()} {APP_NAME}. Made for Trinidad & Tobago.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
