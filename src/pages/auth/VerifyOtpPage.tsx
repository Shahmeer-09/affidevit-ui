import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/lib/constants';
import { Loader2, Mail } from 'lucide-react';

export function VerifyOtpPage() {
  const { verifyOtp, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // user_id + email passed via navigation state from RegisterPage / CommissionerRegisterPage
  const state = location.state as { user_id?: string; email?: string; is_commissioner?: boolean } | null;
  const userId = state?.user_id || '';
  const email = state?.email || '';
  const isCommissioner = state?.is_commissioner === true;

  // If accessed directly without state, redirect to register
  if (!userId) {
    navigate(ROUTES.REGISTER, { replace: true });
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    try {
      const result = await verifyOtp(userId, code.trim());
      // Commissioner: no tokens returned — email verified but still needs admin approval
      if (!result?.access) {
        toast({
          title: 'Email Verified!',
          description: 'Your application is pending admin approval. You will be notified once approved.',
        });
        navigate(ROUTES.LOGIN, { replace: true });
        return;
      }
      // Normal user: tokens returned — logged in, go to dashboard
      navigate(ROUTES.MY_REQUESTS, { replace: true });
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(
        e?.data?.error ||
          e?.message ||
          'Invalid or expired code. Please try again.',
      );
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Verify your email</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          We sent a 6-digit code to
          {email ? (
            <span className="font-medium text-foreground"> {email}</span>
          ) : (
            ' your email'
          )}
          .{' '}
          {isCommissioner
            ? 'Verify your email to complete your commissioner application.'
            : 'Enter it below to activate your account.'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="otp_code">Verification Code</Label>
          <Input
            id="otp_code"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="text-lg tracking-widest text-center"
            autoComplete="one-time-code"
            autoFocus
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || code.length < 6}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Email
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Didn&apos;t receive the code? Check your spam folder or{' '}
        <a href={ROUTES.REGISTER} className="text-primary hover:underline">
          register again
        </a>
        .
      </p>
    </div>
  );
}
