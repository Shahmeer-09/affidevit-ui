import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  useGetValidationRulesQuery,
  useUpdateValidationRulesMutation,
  useGetAdminAffidavitTypeQuery,
  type ValidationRule,
  type ComparisonClause,
} from '@/store/api/adminApi';
import { Plus, Trash2, Save, Loader2, ShieldCheck, ArrowRightLeft, Asterisk } from 'lucide-react';
import { toast } from 'sonner';

const RULE_TYPES = [
  { value: 'comparison', label: 'Field Comparison', description: 'Compare two fields (e.g., age >= duration)' },
  { value: 'required_if', label: 'Required If', description: 'Require a field when another has a specific value' },
  { value: 'disallow_contains', label: 'Disallow Text', description: 'Flag if a field contains disallowed text (or matches a regex)' },
] as const;

const OPERATORS = [
  { value: 'gte', label: 'Primary >= Secondary' },
  { value: 'lte', label: 'Primary <= Secondary' },
  { value: 'gt', label: 'Primary > Secondary' },
  { value: 'lt', label: 'Primary < Secondary' },
  { value: 'eq', label: 'Primary == Secondary' },
  { value: 'ne', label: 'Primary != Secondary' },
] as const;

const COMPARE_AS = [
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'string', label: 'Text' },
] as const;

function generateRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getEmptyRule(type: ValidationRule['type']): ValidationRule {
  if (type === 'comparison') {
    return {
      id: generateRuleId(),
      type: 'comparison',
      primary_field: '',
      secondary_field: '',
      operator: 'gte',
      compare_as: 'number',
      comparisons: [
        {
          left_field: '',
          operator: 'gte',
          right_field: '',
          compare_as: 'number',
        },
      ],
      negate: false,
      target_field: '',
      message: '',
    };
  }
  return {
    id: generateRuleId(),
    type: 'required_if',
    primary_field: '',
    condition_field: '',
    condition_value: '',
    required_field: '',
    target_field: '',
    message: '',
  };
}

function getEmptyDisallowRule(): ValidationRule {
  return {
    id: generateRuleId(),
    type: 'disallow_contains',
    primary_field: '',
    field: '',
    pattern: '',
    mode: 'contains',
    case_sensitive: false,
    target_field: '',
    message: '',
  };
}

interface ValidationRulesEditorProps {
  affidavitTypeId: string;
}

function normalizeRule(rule: ValidationRule): ValidationRule {
  if (rule.type !== 'comparison') {
    return rule;
  }
  if (Array.isArray(rule.comparisons) && rule.comparisons.length > 0) {
    return rule;
  }
  if (rule.primary_field && rule.secondary_field) {
    return {
      ...rule,
      comparisons: [
        {
          left_field: rule.primary_field,
          operator: rule.operator || 'gte',
          right_field: rule.secondary_field,
          compare_as: rule.compare_as || 'number',
        },
      ],
    };
  }
  return {
    ...rule,
    comparisons: [
      {
        left_field: '',
        operator: rule.operator || 'gte',
        right_field: '',
        compare_as: rule.compare_as || 'number',
      },
    ],
  };
}

function toJoinWith(value: string | undefined): 'AND' | 'OR' {
  return String(value || 'AND').toUpperCase() === 'OR' ? 'OR' : 'AND';
}

export function ValidationRulesEditor({ affidavitTypeId }: ValidationRulesEditorProps) {
  const typeId = Number(affidavitTypeId);
  const { data: rulesData, isLoading } = useGetValidationRulesQuery(typeId);
  const { data: affidavitType } = useGetAdminAffidavitTypeQuery(typeId);
  const [updateRules, { isLoading: isSaving }] = useUpdateValidationRulesMutation();

  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize rules from API data
  if (rulesData && !initialized) {
    setRules((rulesData.validation_rules || []).map(normalizeRule));
    setInitialized(true);
  }

  // Get field options from intake_schema
  const fieldOptions = (affidavitType?.intake_schema || []).map((q) => ({
    value: q.field_name || q.id,
    label: q.label,
  }));

  const addRule = (type: ValidationRule['type']) => {
    const newRule = type === 'disallow_contains' ? getEmptyDisallowRule() : getEmptyRule(type);
    setRules((prev) => [...prev, newRule]);
    setHasChanges(true);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateRule = (index: number, updates: Partial<ValidationRule>) => {
    setRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, ...updates } : rule))
    );
    setHasChanges(true);
  };

  const addClause = (ruleIndex: number) => {
    setRules((prev) =>
      prev.map((r, idx) => {
        if (idx !== ruleIndex || r.type !== 'comparison') return r;
        const next: ComparisonClause = {
          left_field: '',
          operator: 'gte',
          right_field: '',
          compare_as: (r.compare_as || 'number') as ComparisonClause['compare_as'],
          join_with: 'AND',
        };
        const comparisons = Array.isArray(r.comparisons) ? r.comparisons : [];
        return { ...r, comparisons: [...comparisons, next] };
      })
    );
    setHasChanges(true);
  };

  const removeClause = (ruleIndex: number, clauseIndex: number) => {
    setRules((prev) =>
      prev.map((r, idx) => {
        if (idx !== ruleIndex || r.type !== 'comparison') return r;
        const comparisons = Array.isArray(r.comparisons) ? r.comparisons : [];
        const nextComparisons = comparisons.filter((_, i) => i !== clauseIndex);
        return { ...r, comparisons: nextComparisons.length ? nextComparisons : comparisons };
      })
    );
    setHasChanges(true);
  };

  const updateClause = (ruleIndex: number, clauseIndex: number, updates: Partial<ComparisonClause>) => {
    setRules((prev) =>
      prev.map((r, idx) => {
        if (idx !== ruleIndex || r.type !== 'comparison') return r;
        const comparisons = Array.isArray(r.comparisons) ? r.comparisons : [];
        const nextComparisons = comparisons.map((c, i) => (i === clauseIndex ? { ...c, ...updates } : c));
        return { ...r, comparisons: nextComparisons };
      })
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Basic validation
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!rule.message?.trim()) {
        toast.error(`Rule ${i + 1} is missing an error message`);
        return;
      }
      if (rule.type === 'comparison') {
        const comparisons = Array.isArray(rule.comparisons) ? rule.comparisons : [];
        if (comparisons.length === 0) {
          toast.error(`Rule ${i + 1}: Add at least one comparison`);
          return;
        }
        for (let c = 0; c < comparisons.length; c++) {
          const clause = comparisons[c];
          if (!clause.left_field || !clause.right_field) {
            toast.error(`Rule ${i + 1}, comparison ${c + 1}: Choose both left and right fields`);
            return;
          }
        }
      } else if (rule.type === 'required_if') {
        if (!rule.condition_field || !rule.required_field) {
          toast.error(`Rule ${i + 1}: Condition field and required field are required`);
          return;
        }
      } else if (rule.type === 'disallow_contains') {
        const fieldName = rule.field || rule.primary_field;
        if (!fieldName || !rule.pattern?.trim()) {
          toast.error(`Rule ${i + 1}: Field and pattern are required`);
          return;
        }
      }
    }

    try {
      const payloadRules = rules.map((r) => {
        if (r.type !== 'comparison') return r;
        const comparisons = Array.isArray(r.comparisons) ? r.comparisons : [];
        const primary_field = r.primary_field || comparisons[0]?.left_field || '';
        const secondary_field = r.secondary_field || comparisons[0]?.right_field || '';
        const operator = r.operator || comparisons[0]?.operator || 'gte';
        const compare_as = r.compare_as || comparisons[0]?.compare_as || 'number';
        return {
          ...r,
          primary_field,
          secondary_field,
          operator,
          compare_as,
          comparisons: comparisons.map((c, idx) => ({
            ...c,
            join_with: idx === 0 ? undefined : toJoinWith(c.join_with),
          })),
        };
      });

      const normalizedPayload = payloadRules.map((r) => {
        if (r.type !== 'disallow_contains') return r;
        const fieldName = r.field || r.primary_field;
        return {
          ...r,
          field: fieldName,
          primary_field: fieldName || '',
          mode: r.mode || 'contains',
          case_sensitive: !!r.case_sensitive,
        };
      });

      await updateRules({ id: typeId, rules: normalizedPayload }).unwrap();
      toast.success('Validation rules saved successfully');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to save validation rules');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Validation Rules
              </CardTitle>
              <CardDescription>
                Define custom validation rules for this affidavit type. These rules are checked when a user submits the form,
                in addition to the generic checks (gibberish, future dates, ID format).
              </CardDescription>
            </div>
            {hasChanges && (
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Rules
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tips section */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
            <div className="text-sm font-semibold text-blue-900 flex items-start gap-2">
              <span>💡</span>
              <span>Tips for defining rules:</span>
            </div>
            <ul className="text-xs text-blue-800 space-y-1.5 ml-6">
              <li><strong>Left field gets the error:</strong> For comparisons, validation errors are attached to the <strong>left field</strong>. If both sides share a field, put that field on the left so users know where to fix it.</li>
              <li><strong>Using AND:</strong> Click <strong>+ Add Comparison</strong> to combine multiple conditions with AND. Example: <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-mono">age ≥ 18 AND duration ≤ 10 years</code></li>
              <li><strong>Common field example:</strong> If validating "start_date" and "end_date", put <strong>start_date</strong> on the left and <strong>end_date</strong> on the right. If they're the same field on both sides, it still goes to the left field.</li>
              <li><strong>Field references:</strong> Only fields in the intake schema are available. Ensure the field exists before creating a rule that references it.</li>
            </ul>
          </div>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No custom validation rules defined yet.</p>
              <p className="text-xs mt-1">Add rules to enforce field comparisons or conditional requirements.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, index) => (
                <Card key={rule.id || index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.type === 'comparison' ? 'default' : 'secondary'}>
                          {rule.type === 'comparison' ? (
                            <><ArrowRightLeft className="h-3 w-3 mr-1" /> Comparison</>
                          ) : (
                            <><Asterisk className="h-3 w-3 mr-1" /> Required If</>
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Rule {index + 1}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeRule(index)} className="h-7 w-7 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {rule.type === 'comparison' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!!rule.negate}
                                onCheckedChange={(v) => updateRule(index, { negate: v })}
                              />
                              <span className="text-xs text-muted-foreground">NOT</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => addClause(index)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Comparison
                          </Button>
                        </div>

                        {(Array.isArray(rule.comparisons) ? rule.comparisons : []).map((clause, cIdx) => (
                          <div key={`${rule.id || index}-clause-${cIdx}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                            {cIdx > 0 ? (
                              <div className="space-y-1">
                                <Label className="text-xs">Join</Label>
                                <Select
                                  value={toJoinWith(clause.join_with)}
                                  onValueChange={(v) => updateClause(index, cIdx, { join_with: v as ComparisonClause['join_with'] })}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AND">AND</SelectItem>
                                    <SelectItem value="OR">OR</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="hidden lg:block" />
                            )}

                            <div className="space-y-1">
                              <Label className="text-xs">Left Field</Label>
                              <Select
                                value={clause.left_field}
                                onValueChange={(v) => {
                                  updateClause(index, cIdx, { left_field: v });
                                  if (!rule.target_field) {
                                    updateRule(index, { target_field: v });
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldOptions.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Operator</Label>
                              <Select
                                value={clause.operator || 'gte'}
                                onValueChange={(v) => updateClause(index, cIdx, { operator: v as ComparisonClause['operator'] })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {OPERATORS.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Right Field</Label>
                              <Select
                                value={clause.right_field}
                                onValueChange={(v) => updateClause(index, cIdx, { right_field: v })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldOptions.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Compare As</Label>
                              <Select
                                value={clause.compare_as || rule.compare_as || 'number'}
                                onValueChange={(v) => updateClause(index, cIdx, { compare_as: v as ComparisonClause['compare_as'] })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COMPARE_AS.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeClause(index, cIdx)}
                                disabled={(rule.comparisons?.length || 0) <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {rule.type === 'disallow_contains' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Field</Label>
                          <Select
                            value={rule.field || rule.primary_field || ''}
                            onValueChange={(v) => updateRule(index, { field: v, primary_field: v, target_field: rule.target_field || v })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldOptions.map((f) => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Mode</Label>
                          <Select
                            value={rule.mode || 'contains'}
                            onValueChange={(v) => updateRule(index, { mode: v as ValidationRule['mode'] })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="regex">Regex</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Pattern</Label>
                          <Input
                            className="h-8 text-xs"
                            value={rule.pattern || ''}
                            onChange={(e) => updateRule(index, { pattern: e.target.value })}
                            placeholder={rule.mode === 'regex' ? 'e.g. \\b(lol|haha)\\b' : 'e.g. lol'}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Case Sensitive</Label>
                          <div className="flex items-center gap-2 h-8">
                            <Switch checked={!!rule.case_sensitive} onCheckedChange={(v) => updateRule(index, { case_sensitive: v })} />
                            <span className="text-xs text-muted-foreground">Match case</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {rule.type === 'required_if' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">When this field...</Label>
                          <Select value={rule.condition_field || ''} onValueChange={(v) => updateRule(index, { condition_field: v })}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldOptions.map((f) => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">...equals this value</Label>
                          <Input
                            className="h-8 text-xs"
                            value={rule.condition_value || ''}
                            onChange={(e) => updateRule(index, { condition_value: e.target.value })}
                            placeholder='e.g., "yes"'
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Then require this field</Label>
                          <Select value={rule.required_field || ''} onValueChange={(v) => updateRule(index, { required_field: v, primary_field: v, target_field: v })}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldOptions.map((f) => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">Error Message (shown to user)</Label>
                      <Input
                        className="h-8 text-xs"
                        value={rule.message}
                        onChange={(e) => updateRule(index, { message: e.target.value })}
                        placeholder="e.g., You cannot have lived somewhere longer than your age."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            {RULE_TYPES.map((rt) => (
              <Button key={rt.value} variant="outline" size="sm" onClick={() => addRule(rt.value)}>
                <Plus className="h-4 w-4 mr-1" />
                {rt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
