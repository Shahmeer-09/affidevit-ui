import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardHeader, StatusBadge } from '@/components/features';
import { ROUTES } from '@/lib/constants';
import {
  Search,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';
import {
  useGetCommissionerScheduleQuery,
  useLazyLookupRequestQuery,
} from '@/store/api/commissionerApi';

export function CommissionerLookupPage() {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [searched, setSearched] = useState(false);

  // Real data from API
  const { data: schedule, isLoading: scheduleLoading } = useGetCommissionerScheduleQuery();
  const [lookupRequest, { data: lookupResult, isLoading: isSearching, isError: lookupError }] =
    useLazyLookupRequestQuery();

  // Count pending appointment requests for badge
  const pendingCount =
    schedule?.filter((s) => s.appointment_status === 'pending').length ?? 0;

  // Show requests where commissioner has ACCEPTED the appointment,
  // but hide them once the commissioner has marked them as completed.
  const acceptedSlots =
    schedule?.filter(
      (s) =>
        s.appointment_status === 'accepted' &&
        s.request_details &&
        !['completed', 'COMPLETED'].includes(s.request_details.status)
    ) ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setSearched(true);
    lookupRequest(searchCode.trim().toUpperCase());
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader
          title="Look Up Request"
          description="Search for an affidavit request by its code to notarize"
        />

        {/* My Schedule button with pending badge */}
        <div className="relative inline-block shrink-0">
          <Button
            asChild
            variant="outline"
            className="cursor-pointer hover:bg-muted transition-colors"
            aria-label={`My Schedule${pendingCount > 0 ? ` — ${pendingCount} pending appointment requests` : ''}`}
          >
            <Link to={ROUTES.COMMISSIONER_SCHEDULE}>
              <Calendar className="h-4 w-4 mr-2" />
              My Schedule
            </Link>
          </Button>
          {pendingCount > 0 && (
            <span
              className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-sm pointer-events-none"
              aria-label={`${pendingCount} pending appointment requests`}
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search by Request Code</CardTitle>
          <CardDescription>
            Enter the unique code provided by the client to look up their affidavit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="code" className="sr-only">Request Code</Label>
              <Input
                id="code"
                placeholder="e.g., AFF-2024-001234"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                className="font-mono"
                aria-label="Request code input"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching || !searchCode.trim()}
              className="cursor-pointer hover:opacity-90 transition-opacity"
              aria-label="Search for request"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </form>

          {/* Search Result */}
          {searched && !isSearching && lookupError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No request found with code "{searchCode}". Please verify the code and try again.
              </AlertDescription>
            </Alert>
          )}

          {searched && !isSearching && lookupResult && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono font-semibold">{lookupResult.request_code}</p>
                    <StatusBadge status={lookupResult.status} size="sm" />
                  </div>
                  <p className="text-lg font-medium">{lookupResult.affidavit_type.name}</p>
                </div>
                <Button
                  onClick={() =>
                    navigate(ROUTES.COMMISSIONER_REQUEST.replace(':code', lookupResult.request_code))
                  }
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  aria-label={`View request ${lookupResult.request_code}`}
                >
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Accepted Appointments — only accepted slots show here */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            My Confirmed Appointments
          </CardTitle>
          <CardDescription>
            Affidavits where you have accepted an appointment — ready for notarization
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
                Accept appointment requests in{' '}
                <Link
                  to={ROUTES.COMMISSIONER_SCHEDULE}
                  className="text-primary underline cursor-pointer hover:opacity-80 transition-opacity"
                  aria-label="Go to My Schedule"
                >
                  My Schedule
                </Link>{' '}
                to see requests here.
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
                  onClick={() =>
                    navigate(
                      ROUTES.COMMISSIONER_REQUEST.replace(':code', slot.request_details!.request_code)
                    )
                  }
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    navigate(
                      ROUTES.COMMISSIONER_REQUEST.replace(':code', slot.request_details!.request_code)
                    )
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
                  <div className="flex items-center gap-3 text-right">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
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
