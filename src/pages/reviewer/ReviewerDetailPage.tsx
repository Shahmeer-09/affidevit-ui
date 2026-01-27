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
  useRequestClarificationMutation,
  useOverrideQAMutation,
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
  AlertTriangle,
  MessageSquare,
  Edit3,
  Eye,
  Flag,
  Save,
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
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [clarifyDialogOpen, setClarifyDialogOpen] = useState(false);
  
  // AI Wrong dialog state (when reviewer disagrees with AI)
  const [aiWrongDialogOpen, setAiWrongDialogOpen] = useState(false);
  const [selectedFlagIndex, setSelectedFlagIndex] = useState<number | null>(null);
  const [aiWrongReason, setAiWrongReason] = useState('');

  // Fetch request details
  const {
    data: request,
    isLoading,
    isError,
    refetch,
  } = useGetReviewRequestQuery(Number(id), {
    skip: !id,
  });

  // Fetch queue for navigation
  const { data: queue = [] } = useGetReviewQueueQuery();

  // Mutations
  const [approveRequest, { isLoading: isApproving }] = useApproveRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectRequestMutation();
  const [requestClarification, { isLoading: isClarifying }] = useRequestClarificationMutation();
  const [overrideQA] = useOverrideQAMutation();

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

  const handleClarification = async () => {
    if (!request || !clarificationQuestion.trim()) return;

    try {
      await requestClarification({
        request_id: request.id,
        question: clarificationQuestion,
      }).unwrap();

      toast({
        title: 'Clarification Requested',
        description: 'The user has been notified to provide additional information.',
      });

      setClarifyDialogOpen(false);
      setClarificationQuestion('');

      // Navigate to next item or back to queue
      if (nextItem) {
        navigate(ROUTES.REVIEWER_DETAIL.replace(':id', String(nextItem.id)));
      } else {
        navigate(ROUTES.REVIEWER_QUEUE);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request clarification. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle "AI is Right" - mark as false positive (AI flagged correctly, reviewer agrees)
  const handleAIRight = async (flagIndex: number) => {
    if (!request) return;

    try {
      await overrideQA({
        request_id: request.id,
        flag_index: flagIndex,
        reason: 'AI flag confirmed correct - issue addressed',
        ai_correct: true,
      }).unwrap();

      toast({
        title: 'AI Confirmed',
        description: 'The AI flag was marked as correct. Issue noted.',
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm flag.',
        variant: 'destructive',
      });
    }
  };

  // Handle "AI is Wrong" - open dialog to explain why AI was wrong
  const handleAIWrong = (flagIndex: number) => {
    setSelectedFlagIndex(flagIndex);
    setAiWrongReason('');
    setAiWrongDialogOpen(true);
  };

  // Confirm AI was wrong with reason
  const confirmAIWrong = async () => {
    if (!request || selectedFlagIndex === null) return;

    try {
      await overrideQA({
        request_id: request.id,
        flag_index: selectedFlagIndex,
        reason: aiWrongReason || 'AI flag was incorrect - false positive',
        ai_correct: false,
      }).unwrap();

      toast({
        title: 'Flag Dismissed',
        description: 'The AI flag was marked as incorrect (false positive).',
      });

      setAiWrongDialogOpen(false);
      setSelectedFlagIndex(null);
      setAiWrongReason('');
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss flag.',
        variant: 'destructive',
      });
    }
  };

  // Calculate approval readiness
  const qaFlags = request?.qa_flags_json || [];
  const hasQAFlags = qaFlags.length > 0;
  const hasUnreviewedFlags = qaFlags.some((flag: any) => !flag.overridden);
  const canApprove = allChecked && !hasUnreviewedFlags;

  // Debug logging
  useEffect(() => {
    console.log('[ReviewerDetailPage] Approval State:', {
      allChecked,
      checkedCount: checkedItems.length,
      totalChecklist: reviewChecklist.length,
      hasUnreviewedFlags,
      qaFlagsCount: qaFlags.length,
      canApprove,
      qaFlags: qaFlags.map((f: any) => ({ type: f.type, overridden: f.overridden, ai_correct: f.ai_correct })),
    });
  }, [allChecked, checkedItems.length, hasUnreviewedFlags, canApprove, qaFlags]);

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

      {/* QA Flags Warning */}
      {hasQAFlags && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">QA Flags Detected</p>
                <p className="text-sm text-muted-foreground mb-3">
                  AI has flagged potential issues with this document. For each flag, indicate if the AI was correct or incorrect.
                </p>
                <div className="space-y-3">
                  {qaFlags.map((flag: any, index: number) => {
                    // Map flag types to user-friendly descriptions (QA checks AI OUTPUT quality)
                    const flagDescriptions: Record<string, string> = {
                      // AI Output Quality Issues (QA Checker)
                      'template_deviation': 'AI didn\'t follow the template structure correctly',
                      'legal_error': 'AI used incorrect legal language for Trinidad and Tobago',
                      'disallowed_phrase': 'AI used a prohibited phrase from the policy/instructions',
                      'formatting': 'AI produced formatting issues in the document',
                      'hallucination': 'AI added information NOT provided by the user',
                      'policy_violation': 'AI violated affidavit type policy rules',
                      'instruction_violation': 'AI didn\'t follow system or affidavit instructions',
                      'system_error': 'System error during QA check',
                      'draft_error': 'Error generating the draft',
                    };

                    const flagType = flag.type || 'unknown';
                    const description = flag.description || flagDescriptions[flagType] || 'AI output quality issue detected';
                    const location = flag.location || '';
                    const suggestion = flag.suggestion || '';

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          flag.overridden 
                            ? 'bg-muted/50 border-muted opacity-70' 
                            : 'bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Flag className={`h-4 w-4 shrink-0 ${flag.overridden ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'}`} />
                              <span className="text-sm font-semibold capitalize">
                                {flagType.replace(/_/g, ' ')}
                              </span>
                              {flag.severity && (
                                <Badge 
                                  variant={flag.severity === 'high' ? 'destructive' : flag.severity === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {flag.severity}
                                </Badge>
                              )}
                              {flag.overridden && (
                                <Badge 
                                  variant={flag.ai_correct ? 'default' : 'secondary'} 
                                  className="text-xs"
                                >
                                  {flag.ai_correct ? '✓ AI Correct' : '✗ AI Wrong'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground ml-6 mb-2">
                              {description}
                            </p>
                            {location && (
                              <p className="text-xs bg-amber-100 dark:bg-amber-900/30 p-2 rounded ml-6 mb-2 font-mono">
                                📍 "{location}"
                              </p>
                            )}
                            {suggestion && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 ml-6">
                                💡 Suggestion: {suggestion}
                              </p>
                            )}
                            {flag.overridden && flag.override_reason && (
                              <p className="text-xs text-muted-foreground ml-6 mt-2 italic">
                                Note: {flag.override_reason}
                              </p>
                            )}
                          </div>
                          {!flag.overridden && (
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
                                onClick={() => handleAIRight(index)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                AI Correct
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
                                onClick={() => handleAIWrong(index)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                AI Wrong
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

              <Dialog open={clarifyDialogOpen} onOpenChange={setClarifyDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Clarification
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Clarification</DialogTitle>
                    <DialogDescription>
                      Send this request back to the user for additional information.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>What needs clarification?</Label>
                      <Textarea
                        placeholder="Describe what information is needed..."
                        value={clarificationQuestion}
                        onChange={(e) => setClarificationQuestion(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setClarifyDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleClarification}
                      disabled={!clarificationQuestion.trim() || isClarifying}
                    >
                      {isClarifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Send Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                  {hasUnreviewedFlags && <p>✓ Review all QA flags (mark as AI Correct or AI Wrong)</p>}
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

      {/* AI Wrong Confirmation Modal - Only shown when reviewer disagrees with AI */}
      <Dialog open={aiWrongDialogOpen} onOpenChange={setAiWrongDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Mark AI as Incorrect
            </DialogTitle>
            <DialogDescription>
              You believe this AI flag is a <strong>false positive</strong>. Please explain why.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFlagIndex !== null && qaFlags[selectedFlagIndex] && (
            <div className="space-y-4">
              {/* The Flag Being Dismissed */}
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium mb-2">Flag you're dismissing:</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium capitalize">
                      {(qaFlags[selectedFlagIndex].type || 'unknown').replace(/_/g, ' ')}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {qaFlags[selectedFlagIndex].description || 'No description provided'}
                  </p>
                  {qaFlags[selectedFlagIndex].location && (
                    <p className="text-xs font-mono bg-red-100 dark:bg-red-900/50 p-2 rounded mt-2">
                      📍 "{qaFlags[selectedFlagIndex].location}"
                    </p>
                  )}
                </div>
              </div>

              {/* Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="ai-wrong-reason">Why is the AI incorrect? (required)</Label>
                <Textarea
                  id="ai-wrong-reason"
                  placeholder="e.g., The information is actually consistent because..."
                  value={aiWrongReason}
                  onChange={(e) => setAiWrongReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This feedback helps improve AI accuracy for future reviews.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiWrongDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmAIWrong}
              disabled={!aiWrongReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Confirm AI is Wrong
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
