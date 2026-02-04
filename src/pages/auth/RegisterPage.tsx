import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Card components not used in this file
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/lib/constants';
import { Eye, EyeOff, Loader2, Check, Briefcase } from 'lucide-react';

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required').regex(
    /^(\+?1[-.]?)?868[-.]?\d{3}[-.]?\d{4}$/,
    'Please enter a valid Trinidad and Tobago phone number (e.g., 868-123-4567)'
  ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');
  
  const passwordChecks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        password_confirm: data.password_confirm,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      });
      
      // Registration successful - user is logged in automatically
      navigate(ROUTES.MY_REQUESTS, { replace: true });
    } catch (err: any) {
      // Handle field-specific validation errors from backend
      if (err?.data) {
        const errors = err.data;
        let errorMessage = '';
        
        // Build error message from field errors
        if (errors.email) errorMessage += errors.email[0] + ' ';
        if (errors.phone_number) errorMessage += errors.phone_number[0] + ' ';
        
        setError(errorMessage.trim() || 'Validation error occurred.');
      } else {
        setError(err?.message || 'An error occurred. Please try again.');
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground mt-1">
          Get started with your free account today
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              placeholder="John"
              autoComplete="given-name"
              {...register('first_name')}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              placeholder="Doe"
              autoComplete="family-name"
              {...register('last_name')}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name.message}</p>
            )}
          </div>
        </div>

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
          <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
          <Input
            id="phone"
            type="tel"
            placeholder="868-123-4567"
            autoComplete="tel"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              autoComplete="new-password"
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
          
          {/* Password Requirements */}
          <div className="mt-2 space-y-1">
            {passwordChecks.map((check) => (
              <div
                key={check.label}
                className={`flex items-center gap-2 text-xs ${
                  check.valid ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                <Check className={`h-3 w-3 ${check.valid ? 'opacity-100' : 'opacity-30'}`} />
                {check.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password_confirm">Confirm password</Label>
          <Input
            id="password_confirm"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            {...register('password_confirm')}
          />
          {errors.password_confirm && (
            <p className="text-sm text-destructive">{errors.password_confirm.message}</p>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link to="#" className="text-primary hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="#" className="text-primary hover:underline">Privacy Policy</Link>.
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>

      {/* Commissioner Registration Link */}
      <div className="mt-6 pt-6 border-t">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Are you a certified commissioner?
          </p>
          <Link to={ROUTES.REGISTER_COMMISSIONER}>
            <Button variant="outline" className="w-full gap-2">
              <Briefcase className="h-4 w-4" />
              Sign up as Commissioner
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
