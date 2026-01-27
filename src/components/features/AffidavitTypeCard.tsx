import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from './TierBadge';
import type { AffidavitType } from '@/types';
import { ArrowRight, Zap, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

interface AffidavitTypeCardProps {
  type: AffidavitType;
  variant?: 'default' | 'compact';
  showActions?: boolean;
}

export function AffidavitTypeCard({ type, variant = 'default', showActions = true }: AffidavitTypeCardProps) {
  const detailUrl = ROUTES.AFFIDAVIT_TYPE_DETAIL.replace(':id', String(type.id));
  const createUrl = ROUTES.REQUEST_CREATE.replace(':typeId', String(type.id));

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{type.name}</CardTitle>
            <TierBadge tier={type.tier} size="sm" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {type.description.slice(50)}
          </p>
        </CardContent>
        {showActions && (
          <CardFooter className="pt-0">
            <Button asChild size="sm" className="w-full">
              <Link to={createUrl}>
                Start Now <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <TierBadge tier={type.tier} />
          {type.default_mode === 'instant' && (
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Instant
            </Badge>
          )}
          {type.default_mode === 'review_first' && (
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              Reviewed
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">
          {type.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">{type.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {type.intake_schema_count ?? type.intake_schema?.length ?? 0} questions
            </p>
            <p className="text-xs text-muted-foreground">
              {type.confidence_status === 'confident' ? 'AI Confident' : 
               type.confidence_status === 'controlled' ? 'In Review' : 'Learning'}
            </p>
          </div>
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2">
          <Button variant="outline" asChild className="flex-1">
            <Link to={detailUrl}>Learn More</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link to={createUrl}>
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
