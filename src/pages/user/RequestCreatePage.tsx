import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TierBadge } from '@/components/features';
import { 
  useGetAffidavitTypeQuery, 
  useCreateRequestMutation, 
  useSubmitRequestMutation,
  useAutoSaveRequestMutation,
  useValidateRequestInputMutation
} from '@/store/api/userApi';
import { ROUTES } from '@/lib/constants';
import { ArrowLeft, ArrowRight, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { IntakeQuestion } from '@/types';

type DraftState = {
  answers: Record<string, unknown>;
  lastSaved: Date | null;
  requestId: number | null;
};

const loadDraft = (typeId?: string): DraftState => {
  // Check for reload to implement "hard refresh" behavior
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceNavigationTiming;
      if (navEntry.type === 'reload') {
        return { answers: {}, lastSaved: null, requestId: null };
      }
    }
  } catch (e) {
    // Ignore
  }

  if (!typeId) {
    return { answers: {}, lastSaved: null, requestId: null };
  }
  const savedDraft = localStorage.getItem(`draft_${typeId}`);
  if (!savedDraft) {
    return { answers: {}, lastSaved: null, requestId: null };
  }
  try {
    const parsed = JSON.parse(savedDraft);
    return {
      answers: parsed.answers || {},
      lastSaved: parsed.lastSaved ? new Date(parsed.lastSaved) : null,
      requestId: parsed.requestId || null,
    };
  } catch {
    return { answers: {}, lastSaved: null, requestId: null };
  }
};

export function RequestCreatePage() {
  const { typeId } = useParams();
  return <RequestCreateForm key={typeId ?? 'unknown'} typeId={typeId} />;
}

function RequestCreateForm({ typeId }: { typeId?: string }) {
  const navigate = useNavigate();
  const initialDraft = loadDraft(typeId);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialDraft.answers);
  const [lastSaved, setLastSaved] = useState<Date | null>(initialDraft.lastSaved);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [requestId, setRequestId] = useState<number | null>(initialDraft.requestId);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: type, isLoading: isLoadingType, error: typeError } = useGetAffidavitTypeQuery(Number(typeId), {
    skip: !typeId || isNaN(Number(typeId)),
    refetchOnMountOrArgChange: true,
  });
  const [createRequest, { isLoading: isCreating }] = useCreateRequestMutation();
  const [autoSaveRequest] = useAutoSaveRequestMutation();
  const [submitRequest] = useSubmitRequestMutation();
  const [validateInput, { isLoading: isValidating }] = useValidateRequestInputMutation();

  useEffect(() => {
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming;
        if (navEntry.type === 'reload' && typeId) {
          localStorage.removeItem(`draft_${typeId}`);
        }
      }
    } catch (e) {
      // Ignore
    }
  }, [typeId]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Prefill declaration date fields with current date (readonly)
  useEffect(() => {
    if (!type?.intake_schema) return;
    
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' }); // "February"
    const currentDay = now.getDate().toString().padStart(2, '0'); // "05"
    
    // Check if any declaration date fields exist in the schema
    const schema = type.intake_schema;
    const hasDeclarationYear = schema.some((q: IntakeQuestion) => 
      (q.id || q.field_name || '').toLowerCase().includes('declaration_year'));
    const hasDeclarationMonth = schema.some((q: IntakeQuestion) => 
      (q.id || q.field_name || '').toLowerCase().includes('declaration_month'));
    const hasDeclarationDay = schema.some((q: IntakeQuestion) => 
      (q.id || q.field_name || '').toLowerCase().includes('declaration_day'));
    const hasDeclarationDate = schema.some((q: IntakeQuestion) => 
      (q.id || q.field_name || '').toLowerCase() === 'declaration_date');
    
    const prefillValues: Record<string, string> = {};
    
    // Find exact field IDs and prefill
    schema.forEach((q: IntakeQuestion) => {
      const fieldId = (q.id || q.field_name || '').toLowerCase();
      if (fieldId.includes('declaration_year')) {
        prefillValues[q.id || q.field_name || ''] = currentYear;
      } else if (fieldId.includes('declaration_month')) {
        prefillValues[q.id || q.field_name || ''] = currentMonth;
      } else if (fieldId.includes('declaration_day')) {
        prefillValues[q.id || q.field_name || ''] = currentDay;
      } else if (fieldId === 'declaration_date') {
        prefillValues[q.id || q.field_name || ''] = now.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    });
    
    // Only update if there are values to prefill and they're not already set
    if (Object.keys(prefillValues).length > 0) {
      setAnswers(prev => {
        const updated = { ...prev };
        let changed = false;
        for (const [key, value] of Object.entries(prefillValues)) {
          if (!prev[key]) {
            updated[key] = value;
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }
  }, [type?.intake_schema]);

  if (!typeId || isNaN(Number(typeId))) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Affidavit Type</h2>
            <p className="text-muted-foreground mb-4">Please select a valid affidavit type.</p>
            <Button asChild><Link to={ROUTES.AFFIDAVIT_TYPES}>Browse All Types</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingType) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (typeError || !type) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Affidavit Type Not Found</h2>
            <p className="text-muted-foreground mb-4">The affidavit type you're looking for doesn't exist.</p>
            <Button asChild><Link to={ROUTES.AFFIDAVIT_TYPES}>Browse All Types</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allQuestions = type.intake_schema || [];
  
  const questionFieldMap = new Map<string, IntakeQuestion>();
  allQuestions.forEach((q, idx) => {
    const questionId = q.id || `question_${idx}`;
    questionFieldMap.set(questionId, q);
    if (q.field_name) {
      questionFieldMap.set(q.field_name, q);
    }
  });
  
  const getAnswerKey = (question: IntakeQuestion, idx?: number): string => {
    return question.id || question.field_name || `question_${idx}`;
  };
  
  const shouldShowQuestion = (question: IntakeQuestion): boolean => {
    if (!question.show_if) {
      return true;
    }
    
    const { field, value } = question.show_if;
    
    let fieldAnswer = answers[field];
    
    if (fieldAnswer === undefined) {
      const parentQuestion = questionFieldMap.get(field);
      if (parentQuestion) {
        const parentKey = getAnswerKey(parentQuestion);
        fieldAnswer = answers[parentKey];
      }
    }
    
    if (!value || value === '') {
      return fieldAnswer !== undefined && fieldAnswer !== '' && fieldAnswer !== null;
    }
    
    if (Array.isArray(fieldAnswer)) {
      const requiredValues = Array.isArray(value) ? value : [value];
      return requiredValues.some(v => fieldAnswer.includes(v));
    }
    
    if (Array.isArray(value)) {
      return value.includes(fieldAnswer as string);
    }
    
    return fieldAnswer === value;
  };
  
  const visibleQuestions = allQuestions.filter((q) => shouldShowQuestion(q));
  
  const questionsPerStep = 3;
  const totalSteps = Math.max(1, Math.ceil(visibleQuestions.length / questionsPerStep));
  const currentQuestions = visibleQuestions.slice(currentStep * questionsPerStep, (currentStep + 1) * questionsPerStep);
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleFieldChange = (fieldId: string, value: unknown) => {
    const newAnswers = { ...answers, [fieldId]: value };
    setAnswers(newAnswers);

    if (value && fieldErrors.size > 0) {
      const question = allQuestions.find(q => (q.id || q.field_name) === fieldId);
      if (question && fieldErrors.has(question.label)) {
        const newFieldErrors = new Set(fieldErrors);
        newFieldErrors.delete(question.label);
        setFieldErrors(newFieldErrors);
        
        setValidationErrors(prev => prev.filter(err => !err.includes(question.label)));
      }
    }

    if (typeId) {
      const now = new Date();
      setLastSaved(now);
      localStorage.setItem(`draft_${typeId}`, JSON.stringify({
        answers: newAnswers,
        requestId,
        lastSaved: now.toISOString(),
      }));

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        if (!requestId) {
          try {
            const result = await createRequest({ 
              affidavit_type: Number(typeId),
              answers_json: newAnswers 
            }).unwrap();
            
            setRequestId(result.id);
            localStorage.setItem(`draft_${typeId}`, JSON.stringify({
              answers: newAnswers,
              requestId: result.id,
              lastSaved: new Date().toISOString(),
            }));
          } catch (err) {
            console.error('Failed to auto-create draft', err);
          }
        } else {
          try {
            await autoSaveRequest({
              id: requestId,
              data: { answers_json: newAnswers }
            }).unwrap();
          } catch (err: any) {
            console.error('Failed to auto-save', err);
            // If request is not found (e.g. deleted or invalid ID), reset requestId
            if (err?.status === 404) {
              setRequestId(null);
              if (typeId) {
                // Keep answers but remove ID from draft
                localStorage.setItem(`draft_${typeId}`, JSON.stringify({
                  answers: newAnswers,
                  requestId: null,
                  lastSaved: new Date().toISOString(),
                }));
              }
            }
          }
        }
      }, 2000);
    }
  };

  const handleCheckboxChange = (fieldId: string, optionValue: string, checked: boolean) => {
    const currentValues = (answers[fieldId] as string[]) || [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, optionValue];
    } else {
      newValues = currentValues.filter(v => v !== optionValue);
    }
    
    handleFieldChange(fieldId, newValues);
  };

  const handleNext = () => {
    const currentFields = visibleQuestions.slice(currentStep * questionsPerStep, (currentStep + 1) * questionsPerStep);
    const errors: string[] = [];
    const errorFields = new Set<string>();
    
    currentFields.forEach(field => {
      if (field.required) {
        const fieldKey = field.id || field.field_name || `question_${allQuestions.indexOf(field)}`;
        const value = answers[fieldKey];
        
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          errors.push(`${field.label} is required`);
          errorFields.add(field.label);
        }
      }
    });
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setFieldErrors(errorFields);
      toast.error('Please fill in all required fields');
      return;
    }

    setValidationErrors([]);
    setFieldErrors(new Set());

    if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!typeId) return;
    setIsSubmitting(true);
    setValidationErrors([]);
    setFieldErrors(new Set());
    
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    try {
      // Step 1: Validate inputs BEFORE submission using AI
      const validationResult = await validateInput({
        affidavit_type_id: Number(typeId),
        answers_json: answers
      }).unwrap();

      // If validation fails, show the invalid fields and block submission
      if (!validationResult.all_valid) {
        const errorMessages: string[] = [];
        const errorFieldSet = new Set<string>();

        // Process validation notes to show user-friendly errors
        validationResult.validation_notes.forEach((note) => {
          const fieldLabel = allQuestions.find(q => 
            q.field_name === note.field || q.id === note.field
          )?.label || note.field;
          
          errorFieldSet.add(fieldLabel);
          
          let errorMsg = `**${fieldLabel}**: ${note.issue}`;
          if (note.example) {
            errorMsg += ` (e.g., "${note.example}")`;
          }
          errorMessages.push(errorMsg);
        });

        setValidationErrors(errorMessages);
        setFieldErrors(errorFieldSet);
        
        toast.error('Please fix the following issues:', {
          description: errorMessages.map(m => m.replace(/\*\*/g, '')).join('\n'),
          duration: 10000,
        });
        
        setIsSubmitting(false);
        return; // Block submission
      }

      // Step 2: Create or update the request
      let idToSubmit = requestId;

      if (!idToSubmit) {
        const result = await createRequest({ 
          affidavit_type: Number(typeId),
          answers_json: answers 
        }).unwrap();
        idToSubmit = result.id;
      } else {
        await autoSaveRequest({
          id: idToSubmit,
          data: { answers_json: answers }
        }).unwrap();
      }
      
      // Step 3: Submit the request for AI processing
      await submitRequest(idToSubmit).unwrap();
      
      localStorage.removeItem(`draft_${typeId}`);
      
      navigate(ROUTES.REQUEST_STATUS.replace(':id', String(idToSubmit)));
    } catch (error: unknown) {
      const errorData = (error as { data?: Record<string, unknown> })?.data;
      if (errorData) {
        const errorMessages: string[] = [];
        const errorFieldSet = new Set<string>();
        
        if (errorData.answers_json) {
          const answersErrors = Array.isArray(errorData.answers_json) 
            ? errorData.answers_json 
            : [errorData.answers_json];
          answersErrors.forEach((msg) => {
            if (typeof msg === 'string') {
              errorMessages.push(msg);
            }
            const match = msg.match(/Missing required fields?:\s*(.+)/i);
            if (match) {
              const fields = match[1].split(',').map((f: string) => f.trim());
              fields.forEach((f: string) => errorFieldSet.add(f));
            }
          });
        }
        
        Object.entries(errorData).forEach(([key, value]) => {
          if (key !== 'answers_json') {
            const msgs = Array.isArray(value) ? value : [value];
            msgs.forEach((msg) => {
              if (typeof msg === 'string') errorMessages.push(`${key}: ${msg}`);
            });
          }
        });
        
        if (errorMessages.length > 0) {
          setValidationErrors(errorMessages);
          setFieldErrors(errorFieldSet);
          toast.error('Validation Error', {
            description: errorMessages.join('\n'),
            duration: 6000,
          });
        } else {
          toast.error('Submission failed. Please try again.');
        }
      } else {
        toast.error('Submission failed. Please check your connection and try again.');
      }
      
      setIsSubmitting(false);
    }
  };

  const renderField = (field: IntakeQuestion, fieldIndex: number) => {
    // Use id if available, otherwise fallback to field_name or generate from index
    const fieldKey = field.id || field.field_name || `question_${fieldIndex}`;
    const value = answers[fieldKey];
    const validation = field.validation;
    
    // Check if this is a declaration date field (should be readonly and prefilled)
    const fieldKeyLower = fieldKey.toLowerCase();
    const isDeclarationDateField = 
      fieldKeyLower.includes('declaration_year') ||
      fieldKeyLower.includes('declaration_month') ||
      fieldKeyLower.includes('declaration_day') ||
      fieldKeyLower === 'declaration_date';

    // Helper to filter input based on input_mode
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Don't allow changes to declaration date fields
      if (isDeclarationDateField) return;
      
      let newValue = e.target.value;
      
      // Apply input_mode restrictions in real-time
      if (validation?.input_mode === 'text_only') {
        // Only allow letters, spaces, hyphens, apostrophes, periods
        newValue = newValue.replace(/[^a-zA-Z\s\-'\.]/g, '');
      } else if (validation?.input_mode === 'numeric') {
        // Only allow numbers
        newValue = newValue.replace(/[^0-9]/g, '');
      } else if (validation?.input_mode === 'tel') {
        // Allow numbers, +, -, spaces, parentheses for phone
        newValue = newValue.replace(/[^0-9+\-\s()]/g, '');
      }
      
      // Apply max_length if specified
      if (validation?.max_length && newValue.length > validation.max_length) {
        newValue = newValue.slice(0, validation.max_length);
      }
      
      handleFieldChange(fieldKey, newValue);
    };

    // Helper to get max date for date inputs
    const getMaxDate = () => {
      if (validation?.max_date === 'today' || validation?.date_constraint === 'past_only' || validation?.date_constraint === 'past_or_today') {
        return new Date().toISOString().split('T')[0];
      }
      return undefined;
    };

    // Helper to get min date for date inputs
    const getMinDate = () => {
      if (validation?.min_date === 'today' || validation?.date_constraint === 'future_only') {
        return new Date().toISOString().split('T')[0];
      }
      return undefined;
    };

    // Common input props with validation
    const getInputProps = () => ({
      id: fieldKey,
      placeholder: isDeclarationDateField ? undefined : field.placeholder,
      value: (value as string) || '',
      onChange: handleInputChange,
      minLength: validation?.min_length,
      maxLength: validation?.max_length,
      pattern: validation?.pattern,
      title: isDeclarationDateField ? 'This field is automatically set to today\'s date' : validation?.message,
      inputMode: validation?.input_mode === 'numeric' ? 'numeric' as const : 
                 validation?.input_mode === 'tel' ? 'tel' as const : 
                 validation?.input_mode === 'email' ? 'email' as const : undefined,
      readOnly: isDeclarationDateField,
      disabled: isDeclarationDateField,
      className: isDeclarationDateField ? 'bg-muted cursor-not-allowed' : undefined,
    });

    switch (field.type) {
      case 'text':
        return <Input {...getInputProps()} />;
      case 'textarea':
        return <Textarea id={fieldKey} placeholder={field.placeholder} value={(value as string) || ''} onChange={handleInputChange} rows={4} />;
      case 'email':
        return <Input {...getInputProps()} type="email" inputMode="email" />;
      case 'phone':
        return <Input {...getInputProps()} type="tel" inputMode="tel" />;
      case 'number': {
        const currentYear = new Date().getFullYear();
        // If max_year_current is set, limit to current year
        const maxValue = validation?.max_year_current ? currentYear : validation?.max;
        
        // Declaration date fields should be readonly with prefilled values
        if (isDeclarationDateField) {
          return (
            <Input 
              id={fieldKey} 
              type="number" 
              value={(value as string) || ''} 
              readOnly
              disabled
              className="bg-muted cursor-not-allowed"
              title="This field is automatically set to today's date"
            />
          );
        }
        
        return (
          <Input 
            id={fieldKey} 
            type="number" 
            placeholder={field.placeholder} 
            value={(value as string) || ''} 
            onChange={(e) => {
              const numValue = parseInt(e.target.value);
              // Prevent future years for declaration year fields
              if (validation?.check_future_date && validation?.max_year_current && numValue > currentYear) {
                toast.error(`Year cannot be in the future (maximum: ${currentYear})`);
                handleFieldChange(fieldKey, String(currentYear));
                return;
              }
              handleFieldChange(fieldKey, e.target.value);
            }}
            min={validation?.min}
            max={maxValue}
          />
        );
      }
      case 'date':
        // Declaration date fields should be readonly with prefilled values
        if (isDeclarationDateField) {
          return (
            <Input 
              id={fieldKey} 
              type="date" 
              value={(value as string) || ''} 
              readOnly
              disabled
              className="bg-muted cursor-not-allowed"
              title="This field is automatically set to today's date"
            />
          );
        }
        return (
          <Input 
            id={fieldKey} 
            type="date" 
            value={(value as string) || ''} 
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            max={getMaxDate()}
            min={getMinDate()}
          />
        );
      case 'select': {
        // Declaration date fields should be readonly with prefilled values
        if (isDeclarationDateField) {
          return (
            <Input 
              id={fieldKey} 
              type="text" 
              value={(value as string) || ''} 
              readOnly
              disabled
              className="bg-muted cursor-not-allowed"
              title="This field is automatically set to today's date"
            />
          );
        }
        
        // Filter out future months if this is a month field and year is current year
        let selectOptions = field.options || [];
        
        if (validation?.check_future_date && (fieldKey.toLowerCase().includes('month') || field.label?.toLowerCase().includes('month'))) {
          // Find the year field in answers to check if we need to filter
          const yearFieldKey = Object.keys(answers).find(k => 
            k.toLowerCase().includes('year') && !k.toLowerCase().includes('years')
          );
          if (yearFieldKey) {
            const yearValue = parseInt(answers[yearFieldKey] as string);
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); // 0-indexed
            
            if (yearValue === currentYear) {
              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'];
              selectOptions = selectOptions.filter(opt => {
                const monthIndex = monthNames.indexOf(opt.value);
                return monthIndex <= currentMonth;
              });
            }
          }
        }
        
        return (
          <Select value={(value as string) || ''} onValueChange={(val) => handleFieldChange(fieldKey, val)}>
            <SelectTrigger><SelectValue placeholder={field.placeholder || "Select an option"} /></SelectTrigger>
            <SelectContent>
              {selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case 'radio':
        return (
          <RadioGroup value={(value as string) || ''} onValueChange={(val) => handleFieldChange(fieldKey, val)}>
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${fieldKey}-${option.value}`} />
                <Label htmlFor={`${fieldKey}-${option.value}`} className="font-normal cursor-pointer">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'checkbox':
        // If options exist, render multi-select checkboxes
        if (field.options && field.options.length > 0) {
          const selectedValues = (value as string[]) || [];
          return (
            <div className="space-y-2">
              {field.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldKey}-${option.value}`}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => handleCheckboxChange(fieldKey, option.value, !!checked)}
                  />
                  <Label htmlFor={`${fieldKey}-${option.value}`} className="font-normal cursor-pointer">{option.label}</Label>
                </div>
              ))}
            </div>
          );
        }
        // Single checkbox (boolean)
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={fieldKey} checked={!!value} onCheckedChange={(checked) => handleFieldChange(fieldKey, checked)} />
            <Label htmlFor={fieldKey} className="font-normal cursor-pointer">{field.label}</Label>
          </div>
        );
      default:
        return <Input id={fieldKey} value={(value as string) || ''} onChange={(e) => handleFieldChange(fieldKey, e.target.value)} />;
    }
  };

  return (
    <div className="container py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <TierBadge tier={type.tier} size="sm" />
          {isCreating && <span className="text-sm text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Creating draft...</span>}
        </div>
        <h1 className="text-2xl font-bold">{type.name}</h1>
        <p className="text-muted-foreground mt-1">Fill out the form below to create your affidavit</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Step {currentStep + 1} of {totalSteps}</span>
          <div className="flex items-center gap-2">
            {lastSaved ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Saved locally
              </span>
            ) : null}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Please provide the following information</CardTitle>
          <CardDescription>
            All required fields are marked with *
          </CardDescription>
        </CardHeader>
        
        {/* Validation Errors Banner */}
        {validationErrors.length > 0 && (
          <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-600 dark:text-red-400">Please fix the following errors:</h4>
                <ul className="list-disc list-inside mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <CardContent className="space-y-6">
          {currentQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions to display on this step.
            </div>
          ) : (
            currentQuestions.map((field, idx) => {
              const fieldKey = field.id || field.field_name || `question_${idx}`;
              const hasError = fieldErrors.has(field.label);
              return (
                <div key={fieldKey} className={`space-y-2 ${hasError ? 'p-3 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-md' : ''}`}>
                  {field.type !== 'checkbox' || (field.options && field.options.length > 0) ? (
                    <Label htmlFor={fieldKey} className={hasError ? 'text-red-600 dark:text-red-400' : ''}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  ) : null}
                  {hasError && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">This field is required</p>
                  )}
                  {field.help_text && (
                    <p className="text-xs text-muted-foreground">{field.help_text}</p>
                  )}
                  {renderField(field, allQuestions.indexOf(field))}
                </div>
              );
            })
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || isCreating || isValidating}>
              {(isSubmitting || isCreating || isValidating) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isValidating ? 'Validating...' : 'Submit Request'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Info */}
      <Alert className="mt-6">
        <Save className="h-4 w-4" />
        <AlertDescription>
          Your draft is saved locally in your browser. Click "Submit Request" when you're ready to create your affidavit.
          {lastSaved && (
            <span className="block text-xs mt-1 text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
