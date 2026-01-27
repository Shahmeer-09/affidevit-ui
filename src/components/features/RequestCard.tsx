import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { TierBadge } from './TierBadge';
import type { Request } from '@/types';
import { Calendar, FileText, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RequestCardProps {
  request: Request;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  className?: string;
  onDelete?: (id: number) => void;
  onRespond?: (request: Request) => void;
  isDeleting?: boolean;
}

// Statuses that can be deleted
const DELETABLE_STATUSES = ['DRAFT', 'SUBMITTED', 'DRAFT_READY', 'NEEDS_CLARIFICATION', 'NEEDS_REVIEW', 'REJECTED'];

export function RequestCard({ request, variant = 'default', showActions = true, className, onDelete, onRespond, isDeleting }: RequestCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const statusUrl = ROUTES.REQUEST_STATUS.replace(':id', String(request.id));
  
  const canDelete = onDelete && DELETABLE_STATUSES.includes(request.status?.toUpperCase());
  const needsClarification = request.status === 'needs_clarification';
  
  // Safety check for affidavit_type
  if (!request.affidavit_type) {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Loading request data...</p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{request.affidavit_type.name}</p>
                <p className="text-xs text-muted-foreground">{request.request_code}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={request.status} size="sm" />
              {showActions && (
                <Button variant="ghost" size="icon" asChild>
                  <Link to={statusUrl}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground font-mono">{request.request_code}</p>
            <h3 className="text-lg font-semibold mt-1">{request.affidavit_type.name}</h3>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <TierBadge tier={request.affidavit_type.tier} size="sm" />
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(request.created_at), 'MMM d, yyyy')}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Updated {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
        </p>
      </CardContent>
      {showActions && (
        <CardFooter className="pt-0 gap-2">
          {needsClarification && onRespond ? (
             <Button 
               onClick={() => onRespond(request)} 
               className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
             >
               Respond to Question <ArrowRight className="h-4 w-4 ml-1" />
             </Button>
          ) : (
            <Button asChild className="flex-1">
              <Link to={statusUrl}>
                View Details <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
          
          {canDelete && (
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Request</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete request <strong>{request.request_code}</strong>? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete?.(request.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
