import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useGetReviewerFeedbackQuery } from '@/store/api/adminApi';
import type { ReviewerFeedbackLog } from '@/store/api/types/admin.types';
import { DashboardHeader } from '@/components/features';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const FEEDBACK_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'grammar', label: 'Grammar / Spelling' },
  { value: 'legal_error', label: 'Legal Error' },
  { value: 'missing_info', label: 'Missing Information' },
  { value: 'contradiction', label: 'Contradiction' },
  { value: 'formatting', label: 'Formatting Issue' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'other', label: 'Other' },
];

const PAGE_SIZE = 10;

export function AdminReviewerFeedbackPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<ReviewerFeedbackLog | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetReviewerFeedbackQuery({
    page,
    search: searchQuery || undefined,
    category: category !== 'all' ? category : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  const feedbackLogs = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const stats = useMemo(() => {
    const uniqueReviewers = new Set(feedbackLogs.map((log) => log.reviewer));
    const latestEntry = feedbackLogs[0]?.created_at;

    return {
      total: totalCount,
      uniqueReviewers: uniqueReviewers.size,
      latestEntry,
    };
  }, [feedbackLogs, totalCount]);

  const handleReset = () => {
    setSearchQuery('');
    setCategory('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
    refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Reviewer Feedback"
        description="Monitor short-form feedback left by reviewers to improve AI outputs"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Logs</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unique Reviewers</CardDescription>
            <CardTitle className="text-3xl">{stats.uniqueReviewers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest Entry</CardDescription>
            <CardTitle className="text-xl">
              {stats.latestEntry ? format(new Date(stats.latestEntry), 'PPpp') : 'N/A'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search feedback by request, reviewer, category or date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search request code, reviewer, or message"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              placeholder="Start date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              placeholder="End date"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Logs</CardTitle>
          <CardDescription>Latest reviewer feedback entries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full" />
              ))}
            </div>
          ) : feedbackLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No feedback entries found.
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Request</TableHead>
                      <TableHead className="min-w-[160px]">Reviewer</TableHead>
                      <TableHead className="min-w-[160px]">Category</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead className="min-w-[160px]">Submitted</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{log.request_code}</div>
                          <div className="text-xs text-muted-foreground">#{log.request}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.reviewer_name}</div>
                          <div className="text-xs text-muted-foreground">ID: {log.reviewer}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {log.category.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{log.message}</p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), 'PPpp')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelectedFeedback(log)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                </span>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <PaginationItem key={idx}>
                        <PaginationLink
                          onClick={() => setPage(idx + 1)}
                          isActive={idx + 1 === page}
                        >
                          {idx + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedFeedback)} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Request {selectedFeedback?.request_code} ·{' '}
              {selectedFeedback && format(new Date(selectedFeedback.created_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Reviewer</p>
                <p className="font-medium">{selectedFeedback.reviewer_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Category</p>
                <Badge variant="outline" className="capitalize">
                  {selectedFeedback.category.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">Feedback</p>
                <p className="text-sm whitespace-pre-line">{selectedFeedback.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
