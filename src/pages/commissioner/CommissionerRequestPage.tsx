import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge, TierBadge } from '@/components/features';
import { ROUTES, API_BASE_URL } from '@/lib/constants';
import { 
  useLookupRequestQuery,
  useCompleteRequestMutation,
  useCreateFrictionReportMutation,
} from '@/store/api/commissionerApi';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Stamp,
  Eye,
  Loader2,
  AlertTriangle,
  User,
  FileType,
} from 'lucide-react';
import { format } from 'date-fns';

export function CommissionerRequestPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [stampComplete, setStampComplete] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // API hooks
  const { data: request, isLoading, error } = useLookupRequestQuery(code || '', {
    skip: !code,
  });
  const [completeRequest, { isLoading: isCompleting }] = useCompleteRequestMutation();
  const [createFrictionReport, { isLoading: isReporting }] = useCreateFrictionReportMutation();

  // Check if another commissioner is assigned
  // const isAssignedToOther = request?.commissioner && 
  //   request.commissioner.id !== undefined; // Will need to compare with current user

  const canComplete = request?.status?.toUpperCase() === 'APPROVED';

  const handleDownloadPDF = useCallback(async () => {
    if (!request) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/requests/${request.id}/pdf/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to download PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affidavit-${request.request_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  }, [request]);

  const handleDownloadWord = useCallback(async () => {
    if (!request) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/requests/${request.id}/word/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to download Word document');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affidavit-${request.request_code}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Word document downloaded successfully');
    } catch (err) {
      toast.error('Failed to download Word document');
    }
  }, [request]);

  const handlePreviewPDF = useCallback(async () => {
    if (!request) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/requests/${request.id}/pdf/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to load PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch (err) {
      toast.error('Failed to load PDF preview');
    }
  }, [request]);

  const handleMarkComplete = async () => {
    if (!request) return;
    
    try {
      await completeRequest({ request_id: request.id }).unwrap();
      setStampComplete(true);
      toast.success('Notarization complete! Stamp recorded.');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to mark as complete');
    }
  };

  const handleReportIssue = async () => {
    if (!request || !rejectReason.trim()) return;
    
    try {
      await createFrictionReport({ 
        request_id: request.id, 
        reason: rejectReason 
      }).unwrap();
      toast.success('Issue reported successfully');
      setRejectDialogOpen(false);
      setRejectReason('');
      navigate(ROUTES.COMMISSIONER_LOOKUP);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to report issue');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Request Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The request with code "{code}" was not found.
            </p>
            <Button asChild>
              <Link to={ROUTES.COMMISSIONER_LOOKUP}>Back to Lookup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviewPDF}>
            <Eye className="h-4 w-4 mr-2" />
            Preview PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadWord}>
            <FileType className="h-4 w-4 mr-2" />
            Word
          </Button>
        </div>
      </div>

      {/* Lock Warning */}
      {(request as any).lock_warning && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {(request as any).lock_warning}
          </AlertDescription>
        </Alert>
      )}

      {stampComplete ? (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Notarization Complete!</h2>
            <p className="text-muted-foreground mb-6">
              The affidavit has been successfully stamped and recorded for payout.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to={ROUTES.COMMISSIONER_LOOKUP}>Back to Lookup</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardDescription className="font-mono text-base">{request.request_code}</CardDescription>
                    <CardTitle className="text-2xl mt-1">{request.affidavit_type?.name}</CardTitle>
                  </div>
                  <StatusBadge status={request.status} size="lg" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <TierBadge tier={request.affidavit_type?.tier} size="sm" />
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Created {format(new Date(request.created_at), 'MMM d, yyyy')}
                  </span>
                  {request.commissioner && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-4 w-4" />
                      Assigned to: {request.commissioner.first_name} {request.commissioner.last_name}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PDF Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pdfPreviewUrl ? (
                  <iframe 
                    src={pdfPreviewUrl} 
                    className="w-full h-[600px] rounded-lg border"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="aspect-[8.5/11] bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Affidavit Document</p>
                      <p className="text-sm mb-4">Click "Preview PDF" to view the document</p>
                      <Button variant="outline" onClick={handlePreviewPDF}>
                        <Eye className="h-4 w-4 mr-2" />
                        Load Preview
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className={canComplete ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle>Notarization Actions</CardTitle>
                <CardDescription>
                  {canComplete 
                    ? 'This document is ready for your stamp'
                    : 'This document is not ready for notarization'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg" 
                  disabled={!canComplete || isCompleting}
                  onClick={handleMarkComplete}
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Stamp className="h-4 w-4 mr-2" />
                  )}
                  {isCompleting ? 'Processing...' : 'Mark Complete'}
                </Button>

                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full text-destructive">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report Issue with Document</DialogTitle>
                      <DialogDescription>
                        Flag this document as having legal errors or unacceptable wording. 
                        This will be logged for review.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Issue</Label>
                        <Textarea
                          id="reason"
                          placeholder="Explain why this document cannot be notarized (e.g., bad wording, legal errors, missing information)..."
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
                        onClick={handleReportIssue}
                        disabled={!rejectReason.trim() || isReporting}
                      >
                        {isReporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Submit Report
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Request Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{request.affidavit_type?.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier</span>
                  <TierBadge tier={request.affidavit_type?.tier} size="sm" />
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={request.status} size="sm" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
