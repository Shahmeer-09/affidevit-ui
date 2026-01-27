// Progress component not used - using custom implementation
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ConfidenceMeterProps {
  score: number;
  showLabel?: boolean;
  showTrend?: boolean;
  trend?: 'up' | 'down' | 'stable';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function ConfidenceMeter({
  score,
  showLabel = true,
  showTrend = false,
  trend,
  size = 'default',
  className,
}: ConfidenceMeterProps) {
  // Determine color based on score
  const getColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Confidence</span>
          <div className="flex items-center gap-1">
            <span className={cn('text-sm font-medium', getTextColor(score))}>{score}%</span>
            {showTrend && trend && (
              <TrendIcon className={cn('h-4 w-4', trendColor)} />
            )}
          </div>
        </div>
      )}
      <div className={cn('relative w-full bg-secondary rounded-full overflow-hidden', heightClass)}>
        <div
          className={cn('h-full transition-all duration-500', getColor(score))}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
