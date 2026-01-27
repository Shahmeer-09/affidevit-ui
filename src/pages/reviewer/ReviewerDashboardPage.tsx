import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader, StatsCard, StatsGrid } from '@/components/features';
import { useGetReviewQueueQuery, useGetReviewerStatsQuery } from '@/store/api/reviewerApi';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  FileCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export function ReviewerDashboardPage() {
  const { user } = useAuth();
  
  // Fetch queue with 30 second polling
  const {
    data: queue = [],
    isLoading: queueLoading,
    refetch: refetchQueue,
    isFetching: queueFetching,
  } = useGetReviewQueueQuery(undefined, {
    pollingInterval: 30000,
  });
  
  // Fetch stats with 60 second polling
  const {
    data: stats,
    isLoading: statsLoading,
  } = useGetReviewerStatsQuery(undefined, {
    pollingInterval: 60000,
  });

  const pendingReviews = queue.slice(0, 5);
  const priorityItems = queue.filter((r) => r.risk_flags.length > 0).slice(0, 3);

  const dashboardStats = [
    {
      title: 'Pending Reviews',
      value: statsLoading ? '...' : String(stats?.pending_count ?? queue.length),
      icon: Eye,
      description: 'Awaiting your review',
    },
    {
      title: 'Reviewed Today',
      value: statsLoading ? '...' : String(stats?.reviewed_today ?? 0),
      icon: CheckCircle,
    },
    {
      title: 'Avg Review Time',
      value: statsLoading ? '...' : `${stats?.avg_review_time_minutes ?? 0}m`,
      icon: Clock,
    },
    {
      title: 'Approval Rate',
      value: statsLoading ? '...' : `${stats?.approval_rate ?? 100}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title={`Welcome, ${user?.first_name || 'Reviewer'}!`}
        description="Review queue and performance overview"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchQueue()}
            disabled={queueFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${queueFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link to={ROUTES.REVIEWER_QUEUE}>
              <Eye className="h-4 w-4 mr-2" />
              View Queue
            </Link>
          </Button>
        </div>
      </DashboardHeader>

      {/* Stats */}
      <StatsGrid>
        {dashboardStats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
          />
        ))}
      </StatsGrid>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Review Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>Affidavits waiting for QA review</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.REVIEWER_QUEUE}>
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending reviews</p>
                <p className="text-sm">Great job! The queue is empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((item) => {
                  const hasFlags = item.risk_flags.length > 0;
                  return (
                    <Link
                      key={item.id}
                      to={ROUTES.REVIEWER_DETAIL.replace(':id', String(item.id))}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              hasFlags
                                ? 'bg-amber-100 dark:bg-amber-900'
                                : 'bg-blue-100 dark:bg-blue-900'
                            }`}
                          >
                            {hasFlags ? (
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                            ) : (
                              <FileCheck className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-medium">{item.request_code}</p>
                              {hasFlags && (
                                <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                                  {item.risk_flags.length} flag{item.risk_flags.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.affidavit_type_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">Wait: {item.time_waiting}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Priority Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Flagged Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {priorityItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm">{item.request_code}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.risk_flags.length} flag{item.risk_flags.length > 1 ? 's' : ''} • {item.time_waiting} wait
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={ROUTES.REVIEWER_DETAIL.replace(':id', String(item.id))}>
                          Review
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {priorityItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No flagged items
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reviewed</span>
                    <span className="font-bold text-lg">{stats?.reviewed_today ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Approved</span>
                    <span className="font-bold text-lg text-green-600">{stats?.approved_today ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rejected</span>
                    <span className="font-bold text-lg text-red-600">{stats?.rejected_today ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Clarifications</span>
                    <span className="font-bold text-lg text-amber-600">{stats?.clarification_today ?? 0}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
