import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wand2,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useRefineTemplateMutation,
  useRefineInstructionMutation,
} from '@/store/api/adminApi';

export interface FieldMeta {
  id: string;
  label: string;
  help_text: string;
  type?: string;
  validation?: Record<string, unknown>;
  placeholder?: string;
  options?: { value: string; label: string }[];
  computed_fields?: string[];
}

interface TemplateRefinementPanelProps {
  affidavitTypeId: string;
  currentTemplate: string;
  onApplyRefinement: (
    refinedTemplate: string,
    newFields: string[],
    newFieldsMeta?: FieldMeta[],
  ) => void;
}

interface RefinedResult {
  template: string;
  newFields: string[];
  newFieldsMeta?: FieldMeta[];
  examplesUsed: number;
}

export function TemplateRefinementPanel({
  affidavitTypeId,
  currentTemplate,
  onApplyRefinement,
}: TemplateRefinementPanelProps) {
  const [instruction, setInstruction] = useState('');
  const [refinedResult, setRefinedResult] = useState<RefinedResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [refineTemplate, { isLoading }] = useRefineTemplateMutation();
  const [refineInstruction, { isLoading: isImproving }] = useRefineInstructionMutation();

  const handleImprovePrompt = async () => {
    if (!instruction.trim()) {
      toast.error('Type an instruction first, then click Improve');
      return;
    }
    try {
      const result = await refineInstruction({
        id: parseInt(affidavitTypeId, 10),
        data: {
          raw_instruction: instruction,
          current_template: currentTemplate,
        },
      }).unwrap();

      if (result.success && result.refined_instruction) {
        setInstruction(result.refined_instruction);
        toast.success('Prompt improved — feel free to edit further');
      } else {
        toast.error(result.error ?? 'Could not improve the prompt');
      }
    } catch {
      toast.error('Failed to contact AI service');
    }
  };

  const handleRefine = async () => {
    if (!instruction.trim()) {
      toast.error('Please describe what should be made dynamic');
      return;
    }
    if (!currentTemplate) {
      toast.error('No template to refine — please create a template first');
      return;
    }
    try {
      const result = await refineTemplate({
        id: parseInt(affidavitTypeId, 10),
        data: { instruction, current_template: currentTemplate },
      }).unwrap();

      if (result.success && result.refined_template) {
        setRefinedResult({
          template: result.refined_template,
          newFields: result.new_fields ?? [],
          newFieldsMeta: result.new_fields_meta,
          examplesUsed: result.examples_used ?? 0,
        });
        const newCount = result.new_fields?.length ?? 0;
        toast.success(
          newCount > 0
            ? `Refinement ready — ${newCount} new field(s) detected`
            : 'Refinement ready — no new fields added'
        );
      } else {
        toast.error(result.error ?? 'Refinement failed');
      }
    } catch {
      toast.error('Failed to contact AI refinement service');
    }
  };

  const handleApply = () => {
    if (!refinedResult) return;
    onApplyRefinement(
      refinedResult.template,
      refinedResult.newFields,
      refinedResult.newFieldsMeta,
    );
    setRefinedResult(null);
    setInstruction('');
    setShowPreview(false);
    toast.success('Refined template applied — review in editor, then save');
  };

  const handleDiscard = () => {
    setRefinedResult(null);
    setShowPreview(false);
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Wand2 className="h-5 w-5" />
          AI Template Refinement
        </CardTitle>
        <CardDescription>
          Describe which part of the template should be dynamic. The AI will
          replace static text with{' '}
          <code className="rounded bg-purple-100 px-1 text-xs">
            {'{{placeholders}}'}
          </code>
          , learning from your saved affidavit documents.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          placeholder={`e.g. "Make the land ownership clause dynamic — the current template has a hardcoded name, relationship to applicant, and location. Replace them with separate placeholders."`}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={3}
          disabled={isLoading || isImproving}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleImprovePrompt}
            disabled={isImproving || isLoading || !instruction.trim()}
            style={{
              opacity: isImproving || isLoading || !instruction.trim() ? 0.6 : 1,
              pointerEvents: isImproving || isLoading ? 'none' : 'auto',
              backgroundColor: '#f3e8ff',
              color: '#7e22ce',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: '1px solid #d8b4fe',
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
            }}
            onMouseEnter={(e) => {
              if (!isImproving && !isLoading && instruction.trim())
                e.currentTarget.style.backgroundColor = '#e9d5ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3e8ff';
            }}
          >
            {isImproving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Improving…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Improve Prompt
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRefine}
            disabled={isLoading || isImproving}
            style={{
              flex: 1,
              opacity: isLoading || isImproving ? 0.6 : 1,
              pointerEvents: isLoading || isImproving ? 'none' : 'auto',
              backgroundColor: '#7e22ce',
              color: '#ffffff',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isImproving)
                e.currentTarget.style.backgroundColor = '#6b21a8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#7e22ce';
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing saved documents…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Refine with AI
              </>
            )}
          </button>
        </div>

        {refinedResult && (
          <div className="space-y-3 border-t pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Refinement ready
              </span>
              {refinedResult.examplesUsed > 0 && (
                <Badge variant="outline" className="text-xs">
                  Learned from {refinedResult.examplesUsed} saved doc(s)
                </Badge>
              )}
            </div>

            {refinedResult.newFields.length > 0 && (
              <Alert className="border-purple-200 bg-purple-50">
                <AlertDescription>
                  <span className="text-sm font-medium">New fields detected: </span>
                  {refinedResult.newFields.map((f) => (
                    <code
                      key={f}
                      className="mr-1 rounded bg-purple-100 px-1.5 py-0.5 text-xs"
                    >
                      {`{{${f}}}`}
                    </code>
                  ))}
                  <p className="mt-1 text-xs text-muted-foreground">
                    These will appear as unmapped placeholders — assign them to
                    questions in the Mapping tab after saving.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showPreview ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {showPreview ? 'Hide' : 'Preview'} refined template
            </button>

            {showPreview && (
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded border bg-white p-3 text-xs">
                {refinedResult.template}
              </pre>
            )}

            <div className="flex gap-2">
              <Button onClick={handleApply} className="flex-1">
                Apply to Template
              </Button>
              <Button variant="outline" onClick={handleDiscard}>
                <XCircle className="mr-1 h-4 w-4" />
                Discard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
