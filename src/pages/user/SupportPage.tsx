import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,

  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useGetTicketsQuery, useCreateTicketMutation } from '@/store/api/ticketApi';
import { format } from 'date-fns';
import { Plus, Loader2, MessageSquare, ArrowRight} from 'lucide-react';
import { toast } from 'sonner';
// import { PageHeader } from '@/components/features';
import type { TicketCategory, TicketPriority } from '@/types';

export function SupportPage() {
  const navigate = useNavigate();
  const [page] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data, isLoading } = useGetTicketsQuery({ page });
  
  const handleRowClick = (ticketId: number) => {
    navigate(`/tickets/${ticketId}`);
  };

  return (
    <div className="container max-w-5xl py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground text-lg">
            We're here to help. Manage your tickets and get support.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="lg" className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Create New Ticket
        </Button>
      </div>

      <Card className="border-muted/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Your Tickets</CardTitle>
              <CardDescription>
                Track the status of your support requests
              </CardDescription>
            </div>
            {data?.results && data.results.length > 0 && (
              <Badge variant="secondary" className="px-2 py-1">
                {data.count} {data.count === 1 ? 'Ticket' : 'Tickets'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your tickets...</p>
            </div>
          ) : data?.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 p-8">
              <div className="bg-primary/5 p-6 rounded-full ring-1 ring-primary/10">
                <MessageSquare className="h-10 w-10 text-primary/60" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-semibold">No tickets yet</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You haven't submitted any support requests. If you need help with your affidavit or have a question, we're here to assist.
                </p>
              </div>
              <Button onClick={() => setIsCreateOpen(true)} className="mt-2">
                Create Your First Ticket
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-[400px]">Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.results.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => handleRowClick(ticket.id)}
                    >
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-base">{ticket.subject}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            ID: #{ticket.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize font-normal">
                          {ticket.category_display}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TicketStatusBadge status={ticket.status} label={ticket.status_display} />
                      </TableCell>
                      <TableCell>
                        <TicketPriorityBadge priority={ticket.priority} label={ticket.priority_display} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ticket.updated_at), 'MMM d, yyyy')}
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

      <CreateTicketDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function TicketStatusBadge({ status, label }: { status: string; label: string }) {
  // Custom styling via classes since Badge variants are limited
  const classes: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
    in_progress: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
    resolved: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
    closed: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
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

function CreateTicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [createTicket, { isLoading }] = useCreateTicketMutation();
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical' as TicketCategory,
    priority: 'medium' as TicketPriority,
    description: '',
  });
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTicket({
        ...formData,
        files: files.length > 0 ? files : undefined,
      }).unwrap();
      toast.success('Ticket created successfully');
      onOpenChange(false);
      setFormData({ subject: '', category: 'technical', priority: 'medium', description: '' });
      setFiles([]);
    } catch (err) {
      // Error handled by baseApi
      console.error('Error creating ticket:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue in detail. We'll get back to you shortly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              required
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief summary of the issue"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val: TicketCategory) => setFormData(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="legal">Legal Question</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(val: TicketPriority) => setFormData(prev => ({ ...prev, priority: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide as much detail as possible..."
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <Input
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setFiles(Array.from(e.target.files));
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
