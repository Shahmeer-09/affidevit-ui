import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHeader, StatusBadge } from '@/components/features';
import type { RequestStatus } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  useGetTypeRequestsQuery,
  useGetAdminAffidavitTypeQuery,
  type TypeRequestItem,
} from '@/store/api/adminApi';
import { ROUTES, API_BASE_URL } from '@/lib/constants';
import {
  Search,
  ArrowLeft,
  FileText,
  Download,
  Eye,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'needs_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed (Notarized)' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'needs_clarification', label: 'Needs Clarification' },
];

export function AdminTypeRequestsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const typeId = parseInt(id || '0', 10);
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<TypeRequestItem | null>(null);
  const [viewMode, setViewMode] = useState<'rejection' | 'friction' | 'preview' | null>(null);
  
  // Queries
  const { data: typeData, isLoading: typeLoading } = useGetAdminAffidavitTypeQuery(typeId, { skip: !typeId });
  const { 
    data: requestsData, 
    isLoading: requestsLoading, 
    isError,
    refetch 
  } = useGetTypeRequestsQuery(
    { typeId, status: statusFilter, page, search: searchQuery },
    { skip: !typeId }
  );
  
  const requests = requestsData?.results || [];
  const totalCount = requestsData?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);
  
  // Handle PDF download
  const handleDownloadPDF = async (requestId: number, requestCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/pdf/`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${requestCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };
  
  // View rejection details
  const handleViewRejection = (request: TypeRequestItem) => {
    setSelectedRequest(request);
    setViewMode('rejection');
  };
  
  // View friction reports
  const handleViewFriction = (request: TypeRequestItem) => {
    setSelectedRequest(request);
    setViewMode('friction');
  };
  
  // View draft preview
  const handleViewPreview = (request: TypeRequestItem) => {
    setSelectedRequest(request);
    setViewMode('preview');
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setViewMode(null);
  };
  
  // Stats
  const stats = {
    total: totalCount,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };
  
  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load requests</h3>
            <p className="text-muted-foreground mb-4">Please try again later</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.ADMIN_TYPES)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <DashboardHeader
          title={typeLoading ? 'Loading...' : `${typeData?.name || 'Unknown Type'} - Generated Affidavits`}
          description="View all affidavits generated for this type"
        />
      </div>
      
      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requestsLoading ? '-' : stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requestsLoading ? '-' : stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requestsLoading ? '-' : stats.completed}</p>
                <p className="text-sm text-muted-foreground">Notarized</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requestsLoading ? '-' : stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
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
                placeholder="Search by request code or user..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Requests Table */}
      <Card>
        <CardContent className="pt-6">
          {requestsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No affidavits have been generated for this type yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Code</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commissioner</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <span className="font-mono font-medium">{request.request_code}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {request.user.first_name} {request.user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{request.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.status as RequestStatus} />
                      </TableCell>
                      <TableCell>
                        {request.commissioner ? (
                          <span className="text-sm">
                            {request.commissioner.first_name} {request.commissioner.last_name}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.is_paid ? 'default' : 'secondary'}>
                          {request.is_paid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {/* Preview Button */}
                          {(request.draft_text || request.final_text) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPreview(request)}
                              title="Preview Draft"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Download PDF Button - only for approved/completed */}
                          {['approved', 'completed'].includes(request.status) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPDF(request.id, request.request_code)}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Rejection Reason Button - for rejected */}
                          {request.status === 'rejected' && request.reviewer_rejection && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewRejection(request)}
                              title="View Rejection Reason"
                              className="text-red-500 hover:text-red-600"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Friction Reports Button */}
                          {request.friction_reports && request.friction_reports.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewFriction(request)}
                              title={`View ${request.friction_reports.length} Friction Report(s)`}
                              className="text-amber-500 hover:text-amber-600"
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span className="sr-only">{request.friction_reports.length}</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(Math.max(1, page - 1))}
                          className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
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
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
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
      
      {/* Rejection Details Dialog */}
      <Dialog open={viewMode === 'rejection' && !!selectedRequest} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Rejection Details
            </DialogTitle>
            <DialogDescription>
              Request {selectedRequest?.request_code} was rejected by a reviewer
            </DialogDescription>
          </DialogHeader>
          {selectedRequest?.reviewer_rejection && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected By</p>
                <p className="font-medium">{selectedRequest.reviewer_rejection.reviewer}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejection Reason</p>
                <p className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  {selectedRequest.reviewer_rejection.reason}
                </p>
              </div>
              {selectedRequest.reviewer_rejection.timestamp && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected At</p>
                  <p>{format(new Date(selectedRequest.reviewer_rejection.timestamp), 'PPpp')}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Friction Reports Dialog */}
      <Dialog open={viewMode === 'friction' && !!selectedRequest} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <MessageSquare className="h-5 w-5" />
              Commissioner Friction Reports
            </DialogTitle>
            <DialogDescription>
              Request {selectedRequest?.request_code} has {selectedRequest?.friction_reports?.length || 0} friction report(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedRequest?.friction_reports?.map((report) => (
              <Card key={report.id} className={report.is_resolved ? 'border-green-200' : 'border-amber-200'}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{report.commissioner}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), 'PPpp')}
                      </p>
                    </div>
                    <Badge variant={report.is_resolved ? 'default' : 'outline'}>
                      {report.is_resolved ? 'Resolved' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Reason</p>
                    <p>{report.reason}</p>
                  </div>
                  {report.is_resolved && report.resolution_notes && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm font-medium text-green-600 mb-1">Resolution Notes</p>
                      <p className="text-sm">{report.resolution_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Draft Preview Dialog */}
      <Dialog open={viewMode === 'preview' && !!selectedRequest} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Draft Preview - {selectedRequest?.request_code}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.final_text ? 'Final approved version' : 'AI-generated draft'}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-white dark:bg-gray-900 rounded-lg border">
            <div 
              className="document-preview prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: selectedRequest?.final_text || selectedRequest?.draft_text || '<p>No draft available</p>' 
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
