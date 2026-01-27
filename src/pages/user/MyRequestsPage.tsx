import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader, RequestCard, ClarificationDialog } from '@/components/features';
import { useGetMyRequestsQuery, useDeleteRequestMutation } from '@/store/api/userApi';
import { ROUTES } from '@/lib/constants';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Request } from '@/types';

const PAGE_SIZE = 10;

const statusFilters: { label: string; statuses: string[] }[] = [
  { label: 'All', statuses: [] },
  { label: 'In Progress', statuses: ['DRAFT', 'SUBMITTED', 'PROCESSING', 'NEEDS_REVIEW', 'NEEDS_CLARIFICATION'] },
  { label: 'Completed', statuses: ['APPROVED', 'COMPLETED'] },
];

export function MyRequestsPage() {
  const [activeFilter, setActiveFilter] = useState(0);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  
  const { data, isLoading, error, refetch } = useGetMyRequestsQuery({ page: 1, pageSize: 100 });
  const [deleteRequest, { isLoading: isDeleting }] = useDeleteRequestMutation();

  // Clarification Dialog State - TODO: Hook up when user clicks "Respond" on a clarification request
  const [selectedRequest, _setSelectedRequest] = useState<Request | null>(null);
  const [clarificationOpen, setClarificationOpen] = useState(false);

  const userRequests = data?.results || [];
  
  // Filter with case-insensitive status comparison
  const filteredRequests = useMemo(() => {
    return activeFilter === 0
      ? userRequests
      : userRequests.filter((r: Request) => 
          statusFilters[activeFilter].statuses.includes(r.status?.toUpperCase())
        );
  }, [activeFilter, userRequests]);

  // Pagination: only show displayCount items
  const displayedRequests = filteredRequests.slice(0, displayCount);
  const hasMore = displayCount < filteredRequests.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  };

  const handleDeleteRequest = async (requestId: number) => {
    try {
      const request = userRequests.find(r => r.id === requestId);
      if (request && request.affidavit_type) {
        const typeId = typeof request.affidavit_type === 'object' 
          ? (request.affidavit_type as any).id 
          : request.affidavit_type;
        
        if (typeId) {
          localStorage.removeItem(`draft_${typeId}`);
        }
      }

      await deleteRequest(requestId).unwrap();
      toast.success('Request deleted successfully');
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      toast.error(error?.data?.error || 'Failed to delete the request. Please try again.');
    }
  };

  // Reset display count when filter changes
  const handleFilterChange = (index: number) => {
    setActiveFilter(index);
    setDisplayCount(PAGE_SIZE);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Failed to load requests. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <PageHeader
        title="My Requests"
        description="View and manage your affidavit requests"
      >
        <Button asChild>
          <Link to={ROUTES.AFFIDAVIT_TYPES}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {statusFilters.map((filter, index) => (
          <Button
            key={filter.label}
            variant={activeFilter === index ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(index)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Request List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
            <p className="text-muted-foreground mb-6">
              {activeFilter === 0
                ? "You haven't created any affidavit requests yet."
                : "No requests match the selected filter."}
            </p>
            <Button asChild>
              <Link to={ROUTES.AFFIDAVIT_TYPES}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedRequests.map((request) => (
              <RequestCard 
                key={request.id} 
                request={request} 
                onDelete={handleDeleteRequest}
                isDeleting={isDeleting}
              />
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                className="min-w-50"
              >
                Load More ({filteredRequests.length - displayCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      <ClarificationDialog
        open={clarificationOpen}
        onOpenChange={setClarificationOpen}
        request={selectedRequest}
        onSuccess={refetch}
      />
    </div>
  );
}
