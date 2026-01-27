import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardHeader, StatusBadge } from '@/components/features';
import { getRequestByCode, mockRequests } from '@/lib/mock-data';
import { ROUTES } from '@/lib/constants';
import { Search, AlertCircle, FileText, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Request } from '@/types';

export function CommissionerLookupPage() {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<Request | null | 'not_found'>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Get requests ready for notarization
  const readyRequests = mockRequests.filter(r => 
    ['APPROVED', 'DRAFT_READY'].includes(r.status)
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      const result = getRequestByCode(searchCode.trim().toUpperCase());
      setSearchResult(result || 'not_found');
      setIsSearching(false);
    }, 500);
  };

  const handleViewRequest = (code: string) => {
    navigate(ROUTES.COMMISSIONER_REQUEST.replace(':code', code));
  };

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Look Up Request"
        description="Search for an affidavit request by its code to notarize"
      />

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
              />
            </div>
            <Button type="submit" disabled={isSearching || !searchCode.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          {/* Search Result */}
          {searchResult === 'not_found' && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No request found with code "{searchCode}". Please verify the code and try again.
              </AlertDescription>
            </Alert>
          )}

          {searchResult && searchResult !== 'not_found' && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono font-semibold">{searchResult.request_code}</p>
                    <StatusBadge status={searchResult.status} size="sm" />
                  </div>
                  <p className="text-lg font-medium">{searchResult.affidavit_type.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created {format(new Date(searchResult.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button onClick={() => handleViewRequest(searchResult.request_code)}>
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ready for Notarization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Ready for Notarization
          </CardTitle>
          <CardDescription>
            These affidavits have been approved and are waiting for your stamp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readyRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requests pending notarization</p>
            </div>
          ) : (
            <div className="space-y-3">
              {readyRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleViewRequest(request.request_code)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium">{request.request_code}</p>
                        <StatusBadge status={request.status} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">{request.affidavit_type.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(request.created_at), 'MMM d, h:mm a')}
                    </p>
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
