import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge, TierBadge } from '@/components/features';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import { 
  useGetAssignedRequestsQuery, 
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
  Filter,
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
  const [filterCode, setFilterCode] = useState('');
  
  // API hooks
  const { data: assignedData, isLoading: assignedLoading } = useGetAssignedRequestsQuery();
  const [lookupRequest, { data: lookupResult, isLoading: lookupLoading, error: lookupError }] = useLazyLookupRequestQuery();
  
  const assignedRequests = assignedData?.results || [];
  const result = lookupResult as LookupRequestResult | undefined;
  
  // Filter assigned requests by code if filter is set
  const filteredRequests = filterCode
    ? assignedRequests.filter((r: Request) => 
        r.request_code.toLowerCase().includes(filterCode.toLowerCase())
      )
    : assignedRequests;

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
            Look up requests by code or view your assigned affidavits
          </p>
        </div>
        <Button onClick={() => navigate(ROUTES.COMMISSIONER_SCHEDULE)}>
          <Calendar className="h-4 w-4 mr-2" />
          My Schedule
        </Button>
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

      {/* Assigned Requests - Requests where user selected this commissioner */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Assigned Requests
              </CardTitle>
              <CardDescription>
                Affidavits where clients selected you as their commissioner
              </CardDescription>
            </div>
            {assignedRequests.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by code..."
                  value={filterCode}
                  onChange={(e) => setFilterCode(e.target.value)}
                  className="w-48 font-mono"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {assignedLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">
                {filterCode ? 'No requests match this filter' : 'No assigned requests'}
              </p>
              <p className="text-sm mt-1">
                {filterCode 
                  ? 'Try a different filter term' 
                  : 'Requests will appear here when clients select you as their commissioner'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request: Request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleViewRequest(request.request_code)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium">{request.request_code}</p>
                        <StatusBadge status={request.status} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.affidavit_type?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(request.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
