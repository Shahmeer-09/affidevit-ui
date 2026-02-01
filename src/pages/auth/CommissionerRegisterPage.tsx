import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  AvailabilityScheduler, 
  defaultSchedule, 
  formatAvailability,
  type WeeklySchedule 
} from '@/components/ui/availability-scheduler';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/lib/constants';
import { Eye, EyeOff, Loader2, Check, ArrowLeft, Briefcase, Clock } from 'lucide-react';

const commissionerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(
    /^(\+?1[-.]?)?868[-.]?\d{3}[-.]?\d{4}$/,
    'Please enter a valid Trinidad and Tobago phone number (e.g., 868-123-4567)'
  ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  password_confirm: z.string(),
  organization: z.string().min(2, 'Organization name is required'),
  commissioner_number: z.string().min(1, 'Commissioner number is required'),
  commission_expiry: z.string().optional(),
  address: z.string().min(5, 'Please enter your business address'),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_account_name: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

type CommissionerFormData = z.infer<typeof commissionerSchema>;

export function CommissionerRegisterPage() {
  const { registerCommissioner, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [paymentPreference, setPaymentPreference] = useState<string>('bank_transfer');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [availability, setAvailability] = useState<WeeklySchedule>(defaultSchedule);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CommissionerFormData>({
    resolver: zodResolver(commissionerSchema),
    mode: 'onChange',
  });

  const password = watch('password', '');

  const passwordChecks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
  ];

  const validateStep = async (currentStep: number) => {
    let fieldsToValidate: (keyof CommissionerFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['first_name', 'last_name', 'email', 'phone', 'password', 'password_confirm'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['organization', 'commissioner_number', 'commission_expiry', 'address'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep(step);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = async (data: CommissionerFormData) => {
    setError(null);
    try {
      await registerCommissioner({
        email: data.email,
        password: data.password,
        password_confirm: data.password_confirm,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone,
        organization: data.organization,
        commission_number: data.commissioner_number,
        commission_expiry: data.commission_expiry || undefined,
        address: data.address,
        bank_name: data.bank_name || '',
        bank_branch: data.bank_branch || '',
        bank_account_number: data.bank_account_number || '',
        bank_account_name: data.bank_account_name || '',
        payment_preference: paymentPreference as 'bank_transfer' | 'cheque' | 'cash',
        availability: formatAvailability(availability),
        profile_image: profileImage || undefined,
      });
      
      // Show success toast and redirect to login
      toast({
        title: 'Registration Submitted!',
        description: 'Your request has been sent. Once approved by admin, you will be able to login.',
        variant: 'default',
      });
      
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err: any) {
      // Handle field-specific validation errors from backend
      if (err?.data) {
        const errors = err.data;
        let errorMessage = '';
        
        // Build error message from field errors
        if (errors.email) errorMessage += errors.email[0] + ' ';
        if (errors.phone_number) errorMessage += errors.phone_number[0] + ' ';
        if (errors.commission_number) errorMessage += errors.commission_number[0] + ' ';
        if (errors.bank_account_number) errorMessage += errors.bank_account_number[0] + ' ';
        
        setError(errorMessage.trim() || 'Validation error occurred.');
        
        // Also show toast for better visibility
        toast({
          title: 'Registration Failed',
          description: errorMessage.trim() || 'Please check your information and try again.',
          variant: 'destructive',
        });
      } else {
        setError(err?.message || 'An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to={ROUTES.REGISTER} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to User Registration
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Commissioner Registration</h1>
            <p className="text-muted-foreground text-sm">
              Join as a certified commissioner
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mb-6">
        <span className={step >= 1 ? 'text-primary font-medium' : ''}>Account</span>
        <span className={step >= 2 ? 'text-primary font-medium' : ''}>Professional</span>
        <span className={step >= 3 ? 'text-primary font-medium' : ''}>Availability</span>
        <span className={step >= 4 ? 'text-primary font-medium' : ''}>Payment</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Account Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-sm">First name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  className="h-9"
                  {...register('first_name')}
                />
                {errors.first_name && (
                  <p className="text-xs text-destructive">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-sm">Last name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  className="h-9"
                  {...register('last_name')}
                />
                {errors.last_name && (
                  <p className="text-xs text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="h-9"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="868-123-4567"
                className="h-9"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className="h-9 pr-10"
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
              <div className="flex gap-4 mt-1.5">
                {passwordChecks.map((check) => (
                  <div
                    key={check.label}
                    className={`flex items-center gap-1 text-xs ${
                      check.valid ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    <Check className={`h-3 w-3 ${check.valid ? 'opacity-100' : 'opacity-30'}`} />
                    {check.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password_confirm" className="text-sm">Confirm password</Label>
              <Input
                id="password_confirm"
                type="password"
                placeholder="Confirm your password"
                className="h-9"
                {...register('password_confirm')}
              />
              {errors.password_confirm && (
                <p className="text-xs text-destructive">{errors.password_confirm.message}</p>
              )}
            </div>

            <Button type="button" className="w-full" onClick={nextStep}>
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Professional Info */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="organization" className="text-sm">Organization</Label>
              <Input
                id="organization"
                placeholder="Your organization or firm name"
                className="h-9"
                {...register('organization')}
              />
              {errors.organization && (
                <p className="text-xs text-destructive">{errors.organization.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="commissioner_number" className="text-sm">Commissioner Number</Label>
              <Input
                id="commissioner_number"
                placeholder="Your official commissioner number"
                className="h-9"
                {...register('commissioner_number')}
              />
              {errors.commissioner_number && (
                <p className="text-xs text-destructive">{errors.commissioner_number.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="commission_expiry" className="text-sm">Commission Expiry Date (optional)</Label>
              <Input
                id="commission_expiry"
                type="date"
                className="h-9"
                {...register('commission_expiry')}
              />
              {errors.commission_expiry && (
                <p className="text-xs text-destructive">{errors.commission_expiry.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm">Business Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your full business address"
                className="resize-none min-h-20"
                {...register('address')}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile_image" className="text-sm">Profile Photo (optional)</Label>
              <Input
                id="profile_image"
                type="file"
                accept="image/*"
                className="h-9"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={prevStep}>
                Back
              </Button>
              <Button type="button" className="flex-1" onClick={nextStep}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Availability */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Set Your Availability</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Define when you're available for client appointments. Clients will see this when selecting you as their commissioner.
              </p>
            </div>

            <AvailabilityScheduler
              value={availability}
              onChange={setAvailability}
            />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={prevStep}>
                Back
              </Button>
              <Button type="button" className="flex-1" onClick={nextStep}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Payment Info */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Payment Preference</Label>
              <Select value={paymentPreference} onValueChange={setPaymentPreference}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentPreference === 'bank_transfer' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bank_name" className="text-sm">Bank Name</Label>
                    <Input
                      id="bank_name"
                      placeholder="Bank name"
                      className="h-9"
                      {...register('bank_name')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bank_branch" className="text-sm">Branch</Label>
                    <Input
                      id="bank_branch"
                      placeholder="Branch code"
                      className="h-9"
                      {...register('bank_branch')}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bank_account_number" className="text-sm">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    placeholder="Your account number"
                    className="h-9"
                    {...register('bank_account_number')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bank_account_name" className="text-sm">Account Holder Name</Label>
                  <Input
                    id="bank_account_name"
                    placeholder="Name on account"
                    className="h-9"
                    {...register('bank_account_name')}
                  />
                </div>
              </>
            )}

            <div className="text-xs text-muted-foreground">
              By registering, you agree to our{' '}
              <Link to="#" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="#" className="text-primary hover:underline">Privacy Policy</Link>.
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={prevStep}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Registration
              </Button>
            </div>
          </div>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
