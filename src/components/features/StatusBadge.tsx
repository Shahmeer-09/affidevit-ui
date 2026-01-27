import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG } from '@/lib/constants';
import type { RequestStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  FileEdit,
  Send,
  Loader,
  CheckCircle,
  Eye,
  AlertCircle,
  Check,
  X,
  CheckCircle2,
} from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const iconMap = {
  FileEdit,
  Send,
  Loader,
  CheckCircle,
  Eye,
  AlertCircle,
  Check,
  X,
  CheckCircle2,
};

const colorVariants: Record<string, string> = {
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const sizeVariants = {
  sm: 'text-xs px-2 py-0.5',
  default: 'text-sm px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

export function StatusBadge({ status, showIcon = true, size = 'default', className }: StatusBadgeProps) {
  // Normalize status to uppercase for config lookup
  const normalizedStatus = status?.toUpperCase();
  const config = STATUS_CONFIG[normalizedStatus as keyof typeof STATUS_CONFIG];
  if (!config) return null;

  const Icon = iconMap[config.icon as keyof typeof iconMap];
  const colorClass = colorVariants[config.color] || colorVariants.secondary;
  const sizeClass = sizeVariants[size];

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border-0',
        colorClass,
        sizeClass,
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      )}
      {config.label}
    </Badge>
  );
}
