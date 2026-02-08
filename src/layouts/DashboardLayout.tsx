import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  History,
  ClipboardList,
  FileText,
  // DollarSign,
  // Lightbulb,
  // AlertTriangle,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GitBranch,
  Users,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useGetCommissionersQuery } from '@/store/api/adminApi';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type PortalType = 'commissioner' | 'reviewer' | 'admin';

interface DashboardLayoutProps {
  portal: PortalType;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navConfig: Record<PortalType, { title: string; items: NavItem[] }> = {
  commissioner: {
    title: 'Commissioner Portal',
    items: [
      { label: 'Lookup Request', href: ROUTES.COMMISSIONER_LOOKUP, icon: Search },
      { label: 'Stamp History', href: ROUTES.COMMISSIONER_STAMPS, icon: History },
      { label: 'Settings', href: ROUTES.COMMISSIONER_SETTINGS, icon: Settings },
    ],
  },
  reviewer: {
    title: 'Reviewer Portal',
    items: [
      { label: 'Dashboard', href: ROUTES.REVIEWER_DASHBOARD, icon: LayoutDashboard },
      { label: 'Review Queue', href: ROUTES.REVIEWER_QUEUE, icon: ClipboardList },
    ],
  },
  admin: {
    title: 'Admin Portal',
    items: [
      // { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
      { label: 'Affidavit Types', href: ROUTES.ADMIN_TYPES, icon: FileText },
      { label: 'Decision Tree', href: ROUTES.ADMIN_DECISION_TREE, icon: GitBranch },
      { label: 'AI Settings', href: ROUTES.ADMIN_AI_SETTINGS, icon: Sparkles },
      // { label: 'Cost Analytics', href: ROUTES.ADMIN_COSTS, icon: DollarSign },
      // { label: 'Learning Reports', href: ROUTES.ADMIN_LEARNING, icon: Lightbulb },
      // { label: 'Friction Reports', href: ROUTES.ADMIN_FRICTION, icon: AlertTriangle },
      { label: 'Reviewer Feedback', href: ROUTES.ADMIN_REVIEWER_FEEDBACK, icon: MessageSquare },
      { label: 'Staff Management', href: ROUTES.ADMIN_STAFF, icon: Users },
      { label: 'Support Tickets', href: ROUTES.ADMIN_SUPPORT, icon: MessageSquare },
      { label: 'Settings', href: ROUTES.ADMIN_SETTINGS, icon: Settings },
    ],
  },
};

export function DashboardLayout({ portal }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  // const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Fetch pending commissioners count for admin portal
  const { data: commissionersData } = useGetCommissionersQuery(
    { page: 1 },
    { skip: portal !== 'admin' }
  );
  
  // Count pending (not approved) commissioners
  const pendingCommissioners = commissionersData?.results?.filter(c => !c.is_featured).length || 0;

  const baseConfig = navConfig[portal];
  const config = {
    ...baseConfig,
    items:
      portal === 'admin' && !user?.is_superuser
        ? baseConfig.items.filter((item) => item.href !== ROUTES.ADMIN_DECISION_TREE)
        : baseConfig.items,
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const isActive = (href: string) => {
    // Exact match for dashboard, prefix match for others
    if (href.endsWith('dashboard') || href === location.pathname) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-muted/30">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300',
            collapsed ? 'w-16' : 'w-64'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
              {!collapsed && (
                <Link to={ROUTES.HOME} className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                    <FileText className="h-5 w-5 text-sidebar-primary-foreground" />
                  </div>
                  <span className="font-bold text-sm">{APP_NAME}</span>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            {/* Portal Title */}
            {!collapsed && (
              <div className="px-4 py-3 border-b border-sidebar-border">
                <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                  {config.title}
                </p>
              </div>
            )}

            {/* Navigation */}
            <ScrollArea className="flex-1 px-2 py-4">
              <nav className="space-y-1">
                {config.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const showBadge = item.href === ROUTES.ADMIN_STAFF && pendingCommissioners > 0;

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg mx-auto transition-colors relative',
                              active
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            {showBadge && (
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                              >
                                {pendingCommissioners}
                              </Badge>
                            )}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                          {showBadge && ` (${pendingCommissioners} pending)`}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {showBadge && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs">
                          {pendingCommissioners}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>

            {/* User Section */}
            <div className="border-t border-sidebar-border p-2">
              {/* Theme Toggle */}
              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={collapsed ? 'icon' : 'default'}
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={cn(
                      'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      collapsed ? 'h-10 w-10 mx-auto' : 'w-full justify-start gap-3'
                    )}
                  >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    {!collapsed && <span className="text-sm">Toggle Theme</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">Toggle Theme</TooltipContent>}
              </Tooltip> */}

              {/* User Info */}
              {user && !collapsed && (
                <div className="flex items-center gap-3 px-3 py-2 mt-1">
                  <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                    <span className="text-xs font-medium">{user.first_name[0]}{user.last_name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Logout */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={collapsed ? 'icon' : 'default'}
                    onClick={handleLogout}
                    className={cn(
                      'text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive',
                      collapsed ? 'h-10 w-10 mx-auto mt-1' : 'w-full justify-start gap-3 mt-1'
                    )}
                  >
                    <LogOut className="h-5 w-5" />
                    {!collapsed && <span className="text-sm">Sign Out</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
              </Tooltip>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            collapsed ? 'ml-16' : 'ml-64'
          )}
        >
          <div className="min-h-screen">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
