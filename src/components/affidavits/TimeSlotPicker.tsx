import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useGetCommissionerSlotsQuery } from '@/store/api/userApi';
import type { CommissionerSlot } from '@/store/api/userApi';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  commissionerId: number;
  onSelectSlot: (slot: CommissionerSlot | null) => void;
  selectedSlot: CommissionerSlot | null;
  actions?: React.ReactNode;
}

export function TimeSlotPicker({ commissionerId, onSelectSlot, selectedSlot, actions }: TimeSlotPickerProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [formattedDate, setFormattedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Update formatted date when date changes
  useEffect(() => {
    if (date) {
      setFormattedDate(format(date, 'yyyy-MM-dd'));
    }
  }, [date]);

  // Fetch slots
  const { data: slots, isLoading, refetch } = useGetCommissionerSlotsQuery({
    commissionerId,
    date: formattedDate,
  }, {
    // Refetch when component mounts or window regains focus to ensure up-to-date slots
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Force refetch when picker opens/closes/date changes
  useEffect(() => {
    refetch();
  }, [date, commissionerId, refetch]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      onSelectSlot(null); // Reset slot when date changes
    }
  };

  const handleSlotClick = (slot: CommissionerSlot) => {
    if (!slot.is_booked) {
      onSelectSlot(slot);
    }
  };

  // Helper for Trinidad time
  const getTrinidadHour = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      // specific format to get 0-23 hour
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Port_of_Spain',
        hour: 'numeric',
        hour12: false
      });
      const hourStr = formatter.format(date);
      // Handle "24" case if specific browser implementation does it, though en-US usually 0-23
      let hour = parseInt(hourStr);
      if (hour === 24) hour = 0;
      return hour;
    } catch (e) {
      return new Date(dateStr).getHours(); // Fallback
    }
  };

  // Group slots by Morning/Afternoon
  // Ensure slots are sorted by time (handling potential backend/frontend mismatches)
  const sortedSlots = slots ? [...slots].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  ) : [];

  const morningSlots = sortedSlots.filter(slot => {
    const hour = getTrinidadHour(slot.start_time);
    return hour < 12;
  });

  const afternoonSlots = sortedSlots.filter(slot => {
    const hour = getTrinidadHour(slot.start_time);
    return hour >= 12;
  });

  const hasSlots = slots && slots.length > 0;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Calendar Section */}
      <div className="flex-shrink-0">
        <div className="mb-2 font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" /> Select Date
        </div>
        <div className="border rounded-md p-1 bg-white dark:bg-black">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today || date > addDays(new Date(), 30);
            }}
            initialFocus
            className="rounded-md"
          />
        </div>
      </div>

      {/* Time Slots Section */}
      <div className="flex-grow min-w-[300px]">
        <div className="mb-2 font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" /> Select Time ({format(date, 'MMM d, yyyy')})
        </div>

        <Card className="h-full max-h-[400px] flex flex-col">
          <CardContent className="p-4 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !hasSlots ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No available slots for this date.</p>
                <p className="text-sm mt-1">Try selecting another day.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Morning Slots */}
                {morningSlots && morningSlots.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Morning</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {morningSlots.map((slot) => (
                        <TimeSlotButton
                          key={slot.id}
                          slot={slot}
                          isSelected={selectedSlot?.id === slot.id}
                          onClick={() => handleSlotClick(slot)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {afternoonSlots && afternoonSlots.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Afternoon</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {afternoonSlots.map((slot) => (
                        <TimeSlotButton
                          key={slot.id}
                          slot={slot}
                          isSelected={selectedSlot?.id === slot.id}
                          onClick={() => handleSlotClick(slot)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          {actions ? (
            <div className="p-4 border-t flex justify-end gap-2">
              {actions}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

interface TimeSlotButtonProps {
  slot: CommissionerSlot;
  isSelected: boolean;
  onClick: () => void;
}

function TimeSlotButton({ slot, isSelected, onClick }: TimeSlotButtonProps) {
  // Format time in Trinidad timezone
  const timeLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Port_of_Spain',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(new Date(slot.start_time));
  
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className={cn(
        "w-full text-sm",
        slot.is_booked && "opacity-50 cursor-not-allowed bg-muted text-muted-foreground decoration-slice line-through"
      )}
      disabled={slot.is_booked}
      onClick={onClick}
    >
      {timeLabel}
    </Button>
  );
}
