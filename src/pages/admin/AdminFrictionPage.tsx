import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardHeader } from '@/components/features';
import { mockFrictionReports } from '@/lib/mock-data';
import {
  Search,
  CheckCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function AdminFrictionPage() {
  const [reports, setReports] = useState(mockFrictionReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.request_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.commissioner_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'resolved' && report.is_resolved) ||
      (statusFilter === 'pending' && !report.is_resolved);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => !r.is_resolved).length,
    resolved: reports.filter(r => r.is_resolved).length,
  };

  const handleResolve = (reportId: number, notes: string) => {
    setReports(reports.map(r =>
      r.id === reportId 
        ? { ...r, is_resolved: true, resolved_at: new Date().toISOString(), resolution_notes: notes } 
        : r
    ));
    setResolutionNotes('');
  };

  const handleReopen = (reportId: number) => {
    setReports(reports.map(r =>
      r.id === reportId 
        ? { ...r, is_resolved: false, resolved_at: undefined, resolution_notes: undefined } 
        : r
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Friction Reports"
        description="User-reported issues and suggestions"
      />

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="font-medium">No reports found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`h-3 w-3 rounded-full mt-1.5 ${
                    report.is_resolved ? 'bg-green-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <Badge variant={report.is_resolved ? 'secondary' : 'default'}>
                        {report.is_resolved ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Resolved</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Pending</>
                        )}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        by {report.commissioner_name}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{report.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Request: {report.request_code}</span>
                      <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                      {report.resolved_at && (
                        <span className="text-green-600">
                          Resolved {formatDistanceToNow(new Date(report.resolved_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {report.resolution_notes && (
                      <div className="mt-2 p-2 rounded bg-muted/50 text-sm">
                        <span className="font-medium">Resolution: </span>
                        {report.resolution_notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {report.is_resolved ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleReopen(report.id)}
                      >
                        Reopen
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm">
                            Resolve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolve Friction Report</DialogTitle>
                            <DialogDescription>
                              Submitted {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-muted-foreground">Issue</Label>
                              <p className="mt-1">{report.reason}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Request Code</Label>
                                <p className="font-mono mt-1">{report.request_code}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Commissioner</Label>
                                <p className="mt-1">{report.commissioner_name}</p>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="resolution-notes">Resolution Notes</Label>
                              <Textarea 
                                id="resolution-notes"
                                placeholder="Describe how the issue was resolved..." 
                                className="mt-1" 
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => handleResolve(report.id, resolutionNotes)}
                            >
                              Mark Resolved
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Friction Report Details</DialogTitle>
                          <DialogDescription>
                            Submitted {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Badge variant={report.is_resolved ? 'secondary' : 'default'}>
                              {report.is_resolved ? 'Resolved' : 'Pending'}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Issue</Label>
                            <p className="mt-1">{report.reason}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground">Request Code</Label>
                              <p className="font-mono mt-1">{report.request_code}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Commissioner</Label>
                              <p className="mt-1">{report.commissioner_name}</p>
                            </div>
                          </div>
                          {report.resolution_notes && (
                            <div>
                              <Label className="text-muted-foreground">Resolution Notes</Label>
                              <p className="mt-1">{report.resolution_notes}</p>
                            </div>
                          )}
                          {report.resolved_at && (
                            <div>
                              <Label className="text-muted-foreground">Resolved At</Label>
                              <p className="mt-1">{format(new Date(report.resolved_at), 'MMM d, yyyy h:mm a')}</p>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
