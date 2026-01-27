import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROUTES, API_BASE_URL } from '@/lib/constants';
import { Loader2, ArrowLeft, CheckCircle, Mail } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (response.ok) {
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
      } else {
        // Still show success to prevent email enumeration
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
      }
    } catch {
      // Still show success to prevent email enumeration
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground mt-2 mb-6">
          We've sent password reset instructions to{' '}
          <span className="font-medium text-foreground">{submittedEmail}</span>
        </p>

        <div className="space-y-4">
          <Alert className="text-left">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              If you don't receive an email within a few minutes, check your spam folder 
              or make sure you entered the correct email address.
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setIsSubmitted(false);
              setSubmittedEmail('');
            }}
          >
            Try another email
          </Button>

          <Link to={ROUTES.LOGIN}>
            <Button variant="ghost" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground mt-1">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send reset instructions
        </Button>
      </form>

      <div className="mt-6">
        <Link to={ROUTES.LOGIN}>
          <Button variant="ghost" className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Button>
        </Link>
      </div>
    </div>
  );
}
