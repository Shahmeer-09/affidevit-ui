import { cn } from '@/lib/utils';
import { Check, Circle, AlertCircle, Clock, FileText, Send, CheckCircle, Eye, X } from 'lucide-react';
import type { RequestEvent } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';

interface RequestTimelineProps {
  events: RequestEvent[];
  className?: string;
}

interface TimelineEvent {
  id: number | string;
  title: string;
  description?: string;
  timestamp: string;
  icon: React.ElementType;
  iconColor: string;
  isCompleted?: boolean;
}

const eventIconMap: Record<string, { icon: React.ElementType; color: string }> = {
  created: { icon: FileText, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900' },
  submitted: { icon: Send, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900' },
  processing: { icon: Clock, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900' },
  draft_ready: { icon: CheckCircle, color: 'text-green-500 bg-green-100 dark:bg-green-900' },
  needs_review: { icon: Eye, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900' },
  approved: { icon: Check, color: 'text-green-500 bg-green-100 dark:bg-green-900' },
  rejected: { icon: X, color: 'text-red-500 bg-red-100 dark:bg-red-900' },
  completed: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900' },
  clarification_requested: { icon: AlertCircle, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900' },
  clarification_provided: { icon: Check, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900' },
};

export function RequestTimeline({ events, className }: RequestTimelineProps) {
  const timelineEvents: TimelineEvent[] = events.map((event) => {
    const config = eventIconMap[event.event_type] || { icon: Circle, color: 'text-muted-foreground bg-muted' };
    
    return {
      id: event.id,
      title: formatEventTitle(event.event_type),
      description: event.actor ? `by ${event.actor.first_name} ${event.actor.last_name}` : undefined,
      timestamp: event.created_at,
      icon: config.icon,
      iconColor: config.color,
      isCompleted: true,
    };
  });

  return (
    <div className={cn('relative', className)}>
      {timelineEvents.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === timelineEvents.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connector Line */}
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                event.iconColor
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-1.5">
              <p className="font-medium">{event.title}</p>
              {event.description && (
                <p className="text-sm text-muted-foreground">{event.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')} • {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatEventTitle(eventType: string): string {
  const titles: Record<string, string> = {
    created: 'Request Created',
    submitted: 'Request Submitted',
    processing: 'AI Processing Started',
    draft_ready: 'Draft Ready',
    needs_review: 'Sent for Review',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed & Notarized',
    clarification_requested: 'Clarification Requested',
    clarification_provided: 'Clarification Provided',
  };
  return titles[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Simplified timeline for status pages
interface SimpleTimelineItem {
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface SimpleTimelineProps {
  items: SimpleTimelineItem[];
  className?: string;
}

export function SimpleTimeline({ items, className }: SimpleTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Connector Line */}
            {!isLast && (
              <div 
                className={cn(
                  'absolute left-3 top-6 bottom-0 w-0.5',
                  item.status === 'completed' ? 'bg-primary' : 'bg-border'
                )} 
              />
            )}

            {/* Dot */}
            <div
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                item.status === 'completed' && 'bg-primary border-primary',
                item.status === 'current' && 'bg-background border-primary',
                item.status === 'upcoming' && 'bg-background border-muted-foreground/30'
              )}
            >
              {item.status === 'completed' && (
                <Check className="h-3 w-3 text-primary-foreground" />
              )}
              {item.status === 'current' && (
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <p className={cn(
                'font-medium',
                item.status === 'upcoming' && 'text-muted-foreground'
              )}>
                {item.label}
              </p>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
