import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader, StatusBadge } from '@/components/features';
import { ROUTES } from '@/lib/constants';
import { 
  useGetCommissionerScheduleQuery,
  useAcceptSlotMutation,
  useRejectSlotMutation,
  useCancelSlotMutation,
} from '@/store/api/commissionerApi';
import { Calendar, User, FileText, ArrowRight, Loader2, Check, X, Ban } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

export function CommissionerSchedulePage() {
  const navigate = useNavigate();
  const { data: schedule, isLoading } = useGetCommissionerScheduleQuery();
  const [acceptSlot, { isLoading: isAccepting }] = useAcceptSlotMutation();
  const [rejectSlot, { isLoading: isRejecting }] = useRejectSlotMutation();
  const [cancelSlot, { isLoading: isCancelling }] = useCancelSlotMutation();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'reject' | 'cancel' | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const handleViewRequest = (code: string) => {
    navigate(ROUTES.COMMISSIONER_REQUEST.replace(':code', code));
  };

  const handleAccept = async (slotId: number) => {
    try {
      await acceptSlot(slotId).unwrap();
      toast.success('Appointment accepted! The user has been notified.');
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to accept appointment');
    }
  };

  const openRejectDialog = (slotId: number) => {
    setSelectedSlotId(slotId);
    setDialogAction('reject');
    setReason('');
    setDialogOpen(true);
  };

  const openCancelDialog = (slotId: number) => {
    setSelectedSlotId(slotId);
    setDialogAction('cancel');
    setReason('');
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedSlotId || !dialogAction) return;
    
    try {
      if (dialogAction === 'reject') {
        await rejectSlot({ slot_id: selectedSlotId, reason }).unwrap();
        toast.success('Appointment rejected. The user has been notified to select a new slot.');
      } else {
        await cancelSlot({ slot_id: selectedSlotId, reason }).unwrap();
        toast.success('Appointment cancelled. The user has been notified to reschedule.');
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.error || `Failed to ${dialogAction} appointment`);
    }
  };

  const getAppointmentStatusBadge = (status?: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="default" className="bg-green-500">Accepted</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Response</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled_by_commissioner':
      case 'cancelled_by_user':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Pending Response</Badge>;
    }
  };

  const formatSlotParts = (isoString: string) => {
    const date = new Date(isoString);
    const month = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Port_of_Spain',
      month: 'short',
    }).format(date);
    const day = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Port_of_Spain',
      day: 'numeric',
    }).format(date);
    const dateTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Port_of_Spain',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
    return { month, day, dateTime };
  };

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="My Schedule"
        description="View your upcoming appointments and booked slots"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
          <CardDescription>
            Clients who have booked a time slot with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !Array.isArray(schedule) || schedule.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No upcoming appointments</p>
              <p className="text-sm mt-1">
                Booked slots will appear here when clients schedule time with you
              </p>
            </div>
          ) : (() => {
            // Filter out completed requests and rejected/cancelled appointments
            const visibleSlots = [...schedule]
              .filter((s) => {
                const apptStatus = s.appointment_status;
                const reqStatus = s.request_details?.status?.toUpperCase();
                // Remove rejected / cancelled slots
                if (['rejected', 'cancelled_by_commissioner', 'cancelled_by_user'].includes(apptStatus ?? '')) return false;
                // Remove completed requests
                if (reqStatus === 'COMPLETED') return false;
                return true;
              })
              .sort((a, b) => b.id - a.id);

            if (visibleSlots.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No upcoming appointments</p>
                  <p className="text-sm mt-1">
                    Completed and declined appointments are automatically removed
                  </p>
                </div>
              );
            }

            return (
            <div className="space-y-4">
              {visibleSlots.map((slot) => {
                const { month, day, dateTime } = formatSlotParts(slot.start_time);
                return (
                <div
                  key={slot.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center min-w-[3rem]">
                      <span className="text-xs font-medium text-primary uppercase">
                        {month}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {day}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-lg">
                          {dateTime} <span className="text-sm text-muted-foreground">(TT)</span>
                        </p>
                        {slot.request_details && (
                          <StatusBadge status={slot.request_details.status} size="sm" />
                        )}
                        {getAppointmentStatusBadge(slot.appointment_status)}
                      </div>
                      
                      {slot.request_details ? (
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {slot.request_details.client_name}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            {slot.request_details.affidavit_type}
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                              {slot.request_details.request_code}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Slot booked but request details unavailable
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {/* Accept/Reject buttons for pending appointments */}
                    {slot.appointment_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(slot.id)}
                          disabled={isAccepting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(slot.id)}
                          disabled={isRejecting}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {/* Cancel button for accepted appointments */}
                    {slot.appointment_status === 'accepted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCancelDialog(slot.id)}
                        disabled={isCancelling}
                        className="text-destructive border-destructive hover:bg-destructive/10"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    
                    {/* View Request button */}
                    {slot.request_details && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewRequest(slot.request_details!.request_code)}
                      >
                        View Request
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Reject/Cancel Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === 'reject' ? 'Reject Appointment' : 'Cancel Appointment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === 'reject' 
                ? 'Are you sure you want to reject this appointment? The user will be notified to select a new time slot.'
                : 'Are you sure you want to cancel this appointment? The user will be notified to reschedule.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a reason for the user..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={dialogAction === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {dialogAction === 'reject' ? 'Reject Appointment' : 'Cancel Appointment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
