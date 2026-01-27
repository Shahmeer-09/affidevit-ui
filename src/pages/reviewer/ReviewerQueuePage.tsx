import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/features';
import { useGetReviewQueueQuery } from '@/store/api/reviewerApi';
import { ROUTES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  AlertTriangle,
  FileCheck,
  Clock,
  ArrowRight,
  SortAsc,
  SortDesc,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

type SortField = 'waitTime' | 'date' | 'flags';
type SortOrder = 'asc' | 'desc';

// Helper to parse wait time string (e.g., "4h", "2d", "30 min") to minutes
function parseWaitTimeToMinutes(waitTime: string): number {
  const lower = waitTime.toLowerCase();
  const num = parseInt(lower, 10) || 0;
  if (lower.includes('d')) return num * 24 * 60;
  if (lower.includes('h')) return num * 60;
  if (lower.includes('min')) return num;
  return num;
}

export function ReviewerQueuePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [flagFilter, setFlagFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('waitTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Fetch review queue with 30 second polling
  const {
    data: queue = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetReviewQueueQuery(undefined, {
    pollingInterval: 30000, // 30 seconds
  });

  // Filter and sort queue
  const filteredQueue = useMemo(() => {
    let result = queue.filter((item) => {
      const matchesSearch =
        item.request_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.affidavit_type_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const hasFlags = item.risk_flags.length > 0;
      const matchesFlags =
        flagFilter === 'all' ||
        (flagFilter === 'flagged' && hasFlags) ||
        (flagFilter === 'clean' && !hasFlags);

      return matchesSearch && matchesFlags;
    });

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'waitTime':
          comparison = parseWaitTimeToMinutes(a.time_waiting) - parseWaitTimeToMinutes(b.time_waiting);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'flags':
          comparison = a.risk_flags.length - b.risk_flags.length;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [queue, searchQuery, flagFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const priorityCount = queue.filter((r) => r.risk_flags.length > 0).length;

  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to Load Queue</h2>
            <p className="text-muted-foreground mb-4">
              Unable to fetch the review queue. Please try again.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Review Queue"
        description={isLoading ? 'Loading...' : `${queue.length} items pending review`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </DashboardHeader>

      {/* Priority Alert */}
      {priorityCount > 0 && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">
                  {priorityCount} item{priorityCount > 1 ? 's' : ''} have QA flags
                </p>
                <p className="text-sm text-muted-foreground">
                  These may need careful review due to AI-detected issues
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={flagFilter} onValueChange={setFlagFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by flags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="flagged">With QA Flags</SelectItem>
                <SelectItem value="clean">No Flags</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort buttons */}
          <div className="flex gap-2 mt-4">
            <span className="text-sm text-muted-foreground self-center">Sort by:</span>
            <Button
              variant={sortField === 'waitTime' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleSort('waitTime')}
            >
              Wait Time
              {sortField === 'waitTime' && (
                sortOrder === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
              )}
            </Button>
            <Button
              variant={sortField === 'date' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleSort('date')}
            >
              Date
              {sortField === 'date' && (
                sortOrder === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
              )}
            </Button>
            <Button
              variant={sortField === 'flags' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleSort('flags')}
            >
              Flags
              {sortField === 'flags' && (
                sortOrder === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredQueue.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="font-medium">No items in queue</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || flagFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'All reviews are complete!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQueue.map((item) => {
            const hasFlags = item.risk_flags.length > 0;
            return (
              <Card
                key={item.id}
                className={`transition-all hover:shadow-md ${
                  hasFlags ? 'border-amber-500/50' : ''
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          hasFlags
                            ? 'bg-amber-100 dark:bg-amber-900'
                            : 'bg-blue-100 dark:bg-blue-900'
                        }`}
                      >
                        {hasFlags ? (
                          <AlertTriangle className="h-6 w-6 text-amber-600" />
                        ) : (
                          <FileCheck className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono font-semibold">{item.request_code}</p>
                          {hasFlags && (
                            <Badge variant="outline" className="border-amber-500 text-amber-600">
                              {item.risk_flags.length} Flag{item.risk_flags.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{item.affidavit_type_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Waiting: {item.time_waiting}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:block text-right">
                        <p className="text-xs text-muted-foreground mb-1">Wait Time</p>
                        <p className="text-sm font-medium">{item.time_waiting}</p>
                      </div>
                      <Button asChild>
                        <Link to={ROUTES.REVIEWER_DETAIL.replace(':id', String(item.id))}>
                          Review
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {/* Show risk flags if present */}
                  {hasFlags && (
                    <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                      {item.risk_flags.map((flag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {flag.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
