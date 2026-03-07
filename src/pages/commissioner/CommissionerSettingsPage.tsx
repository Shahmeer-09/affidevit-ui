import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHeader } from '@/components/features';
import { useUpdateProfileMutation, useGetProfileQuery } from '@/store/api/authApi';
import { Loader2, CheckCircle, User, Clock, Plus, Trash2, Settings2 } from 'lucide-react';
import type { TimeSlot, AvailabilitySchedule } from '@/types';
import { toast } from 'sonner';

const settingsSchema = z.object({
  commission_number: z.string().optional(),
  commission_expiry: z.string().optional(),
  organization: z.string().optional(),
  bio: z.string().optional(),
  address: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<typeof DAYS[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function CommissionerSettingsPage() {
  const { data: profile, isLoading: isLoadingProfile, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [saved, setSaved] = useState(false);

  // Availability state - initialize empty, will be populated from profile
  const [availability, setAvailability] = useState<AvailabilitySchedule>({
    recurring: {},
    timezone: 'America/Port_of_Spain',
  });

  // Preferences state
  const [autoAccept, setAutoAccept] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      commission_number: '',
      commission_expiry: '',
      organization: '',
      bio: '',
      address: '',
    },
  });

  // Sync form and availability when profile loads
  useEffect(() => {
    if (profile) {
      // Reset form with profile data
      reset({
        commission_number: profile.commission_number || '',
        commission_expiry: profile.commission_expiry || '',
        organization: profile.organization || '',
        bio: profile.bio || '',
        address: profile.address || '',
      });

      // Set availability from profile
      if (profile.availability) {
        setAvailability({
          recurring: profile.availability.recurring || {},
          timezone: profile.availability.timezone || 'America/Port_of_Spain',
        });
      }

      // Sync preferences
      setAutoAccept(profile.auto_accept_appointments ?? false);
    }
  }, [profile, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setSaved(false);
      await updateProfile(data).unwrap();
      await refetch();
      setSaved(true);
      toast.success('Profile saved successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const onSaveAvailability = async () => {
    try {
      await updateProfile({ availability: availability as unknown as Record<string, unknown> }).unwrap();
      await refetch();
      toast.success('Availability saved successfully');
    } catch (error) {
      console.error('Failed to save availability:', error);
      toast.error('Failed to save availability');
    }
  };

  const onToggleAutoAccept = async (value: boolean) => {
    setAutoAccept(value);
    setIsSavingPrefs(true);
    try {
      await updateProfile({ auto_accept_appointments: value }).unwrap();
      await refetch();
      toast.success(
        value ? 'Auto-Accept enabled — new bookings will be accepted automatically.' : 'Auto-Accept disabled.',
      );
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update preferences');
      setAutoAccept(!value); // revert on error
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const addTimeSlot = (day: typeof DAYS[number]) => {
    setAvailability((prev) => ({
      ...prev,
      recurring: {
        ...prev.recurring,
        [day]: [
          ...(prev.recurring?.[day] || []),
          { start: '09:00', end: '17:00' },
        ],
      },
    }));
  };

  const removeTimeSlot = (day: typeof DAYS[number], index: number) => {
    setAvailability((prev) => ({
      ...prev,
      recurring: {
        ...prev.recurring,
        [day]: prev.recurring?.[day]?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  const updateTimeSlot = (
    day: typeof DAYS[number],
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    setAvailability((prev) => ({
      ...prev,
      recurring: {
        ...prev.recurring,
        [day]: prev.recurring?.[day]?.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        ) || [],
      },
    }));
  };

  const toggleDay = (day: typeof DAYS[number]) => {
    setAvailability((prev) => {
      const currentSlots = prev.recurring?.[day] || [];
      if (currentSlots.length > 0) {
        // Remove all slots for this day
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [day]: _removed, ...rest } = prev.recurring || {};
        return { ...prev, recurring: rest };
      } else {
        // Add default slot for this day
        return {
          ...prev,
          recurring: {
            ...prev.recurring,
            [day]: [{ start: '09:00', end: '17:00' }],
          },
        };
      }
    });
  };

  // Loading skeleton
  if (isLoadingProfile) {
    return (
      <div className="p-6 space-y-6">
        <DashboardHeader
          title="Commissioner Settings"
          description="Manage your profile and availability"
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Commissioner Settings"
        description="Manage your profile and availability"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <Clock className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your commissioner details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {saved && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Profile saved successfully.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission_number">Commission Number</Label>
                    <Input
                      id="commission_number"
                      placeholder="e.g., COM-12345"
                      {...register('commission_number')}
                    />
                    {errors.commission_number && (
                      <p className="text-sm text-destructive">{errors.commission_number.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commission_expiry">Commission Expiry Date</Label>
                    <Input
                      id="commission_expiry"
                      type="date"
                      {...register('commission_expiry')}
                    />
                    {errors.commission_expiry && (
                      <p className="text-sm text-destructive">{errors.commission_expiry.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    placeholder="e.g., Law Firm Name"
                    {...register('organization')}
                  />
                  {errors.organization && (
                    <p className="text-sm text-destructive">{errors.organization.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Office Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your office/business address"
                    rows={3}
                    {...register('address')}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell users about your experience and services..."
                    rows={4}
                    {...register('bio')}
                  />
                  {errors.bio && (
                    <p className="text-sm text-destructive">{errors.bio.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability Schedule</CardTitle>
              <CardDescription>
                Set your weekly availability for accepting affidavit requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {DAYS.map((day) => {
                  const slots = availability.recurring?.[day] || [];
                  const isEnabled = slots.length > 0;

                  return (
                    <div key={day} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => toggleDay(day)}
                          />
                          <Label className="font-semibold text-base cursor-pointer" onClick={() => toggleDay(day)}>
                            {DAY_LABELS[day]}
                          </Label>
                        </div>
                        {isEnabled && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(day)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Slot
                          </Button>
                        )}
                      </div>

                      {isEnabled && (
                        <div className="space-y-2 pl-10">
                          {slots.map((slot, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                                className="w-32"
                              />
                              <span className="text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                                className="w-32"
                              />
                              {slots.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTimeSlot(day, index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {Object.keys(availability.recurring || {}).length === 0
                    ? 'No availability set. Enable days above to start accepting requests.'
                    : `You are available on ${Object.keys(availability.recurring || {}).length} day(s) per week.`}
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={onSaveAvailability} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Availability
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preferences Tab ─────────────────────────────── */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Preferences</CardTitle>
              <CardDescription>
                Control how new appointment bookings are handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-Accept toggle */}
              <div className="flex items-start justify-between gap-6 p-4 rounded-lg border">
                <div className="space-y-1">
                  <Label htmlFor="auto-accept" className="text-base font-semibold cursor-pointer">
                    Auto-Accept Appointments
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, new appointment requests from clients are accepted
                    automatically — no manual review required on the Schedule page.
                  </p>
                  {autoAccept && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                      ⚠️ Auto-Accept is ON. All new bookings are confirmed instantly.
                    </p>
                  )}
                </div>
                <Switch
                  id="auto-accept"
                  checked={autoAccept}
                  onCheckedChange={onToggleAutoAccept}
                  disabled={isSavingPrefs}
                  aria-label="Toggle auto-accept appointments"
                  className="cursor-pointer shrink-0 mt-1"
                />
              </div>

              <Separator />

              <p className="text-xs text-muted-foreground">
                Changes are saved immediately when you toggle the switch.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
