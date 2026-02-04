import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useGetTicketsQuery } from '@/store/api/ticketApi';
import { format } from 'date-fns';
import { Loader2, MessageSquare, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/features';

export function AdminSupportPage() {
  const navigate = useNavigate();
  const [page] = useState(1);
  const { data, isLoading } = useGetTicketsQuery({ page });
  
  const handleRowClick = (ticketId: number) => {
    navigate(`/admin/tickets/${ticketId}`);
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Support Tickets"
        description="Manage user support requests and issues."
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
             <div>
                <CardTitle>All Tickets</CardTitle>
                <CardDescription>
                  View and manage all support tickets.
                </CardDescription>
             </div>
             {/* Add filters later */}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No tickets found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.results.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(ticket.id)}
                    >
                      <TableCell className="font-medium">#{ticket.id}</TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>{ticket.user_name}</TableCell>
                      <TableCell>{ticket.category_display}</TableCell>
                      <TableCell>
                        <TicketStatusBadge status={ticket.status} label={ticket.status_display} />
                      </TableCell>
                      <TableCell>
                        <TicketPriorityBadge priority={ticket.priority} label={ticket.priority_display} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(ticket.id);
                          }}
                          className="font-medium"
                        >
                          Open
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TicketStatusBadge({ status, label }: { status: string; label: string }) {
  const classes: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 border-blue-200",
    in_progress: "bg-amber-100 text-amber-800 border-amber-200",
    resolved: "bg-green-100 text-green-800 border-green-200",
    closed: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Badge variant="outline" className={`border-0 ${classes[status] || ""}`}>
      {label}
    </Badge>
  );
}

function TicketPriorityBadge({ priority, label }: { priority: string; label: string }) {
  const classes: Record<string, string> = {
    low: "text-gray-500",
    medium: "text-blue-500",
    high: "text-orange-500 font-medium",
    urgent: "text-red-600 font-bold",
  };

  return (
    <span className={`text-sm ${classes[priority] || ""}`}>
      {label}
    </span>
  );
}
