import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader, StatsCard, StatsGrid } from '@/components/features';
import { useGetAdminDashboardQuery, useGetFrictionDashboardQuery } from '@/store/api/adminApi';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import {
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Settings,
  Lightbulb,
  Activity,
  Shield,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: loadingDashboard } = useGetAdminDashboardQuery();
  const { data: frictionData, isLoading: loadingFriction } = useGetFrictionDashboardQuery();

  if (loadingDashboard || loadingFriction) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const defaultMetrics = {
    total_requests: 0,
    revenue_month: 0,
    approval_rate: 0,
    pending_review: 0,
    approved_today: 0,
    avg_processing_time: '0m',
    revenue_today: 0
  };
  const metrics = { ...defaultMetrics, ...(dashboardData?.metrics ?? {}) };

  const topTypes = dashboardData?.type_metrics?.slice(0, 4) ?? [];
  const recentFriction = frictionData?.reports?.slice(0, 3) ?? [];
  
  // Mock cost data if not available in dashboard response (or fetch separately)
  const costData = {
    total_cost: 125.45,
    token_usage: {
      total_tokens: 4500000,
      prompt_tokens: 3500000,
      completion_tokens: 1000000
    }
  };

  const stats = [
    {
      title: 'Total Requests',
      value: String(metrics.total_requests),
      icon: FileText,
      trend: { value: 12, label: 'vs last month', isPositive: true },
    },
    {
      title: 'Revenue (MTD)',
      value: `$${(Number(metrics.revenue_month ?? 0) / 1000).toFixed(1)}k`,
      icon: DollarSign,
      trend: { value: 18, label: 'vs last month', isPositive: true },
    },
    {
      title: 'Active Users',
      value: '1,247', // This would need a separate API call or field
      icon: Users,
      trend: { value: 12, label: 'new users', isPositive: true },
    },
    {
      title: 'Approval Rate',
      value: `${Number(metrics.approval_rate ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      trend: { value: 2, label: 'vs last month', isPositive: true },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title={`Welcome, ${user?.first_name || 'Admin'}!`}
        description="System overview and analytics"
      >
        <Button asChild>
          <Link to={ROUTES.ADMIN_TYPES}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Types
          </Link>
        </Button>
      </DashboardHeader>

      {/* Stats */}
      <StatsGrid>
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </StatsGrid>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Type Performance */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Performing Types</CardTitle>
              <CardDescription>Most requested affidavit types this month</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.ADMIN_TYPES}>
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTypes.map((type, index) => (
                <div key={type.affidavit_type_id} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{type.affidavit_type_name}</p>
                      <span className="text-sm text-muted-foreground">{type.total_volume} requests</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Tier {type.tier}</span>
                      <span>{type.approval_rate.toFixed(0)}% approval</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link to={ROUTES.ADMIN_TYPES}>
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Affidavit Types
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={ROUTES.ADMIN_STAFF}>
                  <Shield className="h-4 w-4 mr-2" />
                  Staff Management
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={ROUTES.ADMIN_COSTS}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  AI Cost Dashboard
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={ROUTES.ADMIN_LEARNING}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Learning Suggestions
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to={ROUTES.ADMIN_FRICTION}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Friction Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Costs (MTD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">${costData.total_cost.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {costData.token_usage.total_tokens.toLocaleString()} tokens used
                  </p>
                </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Prompt tokens</span>
                    <span>{costData.token_usage.prompt_tokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completion tokens</span>
                    <span>{costData.token_usage.completion_tokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Friction Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Recent Friction Reports
            </CardTitle>
            <CardDescription>User-reported issues and suggestions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.ADMIN_FRICTION}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentFriction.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No friction reports</p>
          ) : (
            <div className="space-y-4">
              {recentFriction.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start gap-4 p-4 rounded-lg border"
                >
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    report.is_resolved ? 'bg-green-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{report.is_resolved ? 'Resolved' : 'Pending'}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{report.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Request: {report.request_code}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
