import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface AvailabilitySchedulerProps {
  value: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
  readOnly?: boolean;
  compact?: boolean;
}

const DAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
] as const;

// Helper to format time for display
const formatTime = (time: string): string => {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr);
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minute} ${ampm}`;
};

export const defaultSchedule: WeeklySchedule = {
  monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

export const emptySchedule: WeeklySchedule = {
  monday: { enabled: false, slots: [] },
  tuesday: { enabled: false, slots: [] },
  wednesday: { enabled: false, slots: [] },
  thursday: { enabled: false, slots: [] },
  friday: { enabled: false, slots: [] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

// Convert API format to component format
export function parseAvailability(apiData: Record<string, unknown>): WeeklySchedule {
  const schedule = { ...emptySchedule };
  
  if (!apiData || typeof apiData !== 'object') return schedule;
  
  const recurring = apiData.recurring as Record<string, TimeSlot[]> | undefined;
  if (recurring && typeof recurring === 'object') {
    DAYS.forEach(({ key }) => {
      const daySlots = recurring[key];
      if (Array.isArray(daySlots) && daySlots.length > 0) {
        schedule[key] = {
          enabled: true,
          slots: daySlots.map(slot => ({
            start: slot.start || '09:00',
            end: slot.end || '17:00',
          })),
        };
      }
    });
  }
  
  return schedule;
}

// Convert component format to API format
export function formatAvailability(schedule: WeeklySchedule): Record<string, unknown> {
  const recurring: Record<string, TimeSlot[]> = {};
  
  DAYS.forEach(({ key }) => {
    const daySchedule = schedule[key];
    if (daySchedule.enabled && daySchedule.slots.length > 0) {
      recurring[key] = daySchedule.slots;
    }
  });
  
  return {
    recurring,
    timezone: 'America/Port_of_Spain',
  };
}

export function AvailabilityScheduler({ 
  value, 
  onChange, 
  readOnly = false,
  compact = false 
}: AvailabilitySchedulerProps) {
  const updateDay = (day: keyof WeeklySchedule, updates: Partial<DaySchedule>) => {
    if (readOnly) return;
    onChange({
      ...value,
      [day]: { ...value[day], ...updates },
    });
  };

  const toggleDay = (day: keyof WeeklySchedule) => {
    if (readOnly) return;
    const currentDay = value[day];
    updateDay(day, {
      enabled: !currentDay.enabled,
      slots: !currentDay.enabled && currentDay.slots.length === 0 
        ? [{ start: '09:00', end: '17:00' }] 
        : currentDay.slots,
    });
  };

  const addSlot = (day: keyof WeeklySchedule) => {
    if (readOnly) return;
    const currentDay = value[day];
    const lastSlot = currentDay.slots[currentDay.slots.length - 1];
    const newStart = lastSlot ? lastSlot.end : '09:00';
    const newEnd = lastSlot 
      ? (lastSlot.end < '18:00' ? '18:00' : '20:00')
      : '17:00';
    
    updateDay(day, {
      slots: [...currentDay.slots, { start: newStart, end: newEnd }],
    });
  };

  const removeSlot = (day: keyof WeeklySchedule, index: number) => {
    if (readOnly) return;
    const currentDay = value[day];
    const newSlots = currentDay.slots.filter((_, i) => i !== index);
    updateDay(day, {
      slots: newSlots,
      enabled: newSlots.length > 0,
    });
  };

  const updateSlot = (day: keyof WeeklySchedule, index: number, field: 'start' | 'end', time: string) => {
    if (readOnly) return;
    const currentDay = value[day];
    const newSlots = currentDay.slots.map((slot, i) => 
      i === index ? { ...slot, [field]: time } : slot
    );
    updateDay(day, { slots: newSlots });
  };

  // Read-only compact view
  if (readOnly && compact) {
    const activeDays = DAYS.filter(({ key }) => value[key].enabled);
    
    if (activeDays.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">No availability set</p>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {activeDays.map(({ key, short }) => (
          <Badge key={key} variant="secondary" className="text-xs">
            {short}
          </Badge>
        ))}
      </div>
    );
  }

  // Read-only full view
  if (readOnly) {
    const activeDays = DAYS.filter(({ key }) => value[key].enabled);
    
    if (activeDays.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No availability schedule set</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {activeDays.map(({ key, label }) => (
          <div key={key} className="flex items-start gap-4 py-2 border-b last:border-0">
            <div className="w-28 font-medium text-sm">{label}</div>
            <div className="flex-1 flex flex-wrap gap-2">
              {value[key].slots.map((slot, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Editable view
  return (
    <div className="space-y-3">
      {DAYS.map(({ key, label }) => {
        const daySchedule = value[key];
        
        return (
          <Card key={key} className={cn(!daySchedule.enabled && 'opacity-60')}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={daySchedule.enabled}
                  onCheckedChange={() => toggleDay(key)}
                />
                <Label className="w-24 font-medium text-sm cursor-pointer" onClick={() => toggleDay(key)}>
                  {label}
                </Label>
                
                {daySchedule.enabled && (
                  <div className="flex-1 space-y-2">
                    {daySchedule.slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateSlot(key, idx, 'start', e.target.value)}
                          className="w-32 h-8 text-xs"
                        />
                        
                        <span className="text-muted-foreground text-xs">to</span>
                        
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateSlot(key, idx, 'end', e.target.value)}
                          className="w-32 h-8 text-xs"
                        />
                        
                        {daySchedule.slots.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeSlot(key, idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => addSlot(key)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add time slot
                    </Button>
                  </div>
                )}
                
                {!daySchedule.enabled && (
                  <span className="text-muted-foreground text-sm">Not available</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
