import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TierBadge } from '@/components/features';
import { useGetDecisionTreeRootQuery, useLazyGetDecisionTreeNodeQuery, useGetAffidavitTypeQuery } from '@/store/api/userApi';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/lib/constants';
import { ArrowLeft, ArrowRight, HelpCircle, RotateCcw, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import type { DecisionNode } from '@/types';

interface HistoryEntry {
  nodeId: number;
  question: string;
  answer: string;
}

export function DecisionTreePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentNode, setCurrentNode] = useState<DecisionNode | null>(null);
  const [resultTypeId, setResultTypeId] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch root nodes
  const { data: rootNodes, isLoading: isLoadingRoot, error: rootError } = useGetDecisionTreeRootQuery();
  
  // Lazy query for fetching child nodes
  const [fetchNode] = useLazyGetDecisionTreeNodeQuery();
  
  // Fetch result type details when we have a result
  const { data: resultType } = useGetAffidavitTypeQuery(resultTypeId!, { skip: !resultTypeId });

  // Set initial node from root
  useEffect(() => {
    // Only set if we haven't started (history is empty) and have no current node
    if (rootNodes && rootNodes.length > 0 && !currentNode && !resultTypeId && history.length === 0) {
      setCurrentNode(rootNodes[0]);
    }
  }, [rootNodes, currentNode, resultTypeId, history.length]);

  const progress = Math.min(history.length * 25, 100);

  const handleOptionSelect = async (option: { id: number; label: string; next_node_id?: number; result_type_id?: number }) => {
    if (!currentNode) return;
    
    setIsNavigating(true);
    
    // Add to history
    setHistory(prev => [...prev, {
      nodeId: currentNode.id,
      question: currentNode.question,
      answer: option.label
    }]);

    if (option.result_type_id) {
      setResultTypeId(option.result_type_id);
      setCurrentNode(null);
    } else if (option.next_node_id) {
      try {
        const result = await fetchNode(option.next_node_id).unwrap();
        setCurrentNode(result);
      } catch (error) {
        console.error('Failed to fetch next node:', error);
      }
    }
    
    setIsNavigating(false);
  };

  const handleBack = async () => {
    if (resultTypeId) {
      setResultTypeId(null);
      const lastEntry = history[history.length - 1];
      if (lastEntry) {
        try {
          const node = await fetchNode(lastEntry.nodeId).unwrap();
          setCurrentNode(node);
        } catch {
          if (rootNodes && rootNodes.length > 0) setCurrentNode(rootNodes[0]);
        }
      }
      setHistory(prev => prev.slice(0, -1));
    } else if (history.length > 0) {
      const lastEntry = history[history.length - 1];
      try {
        const node = await fetchNode(lastEntry.nodeId).unwrap();
        setCurrentNode(node);
      } catch {
        if (rootNodes && rootNodes.length > 0) setCurrentNode(rootNodes[0]);
      }
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setHistory([]);
    setResultTypeId(null);
    if (rootNodes && rootNodes.length > 0) setCurrentNode(rootNodes[0]);
  };

  const handleStartRequest = () => {
    if (!resultType) return;
    if (isAuthenticated) {
      navigate(ROUTES.REQUEST_CREATE.replace(':typeId', String(resultType.id)));
    } else {
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.REQUEST_CREATE.replace(':typeId', String(resultType.id)))}`);
    }
  };

  if (isLoadingRoot) {
    return (
      <div className="container py-8 max-w-3xl">
        <div className="text-center mb-8">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (rootError || !rootNodes || rootNodes.length === 0) {
    return (
      <div className="container py-8 max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Decision Tree Not Available</h2>
            <p className="text-muted-foreground mb-4">
              The "Help Me Choose" feature is not configured yet. Please browse our affidavit types directly.
            </p>
            <Button asChild><Link to={ROUTES.AFFIDAVIT_TYPES}>Browse All Affidavit Types</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Help Me Choose</h1>
        <p className="text-muted-foreground">Answer a few questions to find the right affidavit type for your needs</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{history.length} questions answered</span>
        </div>
        <Progress value={resultTypeId ? 100 : progress} className="h-2" />
      </div>

      {history.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {history.map((entry, index) => (
            <Badge key={index} variant="secondary" className="text-xs">{entry.answer}</Badge>
          ))}
        </div>
      )}

      {resultTypeId && resultType ? (
        <Card className="border-2 border-primary/50">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">We Found Your Match!</CardTitle>
            <CardDescription>Based on your answers, we recommend:</CardDescription>
          </CardHeader>
          <CardContent>
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{resultType.name}</h3>
                    {resultType.description && <p className="text-muted-foreground mt-1">{resultType.description}</p>}
                    <div className="flex items-center gap-4 mt-3"><TierBadge tier={resultType.tier} size="sm" /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />Start Over
            </Button>
            <Button className="w-full sm:flex-1" onClick={handleStartRequest}>
              {isAuthenticated ? 'Create This Affidavit' : 'Sign In to Create'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      ) : currentNode ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{currentNode.question}</CardTitle>
            {currentNode.help_text && <CardDescription>{currentNode.help_text}</CardDescription>}
          </CardHeader>
          <CardContent>
            {isNavigating ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {currentNode.options.map((option) => (
                  <button key={option.id} onClick={() => handleOptionSelect(option)}
                    className="w-full text-left p-4 rounded-lg border-2 hover:border-primary hover:bg-primary/5 transition-colors group">
                    <div className="flex items-center justify-between">
                      <span className="font-medium group-hover:text-primary">{option.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={history.length === 0 || isNavigating}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <Button variant="ghost" onClick={handleReset} disabled={isNavigating}>
              <RotateCcw className="h-4 w-4 mr-2" />Start Over
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-3">Already know what you need?</p>
        <Button variant="outline" asChild><Link to={ROUTES.AFFIDAVIT_TYPES}>Browse All Affidavit Types</Link></Button>
      </div>
    </div>
  );
}
