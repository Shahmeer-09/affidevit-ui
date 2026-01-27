import { Badge } from '@/components/ui/badge';
import { TIER_CONFIG } from '@/lib/constants';
import type { AffidavitTier } from '@/types';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: AffidavitTier;
  showDescription?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const colorVariants: Record<string, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const sizeVariants = {
  sm: 'text-xs px-2 py-0.5',
  default: 'text-sm px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

export function TierBadge({ tier, showDescription = false, size = 'default', className }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];
  if (!config) return null;

  const colorClass = colorVariants[config.color] || colorVariants.info;
  const sizeClass = sizeVariants[size];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Badge
        variant="outline"
        className={cn(
          'font-medium border-0',
          colorClass,
          sizeClass
        )}
      >
        Tier {tier}: {config.label}
      </Badge>
      {showDescription && (
        <span className="text-xs text-muted-foreground">{config.description}</span>
      )}
    </div>
  );
}
