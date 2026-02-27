import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge, TierBadge } from '@/components/features';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import { 
  useGetCommissionerScheduleQuery,
  useLazyLookupRequestQuery 
} from '@/store/api/commissionerApi';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Clock,
  FileText,
  ArrowRight,
  AlertCircle,
  Loader2,
  User,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Request } from '@/types';

// Extended request type with lock warning from API
interface LookupRequestResult extends Request {
  lock_warning?: string;
  can_takeover?: boolean;
}

export function CommissionerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Search state
  const [searchCode, setSearchCode] = useState('');
  
  // API hooks — use schedule to derive both badge count and accepted requests
  const { data: schedule, isLoading: scheduleLoading } = useGetCommissionerScheduleQuery();
  const [lookupRequest, { data: lookupResult, isLoading: lookupLoading, error: lookupError }] = useLazyLookupRequestQuery();
  
  const result = lookupResult as LookupRequestResult | undefined;
  
  // Count pending appointment requests for badge
  const pendingCount =
    schedule?.filter((s) => s.appointment_status === 'pending').length ?? 0;

  // Only show requests where commissioner has ACCEPTED the appointment AND not yet completed
  const acceptedSlots =
    schedule?.filter(
      (s) =>
        s.appointment_status === 'accepted' &&
        s.request_details &&
        !['completed', 'COMPLETED'].includes(s.request_details.status ?? '')
    ) ?? [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    try {
      await lookupRequest(searchCode.trim()).unwrap();
    } catch (err: any) {
      toast({
        title: "Search Failed",
        description: err?.data?.error || "An error occurred during search.",
        variant: "destructive",
      });
    }
  };

  const handleViewRequest = (code: string) => {
    navigate(ROUTES.COMMISSIONER_REQUEST.replace(':code', code));
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {user?.first_name || 'Commissioner'}!
          </h1>
          <p className="text-muted-foreground">
            Look up requests by code or view your confirmed appointments
          </p>
        </div>
        {/* My Schedule button with pending badge */}
        <div className="relative inline-block shrink-0">
          <Button
            onClick={() => navigate(ROUTES.COMMISSIONER_SCHEDULE)}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            aria-label={`My Schedule${pendingCount > 0 ? ` — ${pendingCount} pending appointment requests` : ''}`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            My Schedule
          </Button>
          {pendingCount > 0 && (
            <span
              className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-sm pointer-events-none"
              aria-label={`${pendingCount} pending`}
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </div>
      </div>

      {/* Search by Code - Primary Action */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Look Up Request by Code
          </CardTitle>
          <CardDescription>
            Enter the client's request code to view and notarize their affidavit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              placeholder="Enter code (e.g., AFF-XXXX-Y)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="font-mono text-lg flex-1"
            />
            <Button type="submit" disabled={lookupLoading || !searchCode.trim()}>
              {lookupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </form>

          {/* Lookup Error */}
          {lookupError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No request found with code "{searchCode}". Please verify the code.
              </AlertDescription>
            </Alert>
          )}

          {/* Lookup Result */}
          {result && !lookupError && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono font-semibold text-lg">{result.request_code}</p>
                    <StatusBadge status={result.status} />
                  </div>
                  <p className="text-lg font-medium">{result.affidavit_type?.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <TierBadge tier={result.affidavit_type?.tier} size="sm" />
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(result.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {result.lock_warning && (
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {result.lock_warning}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <Button onClick={() => handleViewRequest(result.request_code)}>
                  View & Notarize
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmed Appointments - Only requests with accepted appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            My Confirmed Appointments
          </CardTitle>
          <CardDescription>
            Affidavits where you accepted an appointment — ready for notarization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduleLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : acceptedSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No confirmed appointments</p>
              <p className="text-sm mt-1">
                {pendingCount > 0 ? (
                  <>
                    You have{' '}
                    <span className="font-semibold text-amber-600">{pendingCount} pending request{pendingCount > 1 ? 's' : ''}</span>
                    {' '}— go to{' '}
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-primary underline cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(ROUTES.COMMISSIONER_SCHEDULE)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(ROUTES.COMMISSIONER_SCHEDULE)}
                      aria-label="Go to My Schedule to accept appointments"
                    >
                      My Schedule
                    </span>{' '}
                    to accept them.
                  </>
                ) : (
                  'Requests will appear here after you accept appointment requests in My Schedule'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {acceptedSlots.map((slot) => (
                <div
                  key={slot.id}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => handleViewRequest(slot.request_details!.request_code)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleViewRequest(slot.request_details!.request_code)
                  }
                  aria-label={`Open request ${slot.request_details!.request_code}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium">{slot.request_details!.request_code}</p>
                        <StatusBadge status={slot.request_details!.status} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {slot.request_details!.affidavit_type}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {slot.request_details!.client_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(slot.start_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'America/Port_of_Spain',
                        })}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
