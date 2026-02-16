import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { toast } from 'sonner';
import type { AvailabilitySchedule } from '@/types';
import {
  useGetPublicCommissionersQuery,
  useSelectCommissionerMutation,
  useGetRequestQuery,
  useBookSlotMutation,
  useSubmitRequestMutation,
  type PublicCommissioner,
  type CommissionerSlot,
} from '@/store/api/userApi';
import { ROUTES } from '@/lib/constants';
import { TimeSlotPicker } from '@/components/affidavits/TimeSlotPicker';
import {
  ArrowLeft,
  User,
  Building2,
  MapPin,
  Clock,
  CheckCircle,
  Loader2,
  Calendar,
  AlertCircle,
  Search,
} from 'lucide-react';

export function SelectCommissionerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [commissionerToSelect, setCommissionerToSelect] = useState<PublicCommissioner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Slot selection state
  const [selectedSlot, setSelectedSlot] = useState<CommissionerSlot | null>(null);
  const [isSlotPickerOpen, setIsSlotPickerOpen] = useState(false);
  const [bookSlot, { isLoading: isBooking }] = useBookSlotMutation();
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitRequestMutation();
  const [showSubmissionConfirm, setShowSubmissionConfirm] = useState(false);

  const { data: request, isLoading: isLoadingRequest } = useGetRequestQuery(Number(id), {
    skip: !id,
  });
  
  const { data: commissioners, isLoading: isLoadingCommissioners } = useGetPublicCommissionersQuery();
  const [selectCommissioner, { isLoading: isSelecting }] = useSelectCommissionerMutation();

  const filteredCommissioners = commissioners?.filter(commissioner => 
    commissioner.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    commissioner.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    commissioner.commission_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prevent browser back button if commissioner already selected
  useEffect(() => {
    if (request?.commissioner) {
      // Prevent back navigation
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        toast.info('Commissioner Already Selected', {
          description: 'You have already selected a commissioner. Use the withdraw option to change.',
        });
      };

      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [request]);

  const openConfirmDialog = (commissioner: PublicCommissioner) => {
    setCommissionerToSelect(commissioner);
    // setConfirmDialogOpen(true); // OLD: Direct confirm
    setIsSlotPickerOpen(true); // NEW: Open slot picker first
  };

  const handleBookAppointment = async () => {
    if (!id || !commissionerToSelect || !selectedSlot) return;

    try {
      await bookSlot({ slotId: selectedSlot.id, requestId: Number(id) }).unwrap();
      
      toast.success('Appointment Confirmed', {
        description: `Booked with ${commissionerToSelect.full_name} for ${new Date(selectedSlot.start_time).toLocaleString()}.`,
      });
      
      setIsSlotPickerOpen(false);
      // Instead of navigating, show submission confirmation
      setShowSubmissionConfirm(true);
    } catch (error) {
      toast.error('Booking Failed', {
        description: 'Could not book this slot. It may have just been taken.',
      });
    }
  };

  // Check status and redirect if locked
  useEffect(() => {
    if (request) {
        if (request.status === 'approved' || request.status === 'completed') {
            toast.info('Selection Locked', {
                description: 'Commissioner selection cannot be changed after approval.',
            });
            navigate(ROUTES.REQUEST_STATUS.replace(':id', id || ''));
        }
    }
  }, [request, navigate, id]);

  const handleSubmissionConfirm = async () => {
    if (!id || !request) return;
    
    // If already in review (re-booking), just navigate back
    if (request.status === 'needs_review') {
        toast.success('Appointment Updated', {
            description: 'Your appointment has been rescheduled.',
        });
        navigate(ROUTES.REQUEST_STATUS.replace(':id', id));
        return;
    }

    // If Draft Ready, submit to move to Needs Review
    try {
        await submitRequest(Number(id)).unwrap();
        toast.success('Affidavit Submitted', {
            description: 'Your request is now in review.',
        });
        navigate(ROUTES.REQUEST_STATUS.replace(':id', id));
    } catch (error) {
        toast.error('Submission Failed', {
            description: 'Please try again.',
        });
    }
  };

  // Legacy selection without slot (fallback)
  const handleConfirmSelect = async () => {
    if (!id || !commissionerToSelect) return;
    
    setSelectedId(commissionerToSelect.id);
    setConfirmDialogOpen(false);

    try {
      await selectCommissioner({ id: Number(id), commissioner_id: commissionerToSelect.id }).unwrap();
      toast.success('Commissioner Selected', {
        description: `${commissionerToSelect.full_name} has been assigned to your request.`,
      });
      navigate(ROUTES.REQUEST_STATUS.replace(':id', id));
    } catch {
      toast.error('Error', {
        description: 'Failed to select commissioner. Please try again.',
      });
      setSelectedId(null);
    }
  };

  const handleWithdraw = async () => {
    if (!id) return;

    try {
      await selectCommissioner({ id: Number(id), commissioner_id: 0 }).unwrap();
      toast.success('Commissioner Withdrawn', {
        description: 'You can now select a different commissioner.',
      });
      // Stay on same page to allow re-selection
    } catch {
      toast.error('Error', {
        description: 'Failed to withdraw commissioner selection.',
      });
    }
  };

  if (isLoadingRequest || isLoadingCommissioners) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Format availability for display
  const formatAvailability = (availability?: Record<string, unknown>) => {
    if (!availability || !availability.recurring) {
      return { summary: 'Availability not set', days: [] };
    }

    const recurring = availability.recurring as AvailabilitySchedule['recurring'];
    const dayNames: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    };

    const availableDays = Object.entries(recurring || {}).filter(([, slots]) => slots && slots.length > 0);

    if (availableDays.length === 0) {
      return { summary: 'No availability set', days: [] };
    }

    // Create summary
    const dayAbbreviations = availableDays.map(([day]) => dayNames[day]);
    const summary = dayAbbreviations.join(', ');

    return {
      summary,
      days: availableDays.map(([day, slots]) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        slots: slots || [],
      })),
    };
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Check if commissioner already selected
  const hasSelectedCommissioner = !!request?.commissioner;

  return (
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(ROUTES.REQUEST_STATUS.replace(':id', id || ''))}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Request
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {hasSelectedCommissioner ? 'Commissioner Selected' : 'Select a Commissioner'}
          </h1>
          <p className="text-muted-foreground">
            {hasSelectedCommissioner 
              ? 'You have selected a commissioner. You can withdraw and select another if needed.'
              : 'Choose a commissioner to visit in person to finalize your affidavit.'}
          </p>
          {request && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{request.affidavit_type.name}</p>
                  <p className="text-sm text-muted-foreground">Request Code: {request.request_code}</p>
                </div>
              </div>
            </div>
          )}
          {hasSelectedCommissioner && request.commissioner && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Selected Commissioner</p>
                    <p className="text-sm text-muted-foreground">{request.commissioner.first_name} {request.commissioner.last_name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWithdraw}
                >
                  Withdraw Selection
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {!hasSelectedCommissioner && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, organization, or number..." 
              className="pl-9 max-w-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Commissioners List */}
      {hasSelectedCommissioner ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Commissioner Selected</h3>
            <p className="text-muted-foreground mb-4">
              You have already selected a commissioner for this request.
            </p>
            <p className="text-sm text-muted-foreground">
              Use the "Withdraw Selection" button above to choose a different commissioner.
            </p>
          </CardContent>
        </Card>
      ) : !commissioners || commissioners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Commissioners Available</h3>
            <p className="text-muted-foreground">
              There are no commissioners available at this time. Please check back later.
            </p>
          </CardContent>
        </Card>
      ) : filteredCommissioners?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Commissioners Found</h3>
            <p className="text-muted-foreground">
              We couldn't find any commissioners matching "{searchQuery}".
            </p>
            <Button variant="link" onClick={() => setSearchQuery('')}>Clear Search</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommissioners!.map((commissioner) => {
            const availability = formatAvailability(commissioner.availability);
            const isSelected = selectedId === commissioner.id;

            return (
              <Card 
                key={commissioner.id}
                className={`hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => !isSelecting && openConfirmDialog(commissioner)}
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/5 z-0" />
                )}
                
                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-start gap-3">
                    {commissioner.profile_image_url ? (
                      <img 
                        src={commissioner.profile_image_url}
                        alt={commissioner.full_name}
                        className="h-12 w-12 rounded-full object-cover border border-primary/20"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight mb-1 truncate">{commissioner.full_name}</CardTitle>
                      {commissioner.commission_number && (
                        <CardDescription className="text-xs truncate">
                          #{commissioner.commission_number}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 relative z-10 pt-0">
                  {/* Organization */}
                  {commissioner.organization && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {commissioner.organization}
                      </span>
                    </div>
                  )}

                  {/* Availability */}
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">{availability.summary}</p>
                      {availability.days.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs hover:bg-primary/10"
                            >
                              View
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Availability Schedule</h4>
                                <p className="text-xs text-muted-foreground">
                                  {commissioner.full_name}'s working hours
                                </p>
                              </div>
                              <Separator />
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {availability.days.map(({ day, slots }) => (
                                  <div key={day} className="flex justify-between items-start gap-2">
                                    <span className="text-sm font-medium min-w-20">{day}</span>
                                    <div className="flex-1 text-right space-y-1">
                                      {slots.map((slot, idx) => (
                                        <div key={idx} className="text-sm text-muted-foreground">
                                          {formatTime(slot.start)} - {formatTime(slot.end)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {commissioner.organization || 'Port of Spain'}
                    </span>
                  </div>

                  {/* Wait Time */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      15-30 min wait
                    </span>
                  </div>

                  <Separator className="my-3" />

                  {/* Action Button */}
                  <Button 
                    size="sm"
                    className="w-full text-xs h-8"
                    disabled={isSelecting}
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirmDialog(commissioner);
                    }}
                  >
                    {isSelecting && isSelected ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Selecting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Select
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardContent className="py-6">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Visit the commissioner's office during their working hours</li>
                <li>• Bring your verification code: <code className="font-mono font-bold text-foreground">{request?.request_code}</code></li>
                <li>• Bring a valid ID for verification</li>
                <li>• The commissioner will review and sign your affidavit</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slot Selection Dialog */}
      <AlertDialog open={isSlotPickerOpen} onOpenChange={setIsSlotPickerOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Select a time to meet with <strong>{commissionerToSelect?.full_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            {commissionerToSelect && (
              <TimeSlotPicker 
                commissionerId={commissionerToSelect.id}
                onSelectSlot={setSelectedSlot}
                selectedSlot={selectedSlot}
                actions={
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedSlot(null);
                        setIsSlotPickerOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!selectedSlot || isBooking}
                      onClick={handleBookAppointment}
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        'Confirm Appointment'
                      )}
                    </Button>
                  </>
                }
              />
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog (Legacy/Fallback) */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Commissioner Selection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to select <strong>{commissionerToSelect?.full_name}</strong> as your commissioner?
              <br /><br />
              You will need to visit their office to finalize your affidavit. You can withdraw this selection later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSelect}>
              Confirm Selection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submission Confirmation Dialog */}
      <AlertDialog open={showSubmissionConfirm} onOpenChange={setShowSubmissionConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Your appointment is booked. Please confirm to submit your affidavit for review.
              <br /><br />
              Once approved, you will be able to download your document and proceed to your appointment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSubmissionConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
