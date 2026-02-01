import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge, TierBadge, SimpleTimeline } from '@/components/features';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  useGetRequestQuery,
  useGetRequestStatusQuery,
  useSubmitClarificationMutation,
  useMarkRequestPaidMutation,
  useSelectCommissionerMutation,
} from '@/store/api/userApi';
import { ROUTES, API_BASE_URL } from '@/lib/constants';
import {
  ArrowLeft,
  Download,
  FileText,
  Clock,
  AlertCircle,
  Loader2,
  // Eye,
  MessageSquare,
  CheckCircle,
  CreditCard,
  Copy,
  Check,
  User,
} from 'lucide-react';
import { format } from 'date-fns';

export function RequestStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Local state
  const [clarificationResponse, setClarificationResponse] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // API hooks
  const { data: request, isLoading, error, refetch } = useGetRequestQuery(Number(id), {
    skip: !id,
  });
  
  // Normalize status to uppercase for comparisons
  const normalizedStatus = request?.status?.toUpperCase();
  
  // Polling for status when processing
  const shouldPoll = normalizedStatus === 'SUBMITTED' || normalizedStatus === 'PROCESSING';
  const { data: statusData } = useGetRequestStatusQuery(Number(id), {
    skip: !id || !shouldPoll,
    pollingInterval: shouldPoll ? 2000 : 0,
  });

  // Console logging for AI processing
  useEffect(() => {
    if (statusData) {
      console.log('📊 Request Status Update:', {
        status: statusData.status,
        message: statusData.message,
        processingStep: statusData.processing_step,
      });
      
      if (statusData.ai_logs && statusData.ai_logs.length > 0) {
        console.log('🤖 AI Processing Logs:');
        statusData.ai_logs.forEach((log, idx) => {
          const icon = log.status === 'success' ? '✅' : log.status === 'failed' ? '❌' : '⏰';
          console.log(`  ${icon} [${idx + 1}] ${log.node_type_display}:`, {
            model: log.model_name,
            tokens: log.total_tokens,
            latency: `${log.latency_ms}ms`,
            status: log.status,
            error: log.error_message || undefined,
          });
        });
      }
    }
  }, [statusData]);

  // Mutations
  const [submitClarification, { isLoading: isSubmittingClarification }] = useSubmitClarificationMutation();
  const [markPaid, { isLoading: isMarkingPaid }] = useMarkRequestPaidMutation();
  const [selectCommissioner, { isLoading: isWithdrawing }] = useSelectCommissionerMutation();

  // Refetch when status changes from processing
  useEffect(() => {
    const pollingStatus = statusData?.status?.toUpperCase();
    if (pollingStatus && pollingStatus !== 'PROCESSING' && pollingStatus !== 'SUBMITTED') {
      refetch();
    }
  }, [statusData?.status, refetch]);

  // Handle commissioner withdrawal
  const handleWithdrawCommissioner = useCallback(async () => {
    if (!id) {
      console.error('Cannot withdraw commissioner: id is undefined');
      toast.error('Error', {
        description: 'Request ID is missing. Please refresh the page.',
      });
      return;
    }
    
    const requestId = Number(id);
    if (isNaN(requestId)) {
      console.error('Cannot withdraw commissioner: invalid id', id);
      toast.error('Error', {
        description: 'Invalid request ID.',
      });
      return;
    }
    
    try {
      await selectCommissioner({
        id: requestId,
        commissioner_id: 0,
      }).unwrap();
      
      toast.success('Commissioner Withdrawn', {
        description: 'You can now select a different commissioner.',
      });
      refetch();
    } catch (error) {
      console.error('Error withdrawing commissioner:', error);
      toast.error('Error', {
        description: 'Failed to withdraw commissioner selection. Please try again.',
      });
    }
  }, [id, selectCommissioner, refetch]);

  // Handle clarification submit
  const handleSubmitClarification = useCallback(async () => {
    if (!id || !clarificationResponse.trim()) return;
    
    try {
      await submitClarification({ id: Number(id), response: clarificationResponse }).unwrap();
      toast.success('Clarification Submitted', {
        description: 'Your response has been submitted. AI is processing your request again.',
      });
      setClarificationResponse('');
      refetch();
    } catch {
      toast.error('Error', {
        description: 'Failed to submit clarification. Please try again.',
      });
    }
  }, [id, clarificationResponse, submitClarification, refetch]);

  // Handle payment
  const handleMarkPaid = useCallback(async () => {
    if (!id) return;
    
    try {
      await markPaid(Number(id)).unwrap();
      toast.success('Payment Confirmed', {
        description: 'Payment has been marked as complete. You can now download your document.',
      });
      refetch();
    } catch {
      toast.error('Payment Failed', {
        description: 'Failed to process payment. Please try again.',
      });
    }
  }, [id, markPaid, refetch]);

  // Handle PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!id) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/requests/${id}/pdf/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affidavit-${request?.request_code || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Download Started', {
        description: 'Your affidavit PDF is downloading.',
      });
    } catch {
      toast.error('Download Failed', {
        description: 'Could not download the PDF. Please try again.',
      });
    }
  }, [id, request?.request_code]);

  // Copy verification code
  const handleCopyCode = useCallback(() => {
    if (request?.request_code) {
      navigator.clipboard.writeText(request.request_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success('Code Copied', {
        description: 'Verification code copied to clipboard.',
      });
    }
  }, [request?.request_code]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Loading Request</h2>
            <p className="text-muted-foreground">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error/not found state
  if (error || !request) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Request Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The request you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to={ROUTES.MY_REQUESTS}>View My Requests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build timeline items based on status (use normalizedStatus for comparisons)
  const getTimelineItems = () => {
    type TimelineItem = { label: string; description?: string; status: 'completed' | 'current' | 'upcoming' };
    const items: TimelineItem[] = [
      { label: 'Request Created', description: format(new Date(request.created_at), 'MMM d, yyyy h:mm a'), status: 'completed' },
    ];

    if (request.submitted_at) {
      items.push({ label: 'Submitted for Processing', description: format(new Date(request.submitted_at), 'MMM d, yyyy h:mm a'), status: 'completed' });
    }

    if (['DRAFT_READY', 'APPROVED', 'COMPLETED', 'NEEDS_REVIEW'].includes(normalizedStatus || '')) {
      items.push({ label: 'AI Draft Generated', status: 'completed' });
    } else if (['PROCESSING', 'SUBMITTED'].includes(normalizedStatus || '')) {
      items.push({ label: 'AI Processing', status: 'current' });
    } else if (normalizedStatus !== 'DRAFT') {
      items.push({ label: 'AI Draft Generated', status: 'completed' });
    }

    if (normalizedStatus === 'NEEDS_REVIEW') {
      items.push({ label: 'Under Review', description: 'A reviewer is checking your document', status: 'current' });
      items.push({ label: 'Approved', status: 'upcoming' });
      items.push({ label: 'Ready for Notarization', status: 'upcoming' });
    } else if (['APPROVED', 'COMPLETED'].includes(normalizedStatus || '')) {
      items.push({ label: 'Approved', status: 'completed' });
    }

    if (normalizedStatus === 'COMPLETED') {
      items.push({ label: 'Completed & Notarized', description: request.completed_at ? format(new Date(request.completed_at), 'MMM d, yyyy h:mm a') : undefined, status: 'completed' });
    } else if (normalizedStatus === 'APPROVED') {
      items.push({ label: 'Ready for Notarization', status: 'current' });
    }

    if (normalizedStatus === 'NEEDS_CLARIFICATION') {
      items.push({ label: 'Clarification Needed', description: 'Please provide additional information', status: 'current' });
    }

    return items;
  };

  const canDownload = ['APPROVED', 'COMPLETED', 'DRAFT_READY', 'NEEDS_REVIEW'].includes(normalizedStatus || '');
  const isProcessing = normalizedStatus === 'PROCESSING' || normalizedStatus === 'SUBMITTED';
  const needsClarification = normalizedStatus === 'NEEDS_CLARIFICATION';

  return (
    <div className="container py-8">
      {/* Header */}
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Requests
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardDescription className="font-mono">{request.request_code}</CardDescription>
                  <CardTitle className="text-2xl mt-1">{request.affidavit_type.name}</CardTitle>
                </div>
                <StatusBadge status={request.status} size="lg" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <TierBadge tier={request.affidavit_type.tier} size="sm" />
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Created {format(new Date(request.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Processing State - Simple UI */}
          {isProcessing && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <div>
                    <CardTitle className="text-lg">Processing Your Request</CardTitle>
                    <CardDescription>
                      Our AI is generating your affidavit. This usually takes less than a minute.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress bar */}
                {statusData?.processing_step && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{statusData.processing_step.label || 'Processing...'}</span>
                      <span>{statusData.processing_step.progress}%</span>
                    </div>
                    <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${statusData.processing_step.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  Please wait while we prepare your document...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Clarification Needed */}
          {needsClarification && (
            <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="py-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Clarification Needed</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        We need some additional information before we can complete your affidavit.
                      </p>
                      {(request as { clarification_question?: string }).clarification_question && (
                        <p className="text-sm font-medium p-3 bg-white dark:bg-gray-900 rounded border">
                          "{(request as { clarification_question?: string }).clarification_question}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 pl-10">
                    <Label htmlFor="clarification">Your Response</Label>
                    <Textarea
                      id="clarification"
                      placeholder="Type your response here..."
                      value={clarificationResponse}
                      onChange={(e) => setClarificationResponse(e.target.value)}
                      rows={4}
                    />
                    <Button 
                      size="sm" 
                      onClick={handleSubmitClarification}
                      disabled={isSubmittingClarification || !clarificationResponse.trim()}
                    >
                      {isSubmittingClarification ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Submit Clarification
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Request Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleTimeline items={getTimelineItems()} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Commissioner Selection - only for APPROVED status */}
              {normalizedStatus === 'APPROVED' && (
                <div className="space-y-2">
                  <Label>Commissioner</Label>
                  {request.commissioner ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          {request.commissioner.profile_image_url ? (
                            <img 
                              src={request.commissioner.profile_image_url}
                              alt={`${request.commissioner.first_name} ${request.commissioner.last_name}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-300">
                              {request.commissioner.first_name} {request.commissioner.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Commissioner assigned
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleWithdrawCommissioner}
                        disabled={isWithdrawing}
                        className="w-full"
                      >
                        {isWithdrawing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          'Withdraw Selection'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      asChild
                    >
                      <Link to={ROUTES.REQUEST_SELECT_COMMISSIONER.replace(':id', String(id))}>
                        <User className="h-4 w-4 mr-2" />
                        Select a Commissioner
                      </Link>
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {request.commissioner 
                      ? 'Take your document to this commissioner to finalize.'
                      : 'Select a commissioner to visit in person.'}
                  </p>
                </div>
              )}

              {/* Payment Section - show for NEEDS_REVIEW or APPROVED when not paid */}
              {canDownload && !request.is_paid && (
                <div className="space-y-2">
                  <Separator />
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <p className="font-semibold text-primary">Payment Required</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete payment to download your affidavit document.
                    </p>
                    <div className="p-3 bg-white dark:bg-gray-900 rounded border mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Affidavit Preparation Fee</span>
                        <span className="font-bold">$50.00 TTD</span>
                      </div>
                    </div>
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={handleMarkPaid}
                      disabled={isMarkingPaid}
                    >
                      {isMarkingPaid ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      {isMarkingPaid ? 'Processing...' : 'Pay Now'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Secure payment processing
                    </p>
                  </div>
                </div>
              )}

              {/* Download Button - shown after payment */}
              {canDownload && request.is_paid && (
                <>
                  <Separator />
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 mb-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Payment Complete</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  {normalizedStatus === 'NEEDS_REVIEW' && (
                    <p className="text-xs text-muted-foreground text-center">
                      Draft available for preview. Final version pending review.
                    </p>
                  )}
                </>
              )}

              {/* Verification Code - shown when request has code */}
              {request.request_code && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">
                    Verification Code
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-lg font-bold text-green-700 dark:text-green-300">
                      {request.request_code}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleCopyCode}
                    >
                      {copiedCode ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Give this code to your commissioner to verify your affidavit.
                  </p>
                </div>
              )}
              
              {/* View Draft for approved status */}
              {request.status === 'approved' && (
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Draft
                </Button>
              )}

              {/* Continue Editing for draft status */}
              {request.status === 'draft' && (
                <Button className="w-full" asChild>
                  <Link to={ROUTES.REQUEST_CREATE.replace(':typeId', String(request.affidavit_type.id))}>
                    Continue Editing
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{request.affidavit_type.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tier</span>
                <TierBadge tier={request.affidavit_type.tier} size="sm" />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
              </div>
              {request.submitted_at && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-medium">{format(new Date(request.submitted_at), 'MMM d, yyyy')}</span>
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
