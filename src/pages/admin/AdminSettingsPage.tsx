import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardHeader } from '@/components/features';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} from '@/store/api/adminApi';
import {
  Save,
  Loader2,
  Settings,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function AdminSettingsPage() {
  const { data: settings, isLoading, error, refetch } = useGetSiteSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSiteSettingsMutation();

  const [payoutAmount, setPayoutAmount] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form when data loads (only once)
  if (settings && !isInitialized) {
    setPayoutAmount(settings.default_payout_amount);
    setHasChanges(false);
    setIsInitialized(true);
  }

  const handlePayoutChange = (value: string) => {
    setPayoutAmount(value);
    setHasChanges(value !== settings?.default_payout_amount);
  };

  const handleSave = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) < 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }

    try {
      await updateSettings({ default_payout_amount: payoutAmount }).unwrap();
      toast.success('Settings updated successfully');
      setHasChanges(false);
    } catch (err) {
      toast.error('Failed to update settings');
      console.error('Save error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <DashboardHeader
          title="Site Settings"
          description="Manage global application settings"
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <DashboardHeader
          title="Site Settings"
          description="Manage global application settings"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load settings</h3>
            <p className="text-muted-foreground mb-4">Please try again later</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Site Settings"
        description="Manage global application settings"
      >
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </DashboardHeader>

      {/* Payment Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Commissioner Payout Settings</CardTitle>
              <CardDescription>
                Configure the global payout amount for commissioners
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payout_amount">Default Payout Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="payout_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={payoutAmount}
                  onChange={(e) => handlePayoutChange(e.target.value)}
                  className="pl-9"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This amount will be paid to commissioners for each completed affidavit.
                It applies globally to all commissioners.
              </p>
            </div>

            {hasChanges && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  You have unsaved changes
                </p>
              </div>
            )}

            {!hasChanges && settings && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Settings are up to date
                </p>
              </div>
            )}
          </div>

          {settings && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Last updated: {format(new Date(settings.updated_at), 'MMMM d, yyyy h:mm a')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Settings className="h-6 w-6 text-blue-500 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                About Global Payout Amount
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                The payout amount is applied uniformly to all commissioners when they complete 
                an affidavit. This simplifies payment management and ensures consistent 
                compensation across all commissioners.
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                <li>This amount is recorded when a commissioner marks an affidavit as complete</li>
                <li>Changes to this setting only affect future completions, not past stamps</li>
                <li>Track individual commissioner earnings in the Staff Management page</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
