import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, TierBadge } from '@/components/features';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ROUTES } from '@/lib/constants';
import { 
  useLookupRequestQuery,
  useSaveDraftMutation,
  useCompleteRequestMutation,
  useCreateFrictionReportMutation,
} from '@/store/api/commissionerApi';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Stamp,
  Loader2,
  AlertTriangle,
  User,
  Printer,
  Edit3,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';

// Page format dimensions used in CSS @page rule
const PAGE_FORMATS: Record<string, string> = {
  letter: '8.5in 11in',
  legal:  '8.5in 14in',
};

export function CommissionerRequestPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const printStyleRef = useRef<HTMLStyleElement | null>(null);

  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [stampComplete, setStampComplete] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [hasEdits, setHasEdits] = useState(false);
  const [printFormat, setPrintFormat] = useState<'letter' | 'legal'>('letter');
  const [printWarningOpen, setPrintWarningOpen] = useState(false);

  // API hooks
  const { data: request, isLoading, error } = useLookupRequestQuery(code || '', {
    skip: !code,
  });
  const [completeRequest, { isLoading: isCompleting }] = useCompleteRequestMutation();
  const [saveDraft, { isLoading: isSaving }] = useSaveDraftMutation();
  const [createFrictionReport, { isLoading: isReporting }] = useCreateFrictionReportMutation();

  // APPROVED = reviewed & approved by reviewer
  // DRAFT_READY = instant affidavit type that skips reviewer queue
  const canComplete = ['APPROVED', 'DRAFT_READY'].includes(
    request?.status?.toUpperCase() ?? ''
  );

  // Initialise editor with draft text when request first loads (derived state pattern)
  const [prevDraftText, setPrevDraftText] = useState<string | undefined>(undefined);
  if (request?.draft_text !== undefined && request.draft_text !== prevDraftText) {
    setPrevDraftText(request.draft_text);
    setEditedText(request.draft_text);
    setHasEdits(false);
  }

  const handleEditorChange = useCallback((html: string) => {
    setEditedText(html);
    setHasEdits(html !== request?.draft_text);
  }, [request?.draft_text]);

  // Save edits to backend without completing the request
  const handleSaveDraft = useCallback(async () => {
    if (!request || !editedText.trim()) return;
    try {
      await saveDraft({
        request_id: request.id,
        draft_text: editedText,
      }).unwrap();
      setHasEdits(false);
      toast.success('Edits saved successfully.');
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      toast.error(error?.data?.error || 'Failed to save edits');
    }
  }, [request, editedText, saveDraft]);

  // Core print logic — appends a bare div directly to <body> (outside #root)
  // so that hiding #root during print doesn't suppress the content.
  const executePrint = useCallback(() => {
    // Remove any leftover style from a previous print
    if (printStyleRef.current) {
      printStyleRef.current.remove();
      printStyleRef.current = null;
    }
    const existingContainer = document.getElementById('commissioner-print-body');
    if (existingContainer) existingContainer.remove();

    // Strip trailing empty paragraphs that TipTap appends — prevents blank extra pages
    const cleanedHtml = editedText
      .replace(/(<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+$/gi, '')
      .trim();

    // Inject the affidavit HTML directly onto <body> — outside the React #root tree
    const printContainer = document.createElement('div');
    printContainer.id = 'commissioner-print-body';
    printContainer.innerHTML = cleanedHtml;
    document.body.appendChild(printContainer);

    const style = document.createElement('style');
    style.id = 'commissioner-print-style';
    style.textContent = `
      /* Hide the print container on screen */
      #commissioner-print-body { display: none; }

      @page {
        size: ${PAGE_FORMATS[printFormat]};
        margin: 1in;
      }

      @media print {
        /* Collapse the full-page height set by global CSS — prevents blank second page */
        html, body {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Hide the React app and collapse its reserved space */
        #root {
          display: none !important;
          height: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }

        /* Show & style the print container */
        #commissioner-print-body {
          display: block !important;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
        }

        /* Paragraph spacing — matches editor [&_p]:my-4 */
        #commissioner-print-body p {
          margin: 1em 0;
          line-height: 1.6;
        }

        /* Ordered lists — matches editor [&_ol]:list-decimal [&_ol]:pl-6 */
        #commissioner-print-body ol {
          list-style-type: decimal;
          padding-left: 2em;
          margin: 1em 0;
        }

        /* Unordered lists — matches editor [&_ul]:list-disc [&_ul]:pl-6 */
        #commissioner-print-body ul {
          list-style-type: disc;
          padding-left: 2em;
          margin: 1em 0;
        }

        /* List items — matches editor [&_li]:my-1 */
        #commissioner-print-body li {
          margin: 0.25em 0;
        }

        /* Nested list indentation */
        #commissioner-print-body ol ol,
        #commissioner-print-body ul ul,
        #commissioner-print-body ol ul,
        #commissioner-print-body ul ol {
          padding-left: 2em;
          margin: 0.25em 0;
        }

        /* Bold / italic / underline */
        #commissioner-print-body strong { font-weight: bold; }
        #commissioner-print-body em { font-style: italic; }
        #commissioner-print-body u { text-decoration: underline; }

        /* Text alignment */
        #commissioner-print-body [style*="text-align: center"] { text-align: center; }
        #commissioner-print-body [style*="text-align: right"] { text-align: right; }

        /* Headings */
        #commissioner-print-body h1 { font-size: 20pt; font-weight: bold; margin: 0.5em 0; }
        #commissioner-print-body h2 { font-size: 16pt; font-weight: bold; margin: 0.5em 0; }
        #commissioner-print-body h3 { font-size: 14pt; font-weight: bold; margin: 0.5em 0; }

        /* Suppress any remaining empty paragraphs */
        #commissioner-print-body p:empty,
        #commissioner-print-body p:last-child:empty { display: none; margin: 0; padding: 0; }
      }
    `;
    document.head.appendChild(style);
    printStyleRef.current = style;

    window.print();

    window.addEventListener('afterprint', () => {
      style.remove();
      printContainer.remove();
      printStyleRef.current = null;
    }, { once: true });
  }, [printFormat, editedText]);

  // Print button — warns if unsaved edits exist
  const handlePrint = useCallback(() => {
    if (hasEdits) {
      setPrintWarningOpen(true);
    } else {
      executePrint();
    }
  }, [hasEdits, executePrint]);

  // Must be defined before handleStampThenPrint which calls it
  const handleMarkComplete = useCallback(async () => {
    if (!request) return;
    try {
      const result = await completeRequest({
        request_id: request.id,
        final_text: editedText || undefined,
      }).unwrap();
      setStampComplete(true);
      if (result.payout_message) {
        toast.success(result.payout_message, {
          duration: 5000,
          description: 'Notarization complete! Stamp recorded.',
        });
      } else {
        toast.success('Notarization complete! Stamp recorded.');
      }
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      toast.error(error?.data?.error || 'Failed to mark as complete');
    }
  }, [request, completeRequest, editedText]);

  // Print first (while editor is still visible), then stamp
  const handleStampThenPrint = async () => {
    setPrintWarningOpen(false);
    executePrint();
    // Small delay to let print dialog open before stamping changes the DOM
    setTimeout(() => {
      handleMarkComplete();
    }, 500);
  };

  const handlePrintOnly = () => {
    setPrintWarningOpen(false);
    executePrint();
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
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      toast.error(error?.data?.error || 'Failed to report issue');
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
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="cursor-pointer hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Lock Warning */}
      {(() => {
        const r = request as unknown as { lock_warning?: string };
        return r.lock_warning ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{r.lock_warning}</AlertDescription>
          </Alert>
        ) : null;
      })()}

      {stampComplete ? (
        <>
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Notarization Complete!</h2>
              <p className="text-muted-foreground mb-6">
                The affidavit has been successfully stamped and recorded for payout.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={executePrint}
                  className="cursor-pointer hover:bg-muted transition-colors"
                  aria-label="Print the stamped document"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Document
                </Button>
                <Button
                  asChild
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Link to={ROUTES.COMMISSIONER_LOOKUP}>Back to Lookup</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hidden print target — keeps editor content available after stamp */}
          <div id="commissioner-print-target" className="hidden">
            <div
              className="ProseMirror"
              dangerouslySetInnerHTML={{ __html: editedText }}
            />
          </div>
        </>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Print Warning Dialog — shown when printing with unsaved edits */}
          <Dialog open={printWarningOpen} onOpenChange={setPrintWarningOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Unsaved Edits Detected
                </DialogTitle>
                <DialogDescription>
                  You have unsaved edits. If you print without stamping, the user will
                  download the <strong>original unedited version</strong>. What would you like to do?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Button
                  className="w-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handleStampThenPrint}
                  disabled={!canComplete || isCompleting}
                  aria-label="Stamp and complete document, save edits, then print"
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Stamp className="h-4 w-4 mr-2" />
                  )}
                  Stamp &amp; Complete, then Print
                </Button>
                <Button
                  variant="outline"
                  className="w-full cursor-pointer hover:bg-muted transition-colors"
                  onClick={handlePrintOnly}
                  aria-label="Print current view only, edits will not be saved"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Only (edits not saved)
                </Button>
                <Button
                  variant="ghost"
                  className="w-full cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setPrintWarningOpen(false)}
                  aria-label="Cancel and return to editing"
                >
                  Cancel — Keep Editing
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Main Content — Inline Editor */}
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
                      {request.commissioner.first_name} {request.commissioner.last_name}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Document Editor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Affidavit Document
                    </CardTitle>
                    {hasEdits && (
                      <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Unsaved edits
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Page Format Selector */}
                    <Select
                      value={printFormat}
                      onValueChange={(v) => setPrintFormat(v as typeof printFormat)}
                    >
                      <SelectTrigger
                        className="h-8 w-28 text-xs cursor-pointer"
                        aria-label="Select print page format"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="letter">Letter (8.5×11)</SelectItem>
                        <SelectItem value="legal">Legal (8.5×14)</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Print Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="cursor-pointer hover:bg-muted transition-colors"
                      aria-label={`Print document in ${printFormat} format`}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs mt-1">
                  You may make minor corrections before notarizing. Edits are saved when you click "Stamp &amp; Complete".
                  {' '}<span className="text-amber-600">Tip: In the print dialog, uncheck &ldquo;Headers and footers&rdquo; to remove the date/URL added by your browser.</span>
                </CardDescription>
              </CardHeader>
              {/* Printable target â€” only this element is printed */}
              <CardContent id="commissioner-print-target" className="p-0">
                <RichTextEditor
                  content={editedText}
                  onChange={handleEditorChange}
                  editable={canComplete}
                  className="rounded-none border-0 border-t"
                />
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
                    ? 'Document is ready for your stamp'
                    : 'Awaiting reviewer approval before notarization'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Save Edits Button — saves draft without completing */}
                <Button
                  variant="outline"
                  className="w-full cursor-pointer hover:bg-muted transition-colors"
                  size="lg"
                  disabled={!canComplete || !hasEdits || isSaving}
                  onClick={handleSaveDraft}
                  aria-label="Save your edits without completing"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Edits'}
                </Button>

                {/* Stamp & Complete Button — finalizes and removes from lookup */}
                <Button
                  className="w-full cursor-pointer hover:opacity-90 transition-opacity"
                  size="lg"
                  disabled={!canComplete || isCompleting}
                  onClick={handleMarkComplete}
                  aria-label="Stamp and mark document as complete"
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Stamp className="h-4 w-4 mr-2" />
                  )}
                  {isCompleting ? 'Processing...' : 'Stamp & Complete'}
                </Button>

                {hasEdits && (
                  <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1">
                    <Edit3 className="h-3 w-3" />
                    You have unsaved edits
                  </p>
                )}

                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-destructive cursor-pointer hover:bg-destructive/10 transition-colors"
                      aria-label="Report an issue with this document"
                    >
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
                          placeholder="Explain why this document cannot be notarized..."
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
                        aria-label="Submit issue report"
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
