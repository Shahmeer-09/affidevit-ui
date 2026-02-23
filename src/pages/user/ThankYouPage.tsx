import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useGetRequestQuery, useSubmitRequestMutation } from '@/store/api/userApi';
import { ROUTES } from '@/lib/constants';
import {
  CheckCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export function ThankYouPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: request, isLoading, error } = useGetRequestQuery(Number(id), { skip: !id });
  const [submitRequest] = useSubmitRequestMutation();

  const isReviewFirst = request?.affidavit_type?.default_mode === 'review_first';

  // Guard: only redirect if not paid. All first-time users regardless of
  // affidavit mode should see this page and click the button to trigger generation.
  useEffect(() => {
    if (isLoading || !request) return;
    if (!request.is_paid) {
      navigate(ROUTES.REQUEST_PAYMENT.replace(':id', String(id)));
    }
  }, [isLoading, request, id, navigate]);

  const handleContinue = async () => {
    if (!id) return;
    setIsGenerating(true);
    try {
      await submitRequest(Number(id)).unwrap();
      if (isReviewFirst) {
        toast.success('Submitted for review', {
          description: 'A legal professional will review your affidavit. You will be notified once it is approved.',
        });
      }
      navigate(ROUTES.REQUEST_STATUS.replace(':id', String(id)));
    } catch (err: unknown) {
      const errData = (err as { data?: { message?: string; error?: string } })?.data;
      const msg = errData?.message || errData?.error || 'Failed to start processing. Please try again.';
      toast.error('Error', { description: msg });
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Request Not Found</h2>
            <p className="text-muted-foreground mb-4">The request you're looking for doesn't exist.</p>
            <Button asChild><Link to={ROUTES.MY_REQUESTS}>View My Requests</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-16 max-w-lg">
      <Card className="border-green-500/30 bg-green-50/40 dark:bg-green-950/10">
        <CardContent className="py-12 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">Thank You!</h1>
            <p className="text-muted-foreground mt-2 text-base">
              Your payment has been received and confirmed.
            </p>
          </div>

          {/* Request Code */}
          <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Request Reference</p>
            <p className="font-mono text-xl font-bold text-primary">{request.request_code}</p>
            <p className="text-xs text-muted-foreground mt-1">{request.affidavit_type?.name}</p>
          </div>

          {/* Explanation */}
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {isReviewFirst
              ? "Our AI will generate a draft which will then be professionally reviewed by a legal expert before commissioning. This usually takes 24–48 hours."
              : "Click the button below to generate your affidavit. Our AI will prepare your document and you'll be able to select a commissioner once it's ready."}
          </p>

          {/* Review-first info banner */}
          {isReviewFirst && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 text-left">
              <strong>Professional Review Included</strong> — A qualified reviewer will verify the legal accuracy of your document before it proceeds to commissioning. You will be notified when it is approved.
            </div>
          )}

          {/* CTA Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleContinue}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {isReviewFirst ? 'Submitting for Review...' : 'Generating Affidavit...'}
              </>
            ) : (
              <>
                {isReviewFirst ? 'Submit for Professional Review' : 'Continue to Affidavit'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
