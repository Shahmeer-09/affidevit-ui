import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardHeader, TierBadge } from '@/components/features';
import { QuestionBuilder } from '@/components/admin';
import { PolicyGenerator } from '@/components/admin/PolicyGenerator';
import { DisallowedPhrasesEditor } from '@/components/admin/DisallowedPhrasesEditor';
import { DecisionTreeEditor } from '@/components/admin/DecisionTreeEditor';
import {
  useGetAdminAffidavitTypeQuery,
  useCreateAffidavitTypeMutation,
  useUpdateAffidavitTypeMutation,
  type IntakeQuestion,
} from '@/store/api/adminApi';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Settings,
  ListChecks,
  AlertCircle,
  Upload,
  Ban,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AffidavitTier, DefaultMode } from '@/types';

const TIER_OPTIONS: { value: AffidavitTier; label: string; description: string }[] = [
  { value: 'low', label: 'Low Variability', description: 'Simple, standard documents' },
  { value: 'medium', label: 'Medium Variability', description: 'Moderate complexity' },
  { value: 'high_precision', label: 'High Precision', description: 'Complex, precise requirements' },
  { value: 'sensitive', label: 'Sensitive', description: 'High-risk, always reviewed' },
];

const MODE_OPTIONS: { value: DefaultMode; label: string; description: string }[] = [
  { value: 'instant', label: 'Instant Draft', description: 'AI generates draft immediately' },
  { value: 'review_first', label: 'Review First', description: 'Requires reviewer approval' },
  { value: 'intake_only', label: 'Intake Only', description: 'Manual drafting required' },
];

interface FormData {
  name: string;
  description: string;
  tier: AffidavitTier;
  default_mode: DefaultMode;
  enabled_on_homepage: boolean;
  is_active: boolean;
  intake_schema: IntakeQuestion[];
  template_html: string;
  disallowed_phrases: string[];
  policy_json: {
    template?: string;
    system_prompt?: string;
    examples?: string[];
    disallowed_phrases?: string[];
  };
}

const defaultFormData: FormData = {
  name: '',
  description: '',
  tier: 'medium',
  default_mode: 'review_first',
  enabled_on_homepage: false,
  is_active: true,
  intake_schema: [],
  template_html: '',
  disallowed_phrases: [],
  policy_json: {
    template: '',
    system_prompt: '',
    examples: [],
    disallowed_phrases: [],
  },
};

export function AdminTypeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  // API hooks
  const { data: existingType, isLoading: isLoadingType } = useGetAdminAffidavitTypeQuery(
    Number(id),
    { skip: isNew }
  );
  const [createType, { isLoading: isCreating }] = useCreateAffidavitTypeMutation();
  const [updateType, { isLoading: isUpdating }] = useUpdateAffidavitTypeMutation();

  // Initialize form data from existing type or defaults
  const initialFormData = useMemo<FormData>(() => {
    if (existingType) {
      return {
        name: existingType.name,
        description: existingType.description,
        tier: existingType.tier,
        default_mode: existingType.default_mode,
        enabled_on_homepage: existingType.enabled_on_homepage,
        is_active: existingType.is_active,
        intake_schema: existingType.intake_schema || [],
        template_html: existingType.template_html || '',
        disallowed_phrases: existingType.disallowed_phrases || [],
        policy_json: (existingType.policy_json as FormData['policy_json']) || defaultFormData.policy_json,
      };
    }
    return defaultFormData;
  }, [existingType]);

  // Form state - uses key pattern to reset when data loads
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update form when data loads (only once)
  if (existingType && !isInitialized) {
    setFormData(initialFormData);
    setIsInitialized(true);
  }

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handlePolicyChange = (field: keyof FormData['policy_json'], value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      policy_json: { ...prev.policy_json, [field]: value },
    }));
    setHasChanges(true);
  };

  const handleQuestionsChange = (questions: IntakeQuestion[]) => {
    handleChange('intake_schema', questions);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      setActiveTab('basic');
      return;
    }

    try {
      if (isNew) {
        const newType = await createType({
          name: formData.name,
          description: formData.description,
          tier: formData.tier,
          default_mode: formData.default_mode,
          enabled_on_homepage: formData.enabled_on_homepage,
          is_active: formData.is_active,
          intake_schema: formData.intake_schema,
          policy_json: formData.policy_json,
        }).unwrap();
        toast.success('Affidavit type created! Now you can add templates and configure AI policy.');
        setHasChanges(false);
        // Navigate to the edit page of the new type so user can add templates
        navigate(`/admin/affidavit-types/${newType.id}`, { replace: true });
        return;
      } else {
        await updateType({
          id: Number(id),
          data: {
            name: formData.name,
            description: formData.description,
            tier: formData.tier,
            default_mode: formData.default_mode,
            enabled_on_homepage: formData.enabled_on_homepage,
            is_active: formData.is_active,
            intake_schema: formData.intake_schema,
            template_html: formData.template_html,
            disallowed_phrases: formData.disallowed_phrases,
            policy_json: formData.policy_json,
          },
        }).unwrap();
        toast.success('Affidavit type updated successfully');
      }
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save affidavit type');
      console.error('Save error:', error);
    }
  };

  const isSaving = isCreating || isUpdating;

  if (!isNew && isLoadingType) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title={isNew ? 'Create Affidavit Type' : `Edit: ${formData.name}`}
        description={isNew ? 'Configure a new affidavit type' : 'Modify affidavit type settings'}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/affidavit-types')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isNew ? 'Create' : 'Save Changes'}
          </Button>
        </div>
      </DashboardHeader>

      {/* Status indicators */}
      {!isNew && existingType && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={formData.is_active ? 'default' : 'secondary'}>
              {formData.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tier:</span>
            <TierBadge tier={formData.tier} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Questions:</span>
            <Badge variant="outline">{formData.intake_schema.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Version:</span>
            <Badge variant="outline">v{existingType.policy_version}</Badge>
          </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Questions</span>
            <Badge variant="secondary" className="ml-1 text-xs">{formData.intake_schema.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="discovery" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Discovery</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                General details about this affidavit type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Name Change Affidavit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe when this affidavit type should be used..."
                  rows={3}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(v) => handleChange('tier', v as AffidavitTier)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <div className="font-medium">{opt.label}</div>
                            <div className="text-xs text-muted-foreground">{opt.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Mode</Label>
                  <Select
                    value={formData.default_mode}
                    onValueChange={(v) => handleChange('default_mode', v as DefaultMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <div className="font-medium">{opt.label}</div>
                            <div className="text-xs text-muted-foreground">{opt.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertTitle>Tip: Automatic Question Generation</AlertTitle>
            <AlertDescription>
              Upload example documents in the <strong>Templates</strong> tab first to automatically generate 
              intake questions using AI. Once generated, you can edit, reorder, or add more questions here manually.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Intake Questions</CardTitle>
              <CardDescription>
                Define the questions users will answer when creating a request.
                Questions are shown in the order listed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionBuilder
                questions={formData.intake_schema}
                onChange={handleQuestionsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {id && id !== 'new' && !isNaN(Number(id)) ? (
            <PolicyGenerator
              affidavitTypeId={id}
              onPolicyGenerated={(policy, questions) => {
                // Update the policy_json with the generated policy
                setFormData((prev) => {
                  // Intelligently merge questions - only add NEW ones
                  const existingIds = new Set(prev.intake_schema.map(q => q.id?.toLowerCase()));
                  const existingLabels = new Set(prev.intake_schema.map(q => q.label?.toLowerCase()));
                  
                  const newQuestions = questions.filter(q => {
                    const qId = q.id?.toLowerCase() || '';
                    const qLabel = q.label?.toLowerCase() || '';
                    // Only include if both id and label don't already exist
                    return !existingIds.has(qId) && !existingLabels.has(qLabel);
                  });
                  
                  // Assign proper order to new questions
                  const startOrder = prev.intake_schema.length;
                  const questionsWithOrder = newQuestions.map((q, idx) => ({
                    ...q,
                    order: startOrder + idx + 1,
                  }));
                  
                  return {
                    ...prev,
                    // Capture template_html and disallowed_phrases from the policy result
                    template_html: policy.template_html || prev.template_html,
                    disallowed_phrases: policy.disallowed_phrases || prev.disallowed_phrases,
                    policy_json: {
                      ...prev.policy_json,
                      ...policy,
                    },
                    // Only add truly new questions
                    intake_schema: questionsWithOrder.length > 0 
                      ? [...prev.intake_schema, ...questionsWithOrder]
                      : prev.intake_schema,
                  };
                });
                
                // Show toast about what happened
                const existingIds = new Set(formData.intake_schema.map(q => q.id?.toLowerCase()));
                const existingLabels = new Set(formData.intake_schema.map(q => q.label?.toLowerCase()));
                const newCount = questions.filter(q => 
                  !existingIds.has(q.id?.toLowerCase() || '') && 
                  !existingLabels.has(q.label?.toLowerCase() || '')
                ).length;
                
                if (newCount > 0) {
                  toast.info(`Added ${newCount} new question(s). ${questions.length - newCount} already existed. Click "Save Changes" to persist.`);
                } else if (questions.length > 0) {
                  toast.info('All detected fields already exist. Click "Save Changes" to persist template updates.');
                } else {
                  toast.info('Policy generated. Click "Save Changes" to persist.');
                }
                
                setHasChanges(true);
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Templates & AI Policy Generation</CardTitle>
                <CardDescription>
                  Save the affidavit type first, then you can upload example documents
                  and use AI to generate policies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Please save the affidavit type first before uploading templates.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Discovery Tab */}
        <TabsContent value="discovery" className="space-y-6">
          {id && id !== 'new' && !isNaN(Number(id)) ? (
            <DecisionTreeEditor affidavitTypeId={id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Help Me Choose Configuration</CardTitle>
                <CardDescription>
                  Save the affidavit type first to configure how users discover it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Please save the affidavit type first before configuring discovery paths.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility & Status</CardTitle>
              <CardDescription>
                Control how this affidavit type appears to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to create requests of this type
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => handleChange('is_active', v)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Featured on Homepage</Label>
                  <p className="text-sm text-muted-foreground">
                    Show prominently on the landing page
                  </p>
                </div>
                <Switch
                  checked={formData.enabled_on_homepage}
                  onCheckedChange={(v) => handleChange('enabled_on_homepage', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Customize how AI generates drafts for this affidavit type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Instructions</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.policy_json.system_prompt || ''}
                  onChange={(e) => handlePolicyChange('system_prompt', e.target.value)}
                  placeholder="Additional instructions for the AI when generating drafts for this type..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Provide specific guidance for this affidavit type. A global AI prompt is already applied.
                </p>
              </div>
            </CardContent>
          </Card>

          {id && id !== 'new' && !isNaN(Number(id)) ? (
            <DisallowedPhrasesEditor affidavitTypeId={id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Disallowed Phrases</CardTitle>
                <CardDescription>
                  Save the affidavit type first to manage disallowed phrases.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Ban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Please save the affidavit type first before managing disallowed phrases.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
