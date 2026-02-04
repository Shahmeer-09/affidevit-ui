import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useGetTicketQuery, useReplyTicketMutation, useUpdateTicketStatusMutation } from '@/store/api/ticketApi';
import { format } from 'date-fns';
import { ArrowLeft, Send, Loader2, Paperclip, Lock, Unlock, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = parseInt(id || '0');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const { data: ticket, isLoading, error, refetch } = useGetTicketQuery(ticketId, { 
    skip: !ticketId,
    // Poll every 5 seconds for real-time updates
    pollingInterval: 5000,
  });
  const [replyTicket, { isLoading: isReplying }] = useReplyTicketMutation();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateTicketStatusMutation();
  
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket?.messages]);
  
  // Refetch on tab focus for instant updates when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && ticketId) {
        refetch();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [ticketId, refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <p>Ticket not found or access denied.</p>
        <Button variant="link" onClick={() => navigate(isAdmin ? '/admin/tickets' : '/tickets')}>
          Return to Support Center
        </Button>
      </div>
    );
  }

  const handleReply = async () => {
    if (!message.trim()) return;
    try {
      await replyTicket({ 
        id: ticketId, 
        data: { message, is_internal: isInternal } 
      }).unwrap();
      setMessage('');
      setIsInternal(false);
    } catch (err) {
      // Error handled by baseApi
    }
  };

  const handleStatusChange = async (newStatus: 'open' | 'resolved' | 'closed') => {
    try {
      await updateStatus({ id: ticketId, data: { status: newStatus } }).unwrap();
      toast.success(`Ticket marked as ${newStatus}`);
    } catch (err) {
      // Error handled
    }
  };

  return (
    <div className="container max-w-6xl py-6 h-[calc(100vh-2rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section - Sticky at Top */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b pb-4 shrink-0 bg-background/95 backdrop-blur z-30 sticky top-14 pt-2">
        <div className="space-y-4 flex-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="text-muted-foreground hover:text-foreground pl-0 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tickets
          </Button>
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="font-mono text-xs">
                #{ticket.id}
              </Badge>
              <TicketStatusBadge status={ticket.status} label={ticket.status_display} />
              <TicketPriorityBadge priority={ticket.priority} label={ticket.priority_display} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {ticket.subject}
            </h1>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 pt-2 md:pt-0">
             {ticket.status !== 'resolved' && (
               <Button variant="outline" onClick={() => handleStatusChange('resolved')} disabled={isUpdating} className="gap-2">
                 <CheckCircle className="h-4 w-4 text-green-600" />
                 Mark as Resolved
               </Button>
             )}
             {ticket.status === 'resolved' && (
               <Button variant="outline" onClick={() => handleStatusChange('open')} disabled={isUpdating} className="gap-2">
                 <Unlock className="h-4 w-4" />
                 Reopen Ticket
               </Button>
             )}
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start min-h-0 pt-6">
        {/* Main Conversation Column - Scrollable Area */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-0 relative">
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4" ref={scrollRef}>
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="p-0 space-y-8">
                {/* Original Request Card */}
              <div className="bg-card rounded-lg border px-4 py-3 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 border border-background shadow-sm mt-0.5">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {ticket.user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-foreground">{ticket.user_name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                      {ticket.description}
                    </div>
                    
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {ticket.attachments.map(att => (
                          <a 
                            key={att.id} 
                            href={att.file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex items-center gap-1.5 text-xs bg-muted/40 hover:bg-muted border px-2 py-1 rounded transition-colors"
                          >
                            <Paperclip className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                            <span className="font-medium text-foreground/80 group-hover:text-foreground">Attachment</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

                {/* Conversation Divider */}
                {ticket.messages && ticket.messages.length > 0 && (
                   <div className="relative py-4">
                     <div className="absolute inset-0 flex items-center">
                       <span className="w-full border-t border-dashed border-muted-foreground/30" />
                     </div>
                     <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
                       <span className="bg-background px-4 text-muted-foreground">
                         Conversation History
                       </span>
                     </div>
                   </div>
                )}

                {/* Messages List */}
                <div className="space-y-6">
                  {ticket.messages?.map((msg) => {
                    // Skip internal messages for non-admin users
                    if (msg.is_internal && !isAdmin) return null;
                    
                    const isMe = msg.sender === user?.id;
                    const isSupport = msg.sender_role === 'admin';
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "flex gap-4 group",
                          isMe ? "flex-row-reverse" : "flex-row",
                          msg.is_internal ? "opacity-90" : ""
                        )}
                      >
                        <Avatar className={cn(
                          "h-8 w-8 border shadow-sm mt-1",
                          isSupport ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <AvatarImage src={msg.sender_avatar} />
                          <AvatarFallback className={cn(isSupport && "bg-primary text-primary-foreground")}>
                            {msg.sender_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={cn(
                          "flex flex-col max-w-[85%]",
                          isMe ? "items-end" : "items-start"
                        )}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-medium text-foreground/80">
                              {msg.sender_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                            </span>
                            {isSupport && !isMe && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                                Support Team
                              </Badge>
                            )}
                            {msg.is_internal && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal border-amber-200 text-amber-700 bg-amber-50">
                                Internal Note
                              </Badge>
                            )}
                          </div>
                          
                          <div className={cn(
                            "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                            isMe 
                              ? "bg-primary text-primary-foreground rounded-tr-sm" 
                              : msg.is_internal
                                ? "bg-amber-50 border border-amber-100 text-amber-900 rounded-tl-sm"
                                : "bg-card border text-card-foreground rounded-tl-sm"
                          )}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reply Area - Sticky at Bottom of Column */}
          <div className="shrink-0 pt-4 bg-background z-10 sticky bottom-0">
            <Card className="border shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <CardContent className="p-3 space-y-2">
                {isAdmin && (
                   <div className="flex items-center gap-2 px-1">
                     <div className="flex items-center space-x-2">
                       <input 
                         type="checkbox" 
                         id="internal-mode" 
                         checked={isInternal} 
                         onChange={(e) => setIsInternal(e.target.checked)}
                         className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20 accent-primary"
                       />
                       <label htmlFor="internal-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 select-none cursor-pointer">
                         <Lock className="h-3 w-3 text-muted-foreground" />
                         Internal Note <span className="text-xs font-normal text-muted-foreground">(Hidden from user)</span>
                       </label>
                     </div>
                   </div>
                )}
                
                <div className="relative flex items-end gap-2">
                  <Textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isInternal ? "Add an internal note..." : "Type your reply..."}
                    className={cn(
                      "min-h-[44px] max-h-[120px] resize-none py-3 bg-muted/30 focus:bg-background transition-colors flex-1",
                      isInternal && "bg-amber-50/50 focus:bg-amber-50/30 border-amber-200 focus-visible:ring-amber-200"
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                  <Button 
                    size="icon"
                    onClick={handleReply} 
                    disabled={!message.trim() || isReplying}
                    className={cn(
                      "h-11 w-11 shrink-0 rounded-lg shadow-sm transition-all mb-[1px]",
                      (!message.trim() || isReplying) ? "opacity-50" : "hover:scale-105",
                      isInternal ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                    )}
                  >
                    {isReplying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Press <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Enter</kbd> to send, <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Shift + Enter</kbd> for new line
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Info Column - Sticky */}
        <div className="lg:col-span-1 space-y-6 sticky top-[100px]">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/40 py-4 border-b">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <span className="text-sm text-muted-foreground">Requester</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">{ticket.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{ticket.user_name}</span>
                  </div>
                </div>
                
                <div className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm font-medium capitalize">{ticket.category_display}</span>
                </div>
                
                <div className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium font-mono text-xs">
                    {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <div className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <span className="text-sm text-muted-foreground">Last Activity</span>
                  <span className="text-sm font-medium font-mono text-xs">
                    {format(new Date(ticket.updated_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              {ticket.request && (
                <div className="p-4 bg-muted/20 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Related Request</p>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-background hover:bg-muted hover:text-foreground group" onClick={() => navigate(`/request/${ticket.request}`)}>
                    <ExternalLink className="h-3.5 w-3.5 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                    View Request #{ticket.request}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
             <h4 className="font-semibold mb-1 flex items-center gap-2">
               <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700">i</span>
               Support Tip
             </h4>
             <p className="text-blue-800/80 leading-relaxed text-xs">
               Please provide as much detail as possible in your replies to help us resolve your issue faster. You can attach screenshots or documents if needed.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketStatusBadge({ status, label }: { status: string; label: string }) {
  const displayLabel = status === 'open' ? 'Submitted' : label;
  
  const classes: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 border-blue-200",
    in_progress: "bg-amber-100 text-amber-800 border-amber-200",
    resolved: "bg-green-100 text-green-800 border-green-200",
    closed: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Badge variant="outline" className={`border-0 font-normal ${classes[status] || ""}`}>
      {displayLabel}
    </Badge>
  );
}

function TicketPriorityBadge({ priority, label }: { priority: string; label: string }) {
  const classes: Record<string, string> = {
    low: "text-muted-foreground",
    medium: "text-blue-600",
    high: "text-orange-600",
    urgent: "text-red-600",
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("h-2 w-2 rounded-full", 
        priority === 'urgent' ? "bg-red-500" :
        priority === 'high' ? "bg-orange-500" :
        priority === 'medium' ? "bg-blue-500" : "bg-gray-400"
      )} />
      <span className={`text-sm font-medium ${classes[priority] || ""}`}>
        {label} Priority
      </span>
    </div>
  );
}
