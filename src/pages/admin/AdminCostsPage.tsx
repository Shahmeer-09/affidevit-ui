import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardHeader, StatsCard, StatsGrid } from '@/components/features';
import { mockCostDashboard } from '@/lib/mock-data';
import {
  DollarSign,
  TrendingDown,
  Activity,
  Zap,
  FileText,
  BarChart3,
} from 'lucide-react';

export function AdminCostsPage() {
  const [period, setPeriod] = useState('mtd');
  const costs = mockCostDashboard;

  const estAvgCostPerRequest = (costs.total_cost / 100).toFixed(4); // Estimated

  const stats = [
    {
      title: 'Total Cost',
      value: `$${costs.total_cost.toFixed(2)}`,
      icon: DollarSign,
      trend: { value: 5, label: 'vs last period', isPositive: false },
      description: 'This period',
    },
    {
      title: 'Total Tokens',
      value: costs.token_usage.total_tokens.toLocaleString(),
      icon: Activity,
      description: 'Prompt + Completion',
    },
    {
      title: 'Avg per Request',
      value: `$${estAvgCostPerRequest}`,
      icon: FileText,
      trend: { value: 3, label: 'improved', isPositive: true },
    },
    {
      title: 'Cost Efficiency',
      value: '94%',
      icon: Zap,
      trend: { value: 2, label: 'vs target', isPositive: true },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="AI Cost Dashboard"
        description="Monitor AI usage and costs"
      >
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="mtd">Month to Date</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
          </SelectContent>
        </Select>
      </DashboardHeader>

      {/* Stats */}
      <StatsGrid>
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            description={stat.description}
          />
        ))}
      </StatsGrid>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Token Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Token Usage</CardTitle>
            <CardDescription>Breakdown of input and output tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Prompt Tokens</span>
                <span className="font-medium">{costs.token_usage.prompt_tokens.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(costs.token_usage.prompt_tokens / costs.token_usage.total_tokens) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Tokens</span>
                <span className="font-medium">{costs.token_usage.completion_tokens.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(costs.token_usage.completion_tokens / costs.token_usage.total_tokens) * 100}%` }}
                />
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{costs.token_usage.total_tokens.toLocaleString()} tokens</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Cost Trend
            </CardTitle>
            <CardDescription>Cost over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization</p>
                <p className="text-sm">Will use recharts in API integration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Affidavit Type</CardTitle>
          <CardDescription>AI cost breakdown per type</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(costs.cost_by_type).map(([typeName, typeCost]) => (
                <TableRow key={typeName}>
                  <TableCell className="font-medium">{typeName}</TableCell>
                  <TableCell className="text-right">${typeCost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cost Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-500" />
            Cost Optimization Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Prompt caching could save ~15%
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Similar requests for "General Affidavit" can benefit from cached prompts.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Batch processing optimization
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Batching similar requests could reduce overhead by 8%.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
