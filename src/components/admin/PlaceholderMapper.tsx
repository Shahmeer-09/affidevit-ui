import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  Save,
  Loader2,
  Plus,
  Link2,
  Unlink,
  HelpCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetPlaceholderAuditQuery,
  useUpdatePlaceholderMappingMutation,
  usePreviewTemplateMutation,
  usePreviewAIDraftMutation,
  type PlaceholderAuditEntry,
  type IntakeQuestion,
} from '@/store/api/adminApi';

interface PlaceholderMapperProps {
  affidavitTypeId: string;
  questions?: IntakeQuestion[];
  onAddToTemplate?: (fieldId: string) => void;
}

function StatusIcon({ status }: { status: PlaceholderAuditEntry['status'] }) {
  switch (status) {
    case 'mapped':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'unmapped':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'auto':
      return <Cpu className="h-4 w-4 text-blue-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: PlaceholderAuditEntry['status'] }) {
  switch (status) {
    case 'mapped':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Mapped</Badge>;
    case 'unmapped':
      return <Badge variant="destructive">Unmapped</Badge>;
    case 'auto':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Auto</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

export function PlaceholderMapper({ affidavitTypeId, questions: externalQuestions, onAddToTemplate }: PlaceholderMapperProps) {
  const typeId = Number(affidavitTypeId);
  const { data: audit, isLoading, refetch } = useGetPlaceholderAuditQuery(typeId);
  const [updateMapping, { isLoading: isSaving }] = useUpdatePlaceholderMappingMutation();
  const [previewTemplate, { isLoading: isPreviewingTemplate }] = usePreviewTemplateMutation();
  const [previewAIDraft, { isLoading: isPreviewingAI }] = usePreviewAIDraftMutation();

  // Local state for the mapping being edited
  const [localMapping, setLocalMapping] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Track orphaned fields that were "added to template" so they hide optimistically
  const [hiddenOrphans, setHiddenOrphans] = useState<Set<string>>(new Set());

  // Live preview state
  const [previewMode, setPreviewMode] = useState<'template' | 'ai'>('template');
  const [sampleAnswers, setSampleAnswers] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewStats, setPreviewStats] = useState<{ filled: number; total: number; remaining: string[] } | null>(null);
  const [aiDraftMeta, setAiDraftMeta] = useState<{ warnings: string[]; model: string; time: number; tokens: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Remove stale mapping entries when external questions change (e.g. question deleted)
  useEffect(() => {
    if (!externalQuestions || !initialized) return;
    
    const activeIds = new Set(externalQuestions.map((q) => q.id).filter(Boolean));
    let didChange = false;
    
    setLocalMapping((prev) => {
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(([, qId]) => !qId || activeIds.has(qId)),
      );
      
      didChange = Object.keys(filtered).length !== Object.keys(prev).length;
      return didChange ? filtered : prev;
    });
    
    if (didChange) {
      // Defer to avoid cascading renders with setLocalMapping
      queueMicrotask(() => setHasChanges(true));
    }
  }, [externalQuestions, initialized]);

  // Initialize local mapping from API data
  useEffect(() => {
    if (audit && !initialized) {
      // Defer state updates to avoid cascading renders
      queueMicrotask(() => {
        setLocalMapping(audit.placeholder_mapping || {});
        setInitialized(true);
      });
    }
  }, [audit, initialized]);

  // Reset initialized when typeId changes
  useEffect(() => {
    // Defer state updates to avoid cascading renders
    queueMicrotask(() => {
      setInitialized(false);
      setHasChanges(false);
      setHiddenOrphans(new Set());
    });
  }, [typeId]);

  // Available questions for dropdown
  const questionOptions = useMemo(() => {
    if (!audit?.questions) return [];
    return audit.questions;
  }, [audit]);

  // Unmapped placeholders
  const unmappedEntries = useMemo(() => {
    if (!audit?.entries) return [];
    return audit.entries.filter((e) => e.status === 'unmapped');
  }, [audit]);

  const handleMappingChange = (placeholder: string, questionId: string) => {
    setLocalMapping((prev) => {
      const next = { ...prev };
      if (questionId === '__unlink__') {
        delete next[placeholder];
      } else {
        next[placeholder] = questionId;
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMapping({
        id: typeId,
        data: { placeholder_mapping: localMapping },
      }).unwrap();
      toast.success('Placeholder mapping saved');
      setHasChanges(false);
      setInitialized(false); // Re-init from fresh data
    } catch {
      toast.error('Failed to save mapping');
    }
  };

  const handleAutoCreateAll = async () => {
    const toCreate = unmappedEntries.map((e) => e.placeholder);
    if (toCreate.length === 0) {
      toast.info('No unmapped placeholders to create questions for');
      return;
    }
    try {
      const result = await updateMapping({
        id: typeId,
        data: {
          placeholder_mapping: localMapping,
          auto_create_questions: toCreate,
        },
      }).unwrap();
      const count = result.created_questions?.length || 0;
      toast.success(`Created ${count} new question(s) and updated mapping`);
      setHasChanges(false);
      setInitialized(false);
    } catch {
      toast.error('Failed to auto-create questions');
    }
  };

  // Live preview - dual mode (template fill vs AI draft)
  const handlePreview = useCallback(async () => {
    if (previewMode === 'template') {
      try {
        const result = await previewTemplate({
          id: typeId,
          sample_answers: sampleAnswers,
        }).unwrap();
        setPreviewHtml(result.filled_html);
        setPreviewStats({
          filled: result.filled_count,
          total: result.total_placeholders,
          remaining: result.remaining_placeholders,
        });
        setAiDraftMeta(null);
        setShowPreview(true);
      } catch {
        toast.error('Failed to generate template preview');
      }
    } else {
      try {
        const result = await previewAIDraft({
          id: typeId,
          sample_answers: sampleAnswers,
        }).unwrap();
        setPreviewHtml(result.draft_html);
        setPreviewStats(null);
        setAiDraftMeta({
          warnings: result.warnings,
          model: result.model_used,
          time: result.elapsed_time,
          tokens: result.total_tokens,
        });
        setShowPreview(true);
      } catch {
        toast.error('Failed to generate AI draft preview');
      }
    }
  }, [previewMode, previewTemplate, previewAIDraft, typeId, sampleAnswers]);

  const handleSampleAnswerChange = (fieldId: string, value: string) => {
    setSampleAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleAutoCreateSingle = async (placeholder: string) => {
    try {
      const result = await updateMapping({
        id: typeId,
        data: {
          placeholder_mapping: localMapping,
          auto_create_questions: [placeholder],
        },
      }).unwrap();
      const count = result.created_questions?.length || 0;
      if (count > 0) {
        toast.success(`Created question for "${placeholder}"`);
      } else {
        toast.info('Question already exists');
      }
      setHasChanges(false);
      setInitialized(false);
    } catch {
      toast.error('Failed to create question');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!audit) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          Could not load placeholder audit. Make sure the affidavit type has a template.
        </AlertDescription>
      </Alert>
    );
  }

  const { summary, entries, orphaned_questions } = audit;
  const hasTemplate = audit.total_placeholders > 0;

  return (
    <div className="space-y-6">
      {/* No template warning */}
      {!hasTemplate && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Template Found</AlertTitle>
          <AlertDescription>
            This affidavit type has no template HTML with placeholders. Go to the{' '}
            <strong>Templates</strong> tab to generate one first using AI, then come back here to
            audit the mapping.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {hasTemplate && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{summary.mapped}</p>
                    <p className="text-xs text-muted-foreground">Mapped</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{summary.unmapped}</p>
                    <p className="text-xs text-muted-foreground">Unmapped</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{summary.auto_computed}</p>
                    <p className="text-xs text-muted-foreground">Auto-computed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">{summary.orphaned_questions}</p>
                    <p className="text-xs text-muted-foreground">Orphaned Qs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unmapped Warning */}
          {summary.unmapped > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>
                {summary.unmapped} Placeholder{summary.unmapped > 1 ? 's' : ''} Unmapped
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  These placeholders exist in the template but no intake question collects their
                  data. The final affidavit will have blank fields.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4 shrink-0"
                  onClick={handleAutoCreateAll}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Auto-Create All
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* All good */}
          {summary.unmapped === 0 && summary.mapped > 0 && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-300">All Placeholders Mapped</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                Every template placeholder has a corresponding intake question. No data will be
                missing in the final affidavit.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => { setInitialized(false); refetch(); }}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="sm">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Mapping
            </Button>
          </div>

          {/* Mapping Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Placeholder → Question Binding
              </CardTitle>
              <CardDescription>
                Each template placeholder must be linked to an intake question. Use the dropdown to
                change which question feeds data into each placeholder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Template Placeholder</TableHead>
                    <TableHead>Mapped Question</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const currentMapped = localMapping[entry.placeholder] || '';
                    const isAuto = entry.status === 'auto';

                    return (
                      <TableRow key={entry.placeholder}>
                        <TableCell>
                          <StatusIcon status={entry.status} />
                        </TableCell>
                        <TableCell>
                          <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                            {`{{${entry.placeholder}}}`}
                          </code>
                        </TableCell>
                        <TableCell>
                          {isAuto ? (
                            <span className="text-sm text-blue-600 italic">
                              Auto-computed by system
                            </span>
                          ) : (
                            <Select
                              value={currentMapped || entry.mapped_question_id || '__none__'}
                              onValueChange={(val) =>
                                handleMappingChange(
                                  entry.placeholder,
                                  val === '__none__' ? '__unlink__' : val
                                )
                              }
                            >
                              <SelectTrigger className="w-full max-w-xs">
                                <SelectValue placeholder="Select question..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">
                                  <span className="text-muted-foreground">— Not mapped —</span>
                                </SelectItem>
                                {questionOptions.map((q) => (
                                  <SelectItem key={q.id} value={q.id}>
                                    {q.label}{' '}
                                    <span className="text-xs text-muted-foreground">({q.type})</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={entry.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.status === 'unmapped' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAutoCreateSingle(entry.placeholder)}
                              disabled={isSaving}
                              title="Auto-create a question for this placeholder"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Create
                            </Button>
                          )}
                          {entry.status === 'mapped' && currentMapped && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMappingChange(entry.placeholder, '__unlink__')}
                              title="Unlink this mapping"
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {entries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No placeholders found in template
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Orphaned Questions */}
          {(() => {
            const visibleOrphans = orphaned_questions.filter(oq => !hiddenOrphans.has(oq.question_id));
            return visibleOrphans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Orphaned Questions ({visibleOrphans.length})
                </CardTitle>
                <CardDescription>
                  These questions exist in the intake form but no template placeholder references
                  them. The data collected won't appear in the generated affidavit unless the AI
                  infers where to place it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question ID</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Type</TableHead>
                      {onAddToTemplate && <TableHead className="w-40" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleOrphans.map((oq) => (
                      <TableRow key={oq.question_id}>
                        <TableCell>
                          <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                            {oq.question_id}
                          </code>
                        </TableCell>
                        <TableCell>{oq.question_label}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{oq.question_type}</Badge>
                        </TableCell>
                        {onAddToTemplate && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setHiddenOrphans(prev => new Set([...prev, oq.question_id]));
                                onAddToTemplate(oq.question_id);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                              Add to Template
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
          })()}

          {/* Live Preview - Dual Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                Test how the affidavit will look with sample data. Choose between template fill (instant, deterministic) or full AI draft (production flow).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode toggle */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <span className="text-sm font-medium mr-2">Preview Mode:</span>
                <Button
                  size="sm"
                  variant={previewMode === 'template' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('template')}
                  className="h-8"
                >
                  Template Fill
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === 'ai' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('ai')}
                  className="h-8"
                >
                  AI Draft (Full Flow)
                </Button>
                {previewMode === 'template' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ⚡ Instant • Deterministic placeholder fill
                  </span>
                )}
                {previewMode === 'ai' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    🤖 Production flow • Real AI drafting
                  </span>
                )}
              </div>

              {/* Sample data inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {audit.questions.map((q) => (
                  <div key={q.id} className="space-y-1">
                    <Label htmlFor={`sample-${q.id}`} className="text-xs font-medium">
                      {q.label}
                    </Label>
                    <Input
                      id={`sample-${q.id}`}
                      placeholder={q.label}
                      value={sampleAnswers[q.id] || ''}
                      onChange={(e) => handleSampleAnswerChange(q.id, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
                {audit.questions.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">
                    No intake questions defined yet. Add questions in the Questions tab first.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={handlePreview} 
                  disabled={isPreviewingTemplate || isPreviewingAI} 
                  size="sm"
                >
                  {(isPreviewingTemplate || isPreviewingAI) ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  {previewMode === 'template' ? 'Preview Template' : 'Generate AI Draft'}
                </Button>

                {/* Stats for template mode */}
                {previewStats && previewMode === 'template' && (
                  <span className="text-sm text-muted-foreground">
                    {previewStats.filled}/{previewStats.total} placeholders filled
                    {previewStats.remaining.length > 0 && (
                      <span className="text-red-500 ml-1">
                        ({previewStats.remaining.length} still empty)
                      </span>
                    )}
                  </span>
                )}

                {/* Stats for AI mode */}
                {aiDraftMeta && previewMode === 'ai' && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Model: {aiDraftMeta.model}</span>
                    <span>Time: {aiDraftMeta.time.toFixed(2)}s</span>
                    <span>Tokens: {aiDraftMeta.tokens}</span>
                    {aiDraftMeta.warnings.length > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600">
                        {aiDraftMeta.warnings.length} warning(s)
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Preview output */}
              {showPreview && previewHtml && (
                <div className="space-y-2">
                  <Separator />
                  
                  {/* Template mode: show remaining placeholders */}
                  {previewStats && previewStats.remaining.length > 0 && previewMode === 'template' && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs text-muted-foreground mr-1">Unfilled placeholders:</span>
                      {previewStats.remaining.map((ph) => (
                        <Badge key={ph} variant="outline" className="text-xs text-red-600">
                          {`{{${ph}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* AI mode: show warnings */}
                  {aiDraftMeta && aiDraftMeta.warnings.length > 0 && previewMode === 'ai' && (
                    <Alert className="mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>AI Warnings</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-xs">
                          {aiDraftMeta.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="max-h-[500px] overflow-y-auto rounded-md border">
                    <div
                      className="p-4 document-preview prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Separator />

      {/* Help text */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          <strong>How this works:</strong> The template contains{' '}
          <code className="bg-muted px-1 rounded">{`{{placeholder}}`}</code> tokens. Each
          placeholder must be linked to an intake question so the user's answer fills that spot in
          the final affidavit.
        </p>
        <p>
          <strong>Mapped</strong> = placeholder has a linked question.{' '}
          <strong>Unmapped</strong> = no question collects this data (will be blank).{' '}
          <strong>Auto</strong> = system computes this value (e.g., age from DOB).{' '}
          <strong>Orphaned</strong> = question exists but template doesn't use it.
        </p>
      </div>
    </div>
  );
}
