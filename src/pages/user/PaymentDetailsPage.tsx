import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useGetRequestQuery } from '@/store/api/userApi';
import { useMarkRequestPaidMutation } from '@/store/api/userApi';
import { ROUTES } from '@/lib/constants';
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  Building2,
  Info,
  Lock,
} from 'lucide-react';

export function PaymentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: request, isLoading, error } = useGetRequestQuery(Number(id), { skip: !id });
  const [markPaid, { isLoading: isProcessing }] = useMarkRequestPaidMutation();

  const [accountHolderName, setAccountHolderName] = useState('');

  // Card detail fields — UI only, not submitted to backend
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Tracks whether payment is actively being processed — prevents the
  // "already paid" guard from racing against handleConfirmPayment's own navigation.
  const justPaidRef = useRef(false);

  // Guard: redirect away if user lands on payment page when already paid
  // (e.g. browser back button). Skipped while payment is in-flight.
  useEffect(() => {
    if (isLoading || !request || justPaidRef.current) return;
    if (request.is_paid) {
      const statusUpper = request.status?.toUpperCase();
      // First-time flow keeps request in DRAFT after payment until user clicks Continue on ThankYouPage
      if (statusUpper === 'DRAFT') {
        navigate(ROUTES.REQUEST_THANK_YOU.replace(':id', String(id)));
      } else {
        navigate(ROUTES.REQUEST_STATUS.replace(':id', String(id)));
      }
    }
  }, [isLoading, request, id, navigate]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleConfirmPayment = async () => {
    if (!id) return;
    if (!accountHolderName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Mark payment as in-flight so the "already paid" guard doesn't race us
    justPaidRef.current = true;

    try {
      const result = await markPaid({ id: Number(id) }).unwrap();
      toast.success('Payment confirmed!');
      const resultStatus = result.request?.status?.toUpperCase();
      if (result.next_step === 'thank_you' || resultStatus === 'DRAFT') {
        // First-time user — show welcome page
        navigate(ROUTES.REQUEST_THANK_YOU.replace(':id', String(id)));
      } else if (result.next_step === 'review_queue') {
        // review_first type — skip welcome, go to status
        toast.info('Your affidavit is being processed for professional review.', {
          description: 'You will be notified once a reviewer is assigned.',
        });
        navigate(ROUTES.REQUEST_STATUS.replace(':id', String(id)));
      } else if (result.next_step === 'scheduling') {
        // Returning user (standard/instant type) — skip welcome, go to status for scheduling
        toast.info('Your affidavit is being generated.', {
          description: 'We will notify you when it is ready for scheduling.',
        });
        navigate(ROUTES.REQUEST_STATUS.replace(':id', String(id)));
      } else {
        // select_commissioner or other
        navigate(ROUTES.REQUEST_STATUS.replace(':id', String(id)));
      }
    } catch (err: unknown) {
      const errData = (err as { data?: { error?: string } })?.data;
      const msg = errData?.error || 'Failed to confirm payment. Please try again.';
      toast.error('Payment Failed', { description: msg });
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
    <div className="container py-8 max-w-2xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Complete Payment</h1>
        <p className="text-muted-foreground mt-1">
          Transfer the fee to the account below and enter your transfer reference to confirm.
        </p>
      </div>

      <div className="space-y-6">
        {/* Payment Amount */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Affidavit Preparation Fee</span>
              <span className="text-2xl font-bold">$50.00 TTD</span>
            </div>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground">
              For: <span className="font-medium">{request.affidavit_type?.name}</span> &mdash; Ref:{' '}
              <span className="font-mono font-medium">{request.request_code}</span>
            </p>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
            </div>
            <CardDescription>Transfer the payment to the following account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Bank Name</p>
                <p className="font-medium">Republic Bank Limited</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Account Name</p>
                <p className="font-medium">Affidavit Express Ltd.</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Account Number</p>
                <p className="font-mono font-medium">1234-5678-9012</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Branch</p>
                <p className="font-medium">Port of Spain</p>
              </div>
            </div>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Please use your request code <strong>{request.request_code}</strong> as the payment reference when making the transfer.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Card Details - UI only */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Card Details</CardTitle>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Secure
              </div>
            </div>
            <CardDescription>Enter your card information for verification purposes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardHolderName">
                Cardholder Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cardHolderName"
                placeholder="Name as it appears on card"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                autoComplete="cc-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                inputMode="numeric"
                autoComplete="cc-number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardExpiry">Expiry Date</Label>
                <Input
                  id="cardExpiry"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCvv">CVV</Label>
                <Input
                  id="cardCvv"
                  placeholder="•••"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  type="password"
                />
              </div>
            </div>

            <Button
              className="w-full mt-2"
              size="lg"
              onClick={handleConfirmPayment}
              disabled={
                isProcessing || !accountHolderName.trim()
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
