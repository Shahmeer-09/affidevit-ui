import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/features';
import { useGetWeeklyReportQuery, useGetSuggestionsQuery } from '@/store/api/adminApi';
import {
  CheckCircle,
  Clock,
  Brain,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  TrendingUp,
  XCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { LearningSuggestion } from '@/types';

export function AdminLearningPage() {
  const { data: reportData, isLoading: loadingReport } = useGetWeeklyReportQuery();
  const { data: suggestionsData, isLoading: loadingSuggestions } = useGetSuggestionsQuery();
  
  const [suggestions, setSuggestions] = useState<(LearningSuggestion & { status?: 'pending' | 'approved' | 'rejected' })[]>([]);

  useEffect(() => {
    if (suggestionsData) {
      setSuggestions(suggestionsData.map(s => ({ ...s, status: 'pending' as const })));
    }
  }, [suggestionsData]);

  if (loadingReport || loadingSuggestions) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const report = reportData || {
    period: { start: new Date().toISOString(), end: new Date().toISOString() },
    types: [],
    top_override_reasons: [],
    new_scenarios: [],
    recommendations: []
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const approvedSuggestions = suggestions.filter(s => s.status === 'approved');
  const rejectedSuggestions = suggestions.filter(s => s.status === 'rejected');

  const handleApprove = (id: string) => {
    setSuggestions(suggestions.map(s =>
      s.id === id ? { ...s, status: 'approved' as const } : s
    ));
  };

  const handleReject = (id: string) => {
    setSuggestions(suggestions.map(s =>
      s.id === id ? { ...s, status: 'rejected' as const } : s
    ));
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  };

  const renderSuggestionCard = (suggestion: LearningSuggestion & { status?: string }) => (
    <Card key={suggestion.id} className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{suggestion.category}</Badge>
              <Badge className={priorityColors[suggestion.priority]}>
                {suggestion.priority}
              </Badge>
            </div>
            <CardTitle className="text-lg">{suggestion.title}</CardTitle>
          </div>
          {suggestion.status === 'pending' && (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                onClick={() => handleApprove(suggestion.id)}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                onClick={() => handleReject(suggestion.id)}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
        
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Action</p>
          <p className="text-sm">{suggestion.suggested_action}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t text-sm">
          <span className="text-muted-foreground">
            {suggestion.affected_type ? `Affects: ${suggestion.affected_type.name}` : 'General'}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {suggestion.potential_impact}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  // Calculate stats from report
  const totalVolume = report.types.reduce((sum, t) => sum + t.volume, 0);
  const totalOverrides = report.types.reduce((sum, t) => sum + t.overrides, 0);

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Learning Suggestions"
        description="AI-generated recommendations for improving prompts and templates"
      />

      {/* Weekly Report */}
      <Card className="bg-linear-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Weekly Learning Report
          </CardTitle>
          <CardDescription>
            {format(new Date(report.period.start), 'MMM d')} - {format(new Date(report.period.end), 'MMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-bold text-primary">{totalVolume}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{totalOverrides}</p>
              <p className="text-sm text-muted-foreground">Overrides</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">{report.types.length}</p>
              <p className="text-sm text-muted-foreground">Types Analyzed</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{report.new_scenarios.length}</p>
              <p className="text-sm text-muted-foreground">New Scenarios</p>
            </div>
          </div>

          {report.recommendations.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {report.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <Badge variant="outline" className="shrink-0">
                      {rec.type.replace('_', ' ')}
                    </Badge>
                    <span className="flex-1 text-sm">{rec.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.top_override_reasons.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Top Override Reasons</h4>
              <div className="space-y-2">
                {report.top_override_reasons.slice(0, 5).map((reason, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {reason.count}
                    </div>
                    <span className="flex-1 text-sm">{reason.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedSuggestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSuggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending suggestions to review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingSuggestions.map(renderSuggestionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedSuggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">No approved suggestions yet</p>
                <p className="text-sm text-muted-foreground">Approved suggestions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedSuggestions.map(renderSuggestionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedSuggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">No rejected suggestions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejectedSuggestions.map(renderSuggestionCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
