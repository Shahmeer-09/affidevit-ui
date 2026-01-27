import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardHeader } from '@/components/features';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetStampsQuery } from '@/store/api/commissionerApi';
import { Search, Download, FileText, Stamp, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { format, isWithinInterval, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export function CommissionerStampsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch stamps from API
  const { data: stampsData, isLoading, isError, refetch } = useGetStampsQuery({ page, pageSize });
  
  const stamps = stampsData?.results || [];
  const totalCount = stampsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Filter by search query
  const filteredStamps = stamps.filter(stamp => {
    const matchesSearch = stamp.request_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Filter by date
  const dateFilteredStamps = filteredStamps.filter(stamp => {
    if (dateFilter === 'all') return true;
    
    const stampDate = new Date(stamp.stamped_at);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return isWithinInterval(stampDate, {
          start: startOfDay(now),
          end: endOfDay(now),
        });
      case 'week':
        return isWithinInterval(stampDate, {
          start: startOfWeek(now),
          end: now,
        });
      case 'month':
        return isWithinInterval(stampDate, {
          start: startOfMonth(now),
          end: now,
        });
      case 'year':
        return isWithinInterval(stampDate, {
          start: startOfYear(now),
          end: now,
        });
      default:
        return true;
    }
  });

  // Calculate stats from current page data
  const stats = {
    total: totalCount,
    thisMonth: stamps.filter(s => {
      const date = new Date(s.stamped_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    thisWeek: stamps.filter(s => {
      const date = new Date(s.stamped_at);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }).length,
  };

  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load stamps</h3>
            <p className="text-muted-foreground mb-4">There was an error loading your stamp history.</p>
            <Button onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Stamp History"
        description="View your notarization records and history"
      >
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          Export Records
        </Button>
      </DashboardHeader>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stamp className="h-6 w-6 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.total}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Stamps</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                )}
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                )}
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by request code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stamps Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dateFilteredStamps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Stamp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No stamps found</p>
              <p className="text-sm">
                {stamps.length === 0 
                  ? 'Complete some requests to see your stamp history'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stamp #</TableHead>
                    <TableHead>Request Code</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Stamped At</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dateFilteredStamps.map((stamp) => (
                    <TableRow key={stamp.id}>
                      <TableCell className="font-mono font-medium">
                        #{stamp.id}
                      </TableCell>
                      <TableCell className="font-mono">
                        {stamp.request_code}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${stamp.payout_amount}
                      </TableCell>
                      <TableCell>
                        {format(new Date(stamp.stamped_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {stamp.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
