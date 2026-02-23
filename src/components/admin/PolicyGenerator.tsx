// Policy Generator Component - Upload examples and generate policy with AI
import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  FileText,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileUp,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetTemplateDocumentsQuery,
  useUploadTemplateDocumentsMutation,
  useDeleteTemplateDocumentMutation,
  useGeneratePolicyMutation,
  useGetPolicyTaskStatusQuery,
  type PolicyGenerationResult,
  type DetectedField,
  type TemplateDocument,
  type IntakeQuestion,
} from '@/store/api/adminApi';

interface PolicyGeneratorProps {
  affidavitTypeId: string;
  existingQuestions?: IntakeQuestion[];
  onPolicyGenerated?: (policy: Partial<PolicyGenerationResult>, questions: IntakeQuestion[]) => void;
}

export function PolicyGenerator({
  affidavitTypeId,
  existingQuestions = [],
  onPolicyGenerated,
}: PolicyGeneratorProps) {
  const typeId = parseInt(affidavitTypeId);
  const [additionalContext, setAdditionalContext] = useState('');

  // Question approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [pendingResult, setPendingResult] = useState<PolicyGenerationResult | null>(null);
  const [pendingNewFields, setPendingNewFields] = useState<DetectedField[]>([]);
  const [approvedFieldIds, setApprovedFieldIds] = useState<Set<string>>(new Set());
  const [autoSave, setAutoSave] = useState(false);
  const [generatedPolicy, setGeneratedPolicy] = useState<PolicyGenerationResult | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  // API hooks
  const { data: documentsData, isLoading: isLoadingDocs, refetch: refetchDocs } = useGetTemplateDocumentsQuery(typeId);
  const [uploadDocuments, { isLoading: isUploading }] = useUploadTemplateDocumentsMutation();
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteTemplateDocumentMutation();
  const [generatePolicy, { isLoading: isGenerating }] = useGeneratePolicyMutation();

  // Poll for task status when we have a taskId
  const { data: taskStatus } = useGetPolicyTaskStatusQuery(
    { 
      taskId: taskId!, 
      affidavitTypeId: typeId,
      autoSave 
    },
    { skip: !taskId, pollingInterval: taskId ? 2000 : undefined } // Poll every 2 seconds
  );

  const documents = documentsData?.documents || [];

  // Handle task status updates
  useEffect(() => {
    if (!taskStatus || !taskId) return;

    if (taskStatus.status === 'completed' && taskStatus.result) {
      setTaskId(null); // Stop polling
      const result = taskStatus.result;
      setGeneratedPolicy(result);

      if (result.success) {
        // Check for save errors even if generation succeeded
        if (result.save_error) {
          toast.error(`Generated successfully, but failed to save: ${result.save_error}`, {
            duration: 6000,
          });
          if (result.validation_details) {
            console.error('Validation details:', result.validation_details);
            // Show validation details in a more readable format
            const validationMsg = typeof result.validation_details === 'string' 
              ? result.validation_details 
              : JSON.stringify(result.validation_details);
            toast.error(`Validation: ${validationMsg}`, {
              duration: 7000,
            });
          }
        } else {
          toast.success(result.saved ? 'Policy generated and saved!' : 'Policy generated successfully!');
        }
        
        // Separate new vs existing fields
        const existingIds = new Set(existingQuestions.map(q => q.id?.toLowerCase()));
        const existingLabels = new Set(existingQuestions.map(q => q.label?.toLowerCase()));
        const newFields = result.detected_fields.filter(f => {
          const fId = (f.id || '').toLowerCase();
          const fLabel = (f.label || '').toLowerCase();
          return !existingIds.has(fId) && !existingLabels.has(fLabel);
        });

        if (newFields.length > 0) {
          // Show approval dialog for new questions
          setPendingResult(result);
          setPendingNewFields(newFields);
          setApprovedFieldIds(new Set(newFields.map(f => f.id))); // all selected by default
          setApprovalDialogOpen(true);
        } else {
          // No new questions — pass through immediately
          const questions = result.detected_fields.map((field: DetectedField, index: number) => ({
            id: field.id || `field_${index}_${Date.now()}`,
            label: field.label,
            field_name: field.id,
            type: field.type as IntakeQuestion['type'],
            required: field.required,
            placeholder: field.placeholder,
            help_text: field.help_text,
            options: field.options,
            validation: field.validation,
            show_if: field.show_if,
            order: index + 1,
          }));
          onPolicyGenerated?.(result, questions);
        }
      } else {
        toast.error(result.error || 'Policy generation failed');
      }
    } else if (taskStatus.status === 'failed') {
      setTaskId(null); // Stop polling
      toast.error(taskStatus.error || 'Policy generation failed');
    }
  }, [taskStatus, taskId, onPolicyGenerated, autoSave]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // File upload handling
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append('files', file);
      });

      try {
        const result = await uploadDocuments({ id: typeId, files: formData }).unwrap();
        toast.success(result.message);
        refetchDocs();
      } catch {
        toast.error('Failed to upload documents');
      }
    },
    [typeId, uploadDocuments, refetchDocs]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Delete document
  const handleDeleteDocument = async (filename: string) => {
    try {
      await deleteDocument({ id: typeId, filename }).unwrap();
      toast.success(`Deleted "${filename}"`);
      refetchDocs();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  // Handle approve/reject new questions
  const handleApproveQuestions = () => {
    if (!pendingResult) return;

    const approved = pendingNewFields.filter(f => approvedFieldIds.has(f.id));
    const existingFields = pendingResult.detected_fields.filter(f => !pendingNewFields.some(nf => nf.id === f.id));
    const allFields = [...existingFields, ...approved];

    // Build questions from all kept fields
    const questions = allFields.map((field: DetectedField, index: number) => ({
      id: field.id || `field_${index}_${Date.now()}`,
      label: field.label,
      field_name: field.id,
      type: field.type as IntakeQuestion['type'],
      required: field.required,
      placeholder: field.placeholder,
      help_text: field.help_text,
      options: field.options,
      validation: field.validation,
      show_if: field.show_if,
      order: index + 1,
    }));

    // Do NOT auto-append fields to the template — let users place them
    // via the PlaceholderMapper "Add to Template" button where they belong.
    const modifiedResult = { ...pendingResult, detected_fields: allFields };
    onPolicyGenerated?.(modifiedResult, questions);

    const rejected = pendingNewFields.length - approved.length;
    if (approved.length > 0 && rejected > 0) {
      toast.success(`${approved.length} question(s) approved, ${rejected} skipped`);
    } else if (approved.length > 0) {
      toast.success(`${approved.length} new question(s) approved`);
    } else {
      toast.info('All new questions skipped');
    }

    setApprovalDialogOpen(false);
    setPendingResult(null);
    setPendingNewFields([]);
    setApprovedFieldIds(new Set());
  };

  // Generate policy
  const handleGeneratePolicy = async () => {
    if (documents.length === 0) {
      toast.error('Please upload at least one example document first');
      return;
    }

    try {
      const response = await generatePolicy({
        id: typeId,
        data: {
          additional_context: additionalContext,
          auto_save: autoSave,
        },
      }).unwrap();

      // Start polling for results
      setTaskId(response.task_id);
      toast.info('Policy generation started... This may take 20-40 seconds.');
    } catch (error: any) {
      console.error('Failed to start policy generation:', error);
      toast.error(error?.data?.error || 'Failed to start policy generation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>How to Generate Policy</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li><strong>Upload 15-20 example affidavit documents</strong> (Word or PDF) - more examples = better coverage of all scenarios</li>
            <li>Include examples of ALL variations (different ownership types, relationships, circumstances)</li>
            <li>AI will automatically detect scenarios and create conditional questions</li>
            <li>Optionally add context about this affidavit type</li>
            <li>Click "Generate Policy" to analyze examples with AI</li>
            <li>Review the generated template and detected fields</li>
            <li>Enable "Auto-save" to apply changes immediately</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Template Documents
            {documents.length > 0 && documents.length < 10 && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                Need {10 - documents.length} more for best results
              </Badge>
            )}
            {documents.length >= 10 && (
              <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                ✓ Good coverage
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Upload 10-20 example affidavits covering ALL variations (different scenarios, ownership types, relationships). More examples = better conditional question generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary">Drop files here...</p>
            ) : (
              <div>
                <p className="font-medium">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (.docx, .pdf - max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Uploading indicator */}
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading documents...
            </div>
          )}

          {/* Uploaded documents list */}
          {isLoadingDocs ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploaded Documents ({documents.length})</Label>
              {documents.map((doc: TemplateDocument) => (
                <div
                  key={doc.filename}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.file_type.toUpperCase()} • {(doc.content_length / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{doc.file_type}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDocument(doc.filename)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No documents uploaded yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Policy
          </CardTitle>
          <CardDescription>
            AI will analyze your uploaded documents and generate policy configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="E.g., This affidavit is used for property transfers in Trinidad and Tobago. Focus on land registry requirements..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Provide any specific instructions or context for the AI
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-save Generated Policy</Label>
              <p className="text-xs text-muted-foreground">
                Automatically apply the generated policy to this affidavit type
              </p>
            </div>
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
          </div>

          <Button
            onClick={handleGeneratePolicy}
            disabled={isGenerating || !!taskId || documents.length === 0}
            className="w-full"
            size="lg"
          >
            {isGenerating || taskId ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {taskId ? 'Generating policy...' : 'Starting generation...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Policy from {documents.length} Document(s)
              </>
            )}
          </Button>

          {documents.length === 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Upload at least one example document to enable policy generation
            </p>
          )}

          
        </CardContent>
      </Card>

      {/* Generated Policy Preview */}
      {generatedPolicy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {generatedPolicy.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Policy Generation Result
            </CardTitle>
            <CardDescription>
              {generatedPolicy.success
                ? generatedPolicy.saved
                  ? 'Policy has been saved to this affidavit type'
                  : 'Review the generated policy below'
                : 'There was an error generating the policy'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedPolicy.success ? (
              <Accordion type="multiple" defaultValue={['template', 'fields', 'phrases']}>
                {/* Template HTML */}
                <AccordionItem value="template">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Template HTML
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-72 border rounded-md p-4">
                      <pre className="text-xs whitespace-pre-wrap">
                        {generatedPolicy.template_html}
                      </pre>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>

                {/* Detected Fields */}
                <AccordionItem value="fields">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Detected Fields ({generatedPolicy.detected_fields.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {generatedPolicy.detected_fields.map((field: DetectedField) => (
                        <div
                          key={field.id}
                          className="p-3 border rounded-lg flex items-start justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                                {`{{${field.id}}}`}
                              </code>
                              <Badge variant="outline">{field.type}</Badge>
                              {field.required && (
                                <Badge variant="secondary">Required</Badge>
                              )}
                            </div>
                            <p className="text-sm mt-1">{field.label}</p>
                            {field.help_text && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {field.help_text}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Disallowed Phrases */}
                <AccordionItem value="phrases">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Disallowed Phrases ({generatedPolicy.disallowed_phrases.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      {generatedPolicy.disallowed_phrases.map((phrase) => (
                        <Badge key={phrase} variant="outline" className="text-destructive">
                          {phrase}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Config Validation Report */}
                {generatedPolicy.config_validation && (
                  <AccordionItem value="validation">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        {generatedPolicy.config_validation.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        Config Validation
                        {!generatedPolicy.config_validation.valid && (
                          <Badge variant="destructive" className="ml-1">
                            {generatedPolicy.config_validation.errors.length} issue(s)
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      {/* Stats row */}
                      <div className="flex gap-3 text-xs">
                        <Badge variant="outline">{generatedPolicy.config_validation.info.total_placeholders} placeholders</Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700">{generatedPolicy.config_validation.info.mapped} mapped</Badge>
                        <Badge variant="outline">{generatedPolicy.config_validation.info.auto_computed} auto</Badge>
                        {generatedPolicy.config_validation.info.unmapped > 0 && (
                          <Badge variant="destructive">{generatedPolicy.config_validation.info.unmapped} unmapped</Badge>
                        )}
                        {generatedPolicy.config_validation.info.orphaned > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700">{generatedPolicy.config_validation.info.orphaned} orphaned</Badge>
                        )}
                      </div>

                      {/* Errors */}
                      {generatedPolicy.config_validation.errors.length > 0 && (
                        <Alert variant="destructive" className="border-red-300 bg-red-50">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Unmapped Placeholders</AlertTitle>
                          <AlertDescription className="space-y-1">
                            {generatedPolicy.config_validation.errors.map((e, i) => (
                              <p key={i} className="text-sm">
                                <code className="bg-red-100 px-1 rounded">{`{{${e.placeholder}}}`}</code>{' '}
                                has no intake question. Go to Mapping tab to fix.
                              </p>
                            ))}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Warnings */}
                      {generatedPolicy.config_validation.warnings.length > 0 && (
                        <Alert className="border-amber-300 bg-amber-50">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-amber-700">Orphaned Questions</AlertTitle>
                          <AlertDescription className="text-amber-600 space-y-1">
                            {generatedPolicy.config_validation.warnings.map((w, i) => (
                              <p key={i} className="text-sm">
                                <span className="font-medium">"{w.label}"</span> ({w.question_id}) is not used by any template placeholder.
                              </p>
                            ))}
                          </AlertDescription>
                        </Alert>
                      )}

                      {generatedPolicy.config_validation.valid && generatedPolicy.config_validation.warnings.length === 0 && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          All placeholders mapped and no orphaned questions.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Scenario Branches */}
                {generatedPolicy.scenario_branches && Object.keys(generatedPolicy.scenario_branches).length > 0 && (
                  <AccordionItem value="scenarios">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        Scenario Branches
                        <Badge variant="outline" className="ml-1">{Object.keys(generatedPolicy.scenario_branches).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      {Object.entries(generatedPolicy.scenario_branches).map(([key, branch]) => (
                        <div key={key} className="border rounded-lg p-3 space-y-1">
                          <p className="text-sm font-medium">{key.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">{branch.description}</p>
                          {branch.key_fields?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {branch.key_fields.map((f) => (
                                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                              ))}
                            </div>
                          )}
                          {branch.template_sections?.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Sections: {branch.template_sections.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Analysis Notes */}
                {generatedPolicy.analysis_notes && (
                  <AccordionItem value="notes">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Analysis Notes
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        {generatedPolicy.analysis_notes}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Generation Failed</AlertTitle>
                <AlertDescription>{generatedPolicy.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      {/* Question Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review New Questions</DialogTitle>
            <DialogDescription>
              {pendingNewFields.length} new question{pendingNewFields.length !== 1 ? 's' : ''} detected.
              Select which to add to the intake form and template.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApprovedFieldIds(new Set(pendingNewFields.map(f => f.id)))}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApprovedFieldIds(new Set())}
            >
              Deselect All
            </Button>
          </div>

          <ScrollArea className="max-h-100">
            <div className="space-y-2 pr-3">
              {pendingNewFields.map((field) => (
                <div
                  key={field.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    approvedFieldIds.has(field.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/40'
                  }`}
                  onClick={() => {
                    setApprovedFieldIds(prev => {
                      const next = new Set(prev);
                      if (next.has(field.id)) next.delete(field.id);
                      else next.add(field.id);
                      return next;
                    });
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={approvedFieldIds.has(field.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                          {field.id}
                        </code>
                        <Badge variant="outline" className="text-xs">{field.type}</Badge>
                        {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                      </div>
                      <p className="text-sm font-medium mt-1">{field.label}</p>
                      {field.help_text && (
                        <p className="text-xs text-muted-foreground mt-0.5">{field.help_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                // Skip all new questions, pass only existing
                if (pendingResult) {
                  const existingFields = pendingResult.detected_fields.filter(
                    f => !pendingNewFields.some(nf => nf.id === f.id)
                  );
                  const questions = existingFields.map((field: DetectedField, index: number) => ({
                    id: field.id || `field_${index}_${Date.now()}`,
                    label: field.label,
                    field_name: field.id,
                    type: field.type as IntakeQuestion['type'],
                    required: field.required,
                    placeholder: field.placeholder,
                    help_text: field.help_text,
                    options: field.options,
                    validation: field.validation,
                    show_if: field.show_if,
                    order: index + 1,
                  }));
                  onPolicyGenerated?.(pendingResult, questions);
                }
                setApprovalDialogOpen(false);
                setPendingResult(null);
                setPendingNewFields([]);
                setApprovedFieldIds(new Set());
                toast.info('All new questions skipped');
              }}
            >
              Skip All
            </Button>
            <Button onClick={handleApproveQuestions}>
              Approve Selected ({approvedFieldIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
