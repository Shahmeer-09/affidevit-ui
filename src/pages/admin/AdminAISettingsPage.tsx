import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DashboardHeader } from '@/components/features';
import {
  useGetAIBaseInstructionQuery,
  useUpdateAIBaseInstructionMutation,
  useCreateAIBaseInstructionVersionMutation,
} from '@/store/api/adminApi';
import {
  Save,
  Loader2,
  Sparkles,
  History,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Default global instruction for T&T affidavits
const DEFAULT_INSTRUCTION = `You are an expert legal document drafter specializing in affidavits for Trinidad and Tobago.

Your task is to create formal, legally-sound affidavit documents based on information provided.

CRITICAL GUIDELINES:
1. Use clear, formal legal language appropriate for statutory declarations
2. Include proper affidavit structure:
   - Header (Republic of Trinidad and Tobago, Statutory Declaration Act reference)
   - Declarant introduction with full name, age, address, and ID
   - Numbered factual statements
   - Declaration of truth with legal consequences acknowledgment
   - Signature block for declarant
   - Commissioner of Affidavits attestation section
3. Be precise with dates, names, addresses, and all facts
4. Include appropriate legal declarations as per Trinidad and Tobago law
5. Format for easy reading and commissioning
6. NEVER include false or misleading statements
7. Leave signature lines and date fields blank for completion
8. Output clean HTML format suitable for PDF generation

Always maintain professional tone and absolute legal accuracy.

LEGAL REFERENCES:
- Statutory Declaration Act, Chapter 7:04 of the Laws of Trinidad and Tobago
- Evidence Act, Chapter 7:02

FORMAT REQUIREMENTS:
- Use semantic HTML tags: <p>, <ol>, <li>, <strong>, <sup>
- Do NOT include <html>, <head>, or <body> tags
- Ensure proper spacing for signature blocks
- Include Commissioner of Affidavits attestation at the bottom`;

export function AdminAISettingsPage() {
  const { data: instruction, isLoading, refetch } = useGetAIBaseInstructionQuery();
  const [updateInstruction, { isLoading: isUpdating }] = useUpdateAIBaseInstructionMutation();
  const [createVersion, { isLoading: isCreatingVersion }] = useCreateAIBaseInstructionVersionMutation();

  const [instructionText, setInstructionText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load instruction text when data arrives (only once)
  if (instruction && !isInitialized) {
    setInstructionText(instruction.instruction_text);
    setHasChanges(false);
    setIsInitialized(true);
  }

  const handleTextChange = (value: string) => {
    setInstructionText(value);
    setHasChanges(value !== instruction?.instruction_text);
  };

  const handleSave = async () => {
    try {
      await updateInstruction({ instruction_text: instructionText }).unwrap();
      toast.success('Global AI instruction updated successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to update instruction');
      console.error('Save error:', error);
    }
  };

  const handleCreateVersion = async () => {
    try {
      await createVersion({ instruction_text: instructionText }).unwrap();
      toast.success('New instruction version created');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to create new version');
      console.error('Version error:', error);
    }
  };

  const handleResetToDefault = () => {
    setInstructionText(DEFAULT_INSTRUCTION);
    setHasChanges(DEFAULT_INSTRUCTION !== instruction?.instruction_text);
    toast.info('Reset to default instruction. Click Save to apply.');
  };

  const isSaving = isUpdating || isCreatingVersion;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Global AI Settings"
        description="Configure the master instruction that governs all AI-generated affidavits"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </DashboardHeader>

      {/* Status Card */}
      {instruction && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Version:</span>
            <Badge variant="default">v{instruction.version}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={instruction.is_active ? 'default' : 'secondary'}>
              {instruction.is_active ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                'Inactive'
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Last Updated:</span>
            <Badge variant="outline">
              <History className="h-3 w-3 mr-1" />
              {format(new Date(instruction.updated_at), 'MMM d, yyyy h:mm a')}
            </Badge>
          </div>
          {instruction.updated_by_name && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">By:</span>
              <Badge variant="outline">{instruction.updated_by_name}</Badge>
            </div>
          )}
        </div>
      )}

      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            You have unsaved changes
          </span>
        </div>
      )}

      {/* Main Instruction Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Global AI Base Instruction
              </CardTitle>
              <CardDescription>
                This instruction is applied to ALL affidavit types as the foundation for AI drafting.
                Individual affidavit types can add their own specific instructions on top of this.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetToDefault}>
              Reset to Default
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instruction">Master Instruction Prompt</Label>
            <Textarea
              id="instruction"
              value={instructionText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter the global AI instruction..."
              rows={20}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Characters: {instructionText.length} | Estimated tokens: ~{Math.ceil(instructionText.length / 4)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            How This Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">Instruction Hierarchy</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li><strong>Global Instruction</strong> (this page) - Applied to ALL types</li>
                  <li><strong>Type-Specific Instructions</strong> - Added per affidavit type</li>
                  <li><strong>Template + Questions</strong> - Extracted from uploaded documents</li>
                  <li><strong>User Answers</strong> - Filled by the applicant</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Best Practices</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Include T&T-specific legal references</li>
                  <li>Specify the exact document structure required</li>
                  <li>Define output format (HTML for PDF generation)</li>
                  <li>List critical rules (no false statements, etc.)</li>
                  <li>Keep it general - specifics go in type settings</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Version Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version Management</CardTitle>
          <CardDescription>
            Create a new version to keep a history of changes. The new version will become active automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleCreateVersion}
            disabled={isSaving || !hasChanges}
          >
            {isCreatingVersion ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <History className="h-4 w-4 mr-2" />
            )}
            Save as New Version (v{instruction ? `${parseInt(instruction.version.split('.')[0])}.${parseInt(instruction.version.split('.')[1] || '0') + 1}` : '1.1'})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
