import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useGetReviewRequestQuery,
  useGetReviewQueueQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
} from '@/store/api/reviewerApi';
import { ROUTES, API_BASE_URL } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Edit3,
  Eye,
  Save,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Issue types for tracking edits
const ISSUE_TYPES = [
  { value: 'grammar', label: 'Grammar/Spelling' },
  { value: 'factual', label: 'Factual Error' },
  { value: 'formatting', label: 'Formatting Issue' },
  { value: 'legal', label: 'Legal Language' },
  { value: 'missing_info', label: 'Missing Information' },
  { value: 'other', label: 'Other' },
];

export function ReviewerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [issueType, setIssueType] = useState('other');
  const [issueDescription, setIssueDescription] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Fetch request details
  const {
    data: request,
    isLoading,
    isError,
  } = useGetReviewRequestQuery(Number(id), {
    skip: !id,
  });

  // Fetch queue for navigation
  const { data: queue = [] } = useGetReviewQueueQuery();

  // Mutations
  const [approveRequest, { isLoading: isApproving }] = useApproveRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectRequestMutation();

  // Find current position in queue for navigation
  const currentIndex = queue.findIndex((r) => r.id === Number(id));
  const nextItem = queue[currentIndex + 1];
  const prevItem = queue[currentIndex - 1];

  // Initialize edited text when request loads
  useEffect(() => {
    if (request?.draft_text) {
      setEditedText(request.draft_text);
    }
  }, [request?.draft_text]);

  // Review checklist
  const reviewChecklist = [
    { id: 'names', label: 'All names are correctly spelled' },
    { id: 'dates', label: 'Dates are accurate and formatted correctly' },
    { id: 'addresses', label: 'Addresses are complete and valid' },
    { id: 'legal', label: 'Legal language is appropriate for the affidavit type' },
    { id: 'signatures', label: 'Signature blocks are properly placed' },
    { id: 'facts', label: 'Stated facts are consistent throughout' },
  ];

  const allChecked = checkedItems.length === reviewChecklist.length;
  const hasEdits = editedText !== request?.draft_text;

  const handleCheckItem = (itemId: string) => {
    setCheckedItems((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  };

  const handleApprove = async () => {
    if (!request) return;

    try {
      await approveRequest({
        request_id: request.id,
        final_text: hasEdits ? editedText : undefined,
        issue_type: hasEdits ? issueType : undefined,
        issue_description: hasEdits ? issueDescription : undefined,
      }).unwrap();

      toast({
        title: 'Request Approved',
        description: 'The affidavit has been approved and the user has been notified.',
      });

      // Navigate to next item or back to queue
      if (nextItem) {
        navigate(ROUTES.REVIEWER_DETAIL.replace(':id', String(nextItem.id)));
      } else {
        navigate(ROUTES.REVIEWER_QUEUE);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve the request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!request || !rejectReason.trim()) return;

    try {
      await rejectRequest({
        request_id: request.id,
        reason: rejectReason,
      }).unwrap();

      toast({
        title: 'Request Rejected',
        description: 'The request has been rejected.',
      });

      setRejectDialogOpen(false);
      setRejectReason('');

      // Navigate to next item or back to queue
      if (nextItem) {
        navigate(ROUTES.REVIEWER_DETAIL.replace(':id', String(nextItem.id)));
      } else {
        navigate(ROUTES.REVIEWER_QUEUE);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject the request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Calculate approval readiness - reviewer just needs to complete checklist
  const canApprove = allChecked;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return; // Don't navigate when typing
      }
      
      if (e.key === 'ArrowRight' && nextItem) {
        navigate(ROUTES.REVIEWER_DETAIL.replace(':id', String(nextItem.id)));
      } else if (e.key === 'ArrowLeft' && prevItem) {
        navigate(ROUTES.REVIEWER_DETAIL.replace(':id', String(prevItem.id)));
      } else if (e.key === 'a' && canApprove && !isApproving) {
        handleApprove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextItem, prevItem, navigate, canApprove, isApproving]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Review Item Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This item may have already been reviewed or doesn't exist.
            </p>
            <Button asChild>
              <Link to={ROUTES.REVIEWER_QUEUE}>Back to Queue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(ROUTES.REVIEWER_QUEUE)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Queue
        </Button>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {queue.length}
            </span>
          )}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={!prevItem}
              onClick={() => prevItem && navigate(ROUTES.REVIEWER_DETAIL.replace(':id', String(prevItem.id)))}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!nextItem}
              onClick={() => nextItem && navigate(ROUTES.REVIEWER_DETAIL.replace(':id', String(nextItem.id)))}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* User Information Card */}
      {request.user && (
        <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-3">Requester Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">
                        {`${request.user.first_name} ${request.user.last_name}`.trim() || request.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{request.user.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{request.user.phone_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardDescription className="font-mono text-base">
                    {request.request_code}
                  </CardDescription>
                  <CardTitle className="text-2xl mt-1">
                    {request.affidavit_type?.name || 'Affidavit'}
                  </CardTitle>
                </div>
                <Badge variant={request.status === 'needs_review' ? 'default' : 'secondary'}>
                  {request.status?.replace(/_/g, ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Created {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </span>
                {request.submitted_at && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(request.submitted_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Preview & Editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={isEditing ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="document" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="document">Document Preview</TabsTrigger>
                  <TabsTrigger value="pdf">PDF Preview</TabsTrigger>
                  <TabsTrigger value="answers">User Answers</TabsTrigger>
                </TabsList>

                <TabsContent value="document">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="min-h-[500px] font-mono text-sm"
                        placeholder="Document text..."
                      />
                      {hasEdits && (
                        <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
                          <CardContent className="py-4 space-y-4">
                            <div className="flex items-center gap-2">
                              <Save className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">Document has been edited</span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Issue Type</Label>
                                <Select value={issueType} onValueChange={setIssueType}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ISSUE_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Issue Description (optional)</Label>
                                <Textarea
                                  value={issueDescription}
                                  onChange={(e) => setIssueDescription(e.target.value)}
                                  placeholder="Describe the issue..."
                                  rows={2}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="bg-white dark:bg-gray-900 border rounded-lg p-8 min-h-[500px] prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: request.draft_text 
                          ? request.draft_text
                              // Convert markdown-style formatting to HTML if needed
                              .replace(/\n\n/g, '</p><p>')
                              .replace(/\n/g, '<br/>')
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.+?)\*/g, '<em>$1</em>')
                          : '<p class="text-muted-foreground">No document text available.</p>' 
                      }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="pdf">
                  <div className="bg-muted rounded-lg overflow-hidden" style={{ height: '600px' }}>
                    {request.pdf_file || request.pdf_url ? (
                      <iframe
                        src={`${API_BASE_URL}/requests/${request.id}/pdf/`}
                        className="w-full h-full border-0"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="font-medium">PDF Not Generated Yet</p>
                          <p className="text-sm">PDF will be generated after approval</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="answers">
                  <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                    {request.answers_json && Object.entries(request.answers_json).length > 0 ? (
                      Object.entries(request.answers_json).map(([key, value]) => (
                        <div key={key} className="border-b pb-3 last:border-0">
                          <p className="text-sm font-medium text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="mt-1">{String(value)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No answers available.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                disabled={!canApprove || isApproving}
                onClick={handleApprove}
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {hasEdits ? 'Approve with Edits' : 'Approve'}
              </Button>

              <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Document</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for rejection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Rejection Reason</Label>
                      <Textarea
                        placeholder="Explain why this document is being rejected..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || isRejecting}
                    >
                      {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Confirm Rejection
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {!canApprove && (
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  {!allChecked && <p>✓ Complete all checklist items</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Review Checklist</CardTitle>
              <CardDescription>Verify each item before approving</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviewChecklist.map((checkItem) => (
                  <div key={checkItem.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={checkItem.id}
                      checked={checkedItems.includes(checkItem.id)}
                      onCheckedChange={() => handleCheckItem(checkItem.id)}
                    />
                    <Label
                      htmlFor={checkItem.id}
                      className={`cursor-pointer ${
                        checkedItems.includes(checkItem.id) ? 'text-muted-foreground line-through' : ''
                      }`}
                    >
                      {checkItem.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {checkedItems.length} of {reviewChecklist.length} items verified
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
