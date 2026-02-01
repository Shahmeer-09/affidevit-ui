import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/lib/constants';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const from = (location.state as { from?: string })?.from;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      const loggedInUser = await login(data.email, data.password, rememberMe);
      
      // Redirect based on user role if no specific 'from' location
      if (!from) {
        switch (loggedInUser.role) {
          case 'admin':
            // Superuser admins go to landing page, regular admins go to dashboard
            if (loggedInUser.is_superuser) {
              navigate(ROUTES.HOME, { replace: true });
            } else {
              navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
            }
            return;
          case 'reviewer':
            navigate(ROUTES.REVIEWER_DASHBOARD, { replace: true });
            return;
          case 'commissioner':
            navigate(ROUTES.COMMISSIONER_LOOKUP, { replace: true });
            return;
          default:
            navigate(ROUTES.HOME, { replace: true });
            return;
        }
      }
      
      // Use the 'from' location if specified
      navigate(from, { replace: true });
    } catch (err: any) {
      // Handle different error formats
      let errorMessage = 'Invalid email or password. Please try again.';
      
      if (err?.data?.non_field_errors && Array.isArray(err.data.non_field_errors)) {
        errorMessage = err.data.non_field_errors[0];
      } else if (err?.data?.detail) {
        errorMessage = err.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Show toast for pending approval message
      if (errorMessage.includes('pending admin approval')) {
        toast({
          title: 'Account Pending Approval',
          description: 'Your account is pending admin approval. You will be notified once approved.',
          variant: 'destructive',
        });
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label 
            htmlFor="rememberMe" 
            className="text-sm font-normal cursor-pointer"
          >
            Remember me for 7 days
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>

      <div className="mt-6">
       

      
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>

      {/* Demo Login Hint */}
      
    </div>
  );
}
