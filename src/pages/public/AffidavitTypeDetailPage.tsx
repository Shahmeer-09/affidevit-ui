import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TierBadge } from '@/components/features';
import { useGetAffidavitTypeQuery } from '@/store/api/userApi';
import { ROUTES } from '@/lib/constants';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle,
  Zap,
  Eye,
  HelpCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export function AffidavitTypeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: type, isLoading, error } = useGetAffidavitTypeQuery(Number(id));

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !type) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Affidavit Type Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The affidavit type you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to={ROUTES.AFFIDAVIT_TYPES}>Browse All Types</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createUrl = ROUTES.REQUEST_CREATE.replace(':typeId', String(type.id));

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <TierBadge tier={type.tier} />
              {type.default_mode === 'instant' && (
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Instant Approval
                </Badge>
              )}
              {type.default_mode === 'review_first' && (
                <Badge variant="outline" className="gap-1">
                  <Eye className="h-3 w-3" />
                  Professional Review
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-3">{type.name}</h1>
            <p className="text-lg text-muted-foreground">{type.description}</p>
          </div>

          <Separator />

          {/* When to Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                When to Use This Affidavit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This type of affidavit is commonly used for:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Sworn statements requiring notarization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Legal proceedings and court submissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Official documentation for government agencies</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* What You'll Need */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                What You'll Need
              </CardTitle>
              <CardDescription>
                Gather these items before starting to speed up the process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid sm:grid-cols-2 gap-3">
                {type.intake_schema.slice(0, 6).map((field) => (
                  <li key={field.id} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </li>
                ))}
              </ul>
              {type.intake_schema.length > 6 && (
                <p className="text-sm text-muted-foreground mt-3">
                  + {type.intake_schema.length - 6} more fields
                </p>
              )}
            </CardContent>
          </Card>

          {/* Process */}
          <Card>
            <CardHeader>
              <CardTitle>The Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Complete the Intake Form</p>
                    <p className="text-sm text-muted-foreground">
                      Answer questions about your situation ({type.intake_schema.length} fields)
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">AI Generates Your Document</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI creates a professionally formatted affidavit
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">
                      {type.default_mode === 'instant' ? 'Instant Approval' : 'Professional Review'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {type.default_mode === 'instant'
                        ? 'Your document is ready for immediate download'
                        : 'A legal professional reviews your document for accuracy'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Download & Notarize</p>
                    <p className="text-sm text-muted-foreground">
                      Download your PDF and get it notarized by a commissioner
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <TierBadge tier={type.tier} />
                  <span className="text-muted-foreground">tier pricing</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{type.intake_schema.length} Questions</p>
                    <p className="text-xs text-muted-foreground">To complete</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {type.default_mode === 'instant' ? (
                    <Zap className="h-5 w-5 text-green-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {type.default_mode === 'instant' ? 'Instant' : 'Reviewed'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {type.default_mode === 'instant' ? 'Ready immediately' : 'Professional review included'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button size="lg" className="w-full" asChild>
                  <Link to={createUrl}>
                    Start Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  You can save your progress and continue later
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Not sure if this is right?</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use our guided wizard to find the perfect affidavit type for your needs.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={ROUTES.DECISION_TREE}>Help Me Choose</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
