// Disallowed Phrases Editor Component - Manage phrases AI should avoid
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  X,
  Plus,
  Save,
  Loader2,
  AlertCircle,
  Lightbulb,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetDisallowedPhrasesQuery,
  useUpdateDisallowedPhrasesMutation,
} from '@/store/api/adminApi';

interface DisallowedPhrasesEditorProps {
  affidavitTypeId: string;
  /** Initial phrases if not loading from API */
  initialPhrases?: string[];
  /** Callback when phrases change */
  onChange?: (phrases: string[]) => void;
  /** Whether to use local state only (no API) */
  localOnly?: boolean;
}

export function DisallowedPhrasesEditor({
  affidavitTypeId,
  initialPhrases = [],
  onChange,
  localOnly = false,
}: DisallowedPhrasesEditorProps) {
  const typeId = parseInt(affidavitTypeId);
  const [newPhrase, setNewPhrase] = useState('');
  const [localPhrases, setLocalPhrases] = useState<string[]>(initialPhrases);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // API hooks - only used if not localOnly
  const { data: phrasesData, isLoading, refetch } = useGetDisallowedPhrasesQuery(
    typeId,
    { skip: localOnly }
  );
  const [updatePhrases, { isLoading: isUpdating }] = useUpdateDisallowedPhrasesMutation();

  const suggestions = useMemo(() => phrasesData?.suggestions || [], [phrasesData]);

  // Compute phrases from API data or local state
  const phrases = useMemo(() => {
    if (localOnly) {
      return localPhrases;
    }
    // When API has loaded, use API data; when there are unsaved changes, use local state
    if (hasLocalChanges) {
      return localPhrases;
    }
    return phrasesData?.current_phrases || [];
  }, [localOnly, localPhrases, hasLocalChanges, phrasesData?.current_phrases]);

  // Track if there are changes compared to API data
  const hasChanges = useMemo(() => {
    if (localOnly) {
      return hasLocalChanges;
    }
    const apiPhrases = phrasesData?.current_phrases || [];
    return JSON.stringify(localPhrases.sort()) !== JSON.stringify([...apiPhrases].sort()) && hasLocalChanges;
  }, [localOnly, localPhrases, phrasesData?.current_phrases, hasLocalChanges]);

  // Helper to update phrases
  const updateLocalPhrases = (newPhrases: string[]) => {
    setLocalPhrases(newPhrases);
    setHasLocalChanges(true);
    onChange?.(newPhrases);
  };

  // Add a phrase
  const handleAddPhrase = () => {
    const trimmed = newPhrase.trim();
    if (!trimmed) return;
    if (phrases.includes(trimmed)) {
      toast.error('This phrase is already in the list');
      return;
    }

    updateLocalPhrases([...phrases, trimmed]);
    setNewPhrase('');
  };

  // Remove a phrase
  const handleRemovePhrase = (phrase: string) => {
    updateLocalPhrases(phrases.filter((p) => p !== phrase));
  };

  // Add suggestion
  const handleAddSuggestion = (suggestion: string) => {
    if (phrases.includes(suggestion)) {
      toast.error('This phrase is already in the list');
      return;
    }
    updateLocalPhrases([...phrases, suggestion]);
  };

  // Save changes to API
  const handleSave = async () => {
    if (localOnly) {
      // Just notify parent
      onChange?.(phrases);
      setHasLocalChanges(false);
      toast.success('Changes applied');
      return;
    }

    try {
      await updatePhrases({ id: typeId, phrases: localPhrases }).unwrap();
      toast.success('Disallowed phrases saved');
      setHasLocalChanges(false);
      refetch();
    } catch {
      toast.error('Failed to save phrases');
    }
  };

  // Add all suggestions
  const handleAddAllSuggestions = () => {
    const newPhrases = suggestions.filter((s) => !phrases.includes(s));
    if (newPhrases.length === 0) {
      toast.info('All suggestions are already added');
      return;
    }
    updateLocalPhrases([...phrases, ...newPhrases]);
    toast.success(`Added ${newPhrases.length} phrases`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>What are Disallowed Phrases?</AlertTitle>
        <AlertDescription>
          These are words or phrases that the AI will avoid using when generating affidavit drafts.
          Common examples include uncertain language ("I think", "maybe") and informal expressions.
        </AlertDescription>
      </Alert>

      {/* Current Phrases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Phrases ({phrases.length})</span>
            {hasChanges && (
              <Button onClick={handleSave} disabled={isUpdating} size="sm">
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Phrases the AI should never use when drafting affidavits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new phrase */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a phrase to add..."
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPhrase();
                }
              }}
            />
            <Button onClick={handleAddPhrase} disabled={!newPhrase.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <Separator />

          {/* Phrases list */}
          {phrases.length > 0 ? (
            <ScrollArea className="h-52">
              <div className="flex flex-wrap gap-2">
                {phrases.map((phrase) => (
                  <Badge
                    key={phrase}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1"
                  >
                    <span className="text-destructive">{phrase}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 hover:bg-destructive/20"
                      onClick={() => handleRemovePhrase(phrase)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No disallowed phrases configured</p>
              <p className="text-sm">Add phrases or use suggestions below</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions */}
      {!localOnly && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Suggested Phrases
            </CardTitle>
            <CardDescription>
              Common phrases that should be avoided in legal documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleAddAllSuggestions}>
                <Check className="h-4 w-4 mr-2" />
                Add All Suggestions
              </Button>
            </div>

            <ScrollArea className="h-52">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => {
                  const isAdded = phrases.includes(suggestion);
                  return (
                    <Badge
                      key={suggestion}
                      variant={isAdded ? 'secondary' : 'outline'}
                      className={`pl-3 pr-1 py-1.5 text-sm flex items-center gap-1 cursor-pointer transition-colors ${
                        isAdded ? 'opacity-50' : 'hover:bg-primary/10'
                      }`}
                      onClick={() => !isAdded && handleAddSuggestion(suggestion)}
                    >
                      <span>{suggestion}</span>
                      {isAdded ? (
                        <Check className="h-3 w-3 ml-1 text-green-500" />
                      ) : (
                        <Plus className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
