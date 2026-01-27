import { useState } from 'react';
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
import { DashboardHeader } from '@/components/features';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle, Stamp, FileText, Bell } from 'lucide-react';

const settingsSchema = z.object({
  commission_number: z.string().min(1, 'Commission number is required'),
  commission_expiry: z.string().min(1, 'Expiry date is required'),
  county: z.string().min(1, 'County is required'),
  stamp_text: z.string().optional(),
  signature_name: z.string().min(1, 'Signature name is required'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function CommissionerSettingsPage() {
  const { user, isLoading } = useAuth();
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    newRequests: true,
    reminders: true,
    expiryWarning: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      commission_number: 'NC-12345678',
      commission_expiry: '2026-12-31',
      county: 'Wake County',
      stamp_text: 'NOTARY PUBLIC\nState of North Carolina',
      signature_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    },
  });

  const onSubmit = async (_data: SettingsFormData) => {
    setSaved(false);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Commissioner Settings"
        description="Manage your notary commission and preferences"
      />

      <Tabs defaultValue="commission" className="space-y-6">
        <TabsList>
          <TabsTrigger value="commission" className="gap-2">
            <Stamp className="h-4 w-4" />
            Commission
          </TabsTrigger>
          <TabsTrigger value="stamp" className="gap-2">
            <FileText className="h-4 w-4" />
            Stamp Settings
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Commission Details</CardTitle>
              <CardDescription>
                Your notary commission information used for official stamps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {saved && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Settings saved successfully.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission_number">Commission Number</Label>
                    <Input
                      id="commission_number"
                      placeholder="e.g., NC-12345678"
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
                  <Label htmlFor="county">County of Commission</Label>
                  <Input
                    id="county"
                    placeholder="e.g., Wake County"
                    {...register('county')}
                  />
                  {errors.county && (
                    <p className="text-sm text-destructive">{errors.county.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature_name">Signature Name</Label>
                  <Input
                    id="signature_name"
                    placeholder="Name as it appears on your commission"
                    {...register('signature_name')}
                  />
                  {errors.signature_name && (
                    <p className="text-sm text-destructive">{errors.signature_name.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stamp">
          <Card>
            <CardHeader>
              <CardTitle>Stamp Customization</CardTitle>
              <CardDescription>
                Customize how your notary stamp appears on documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stamp_text">Stamp Text</Label>
                <Textarea
                  id="stamp_text"
                  placeholder="Enter custom stamp text..."
                  rows={4}
                  {...register('stamp_text')}
                />
                <p className="text-xs text-muted-foreground">
                  This text will appear on your official notary stamp.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Stamp Preview</h4>
                <div className="aspect-3/1 max-w-md border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                  <div className="text-center p-4">
                    <Stamp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-mono text-muted-foreground">Stamp preview</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Stamp Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about notarization requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Request Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a new request is ready for notarization
                  </p>
                </div>
                <Switch
                  checked={notifications.newRequests}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, newRequests: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Daily Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Receive daily summary of pending requests
                  </p>
                </div>
                <Switch
                  checked={notifications.reminders}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, reminders: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Commission Expiry Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Get reminded before your commission expires
                  </p>
                </div>
                <Switch
                  checked={notifications.expiryWarning}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, expiryWarning: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
