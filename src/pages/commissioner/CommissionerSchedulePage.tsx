import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader, StatusBadge } from '@/components/features';
import { ROUTES } from '@/lib/constants';
import { useGetCommissionerScheduleQuery } from '@/store/api/commissionerApi';
import { Calendar, User, FileText, ArrowRight, Loader2 } from 'lucide-react';

export function CommissionerSchedulePage() {
  const navigate = useNavigate();
  const { data: schedule, isLoading } = useGetCommissionerScheduleQuery();

  const handleViewRequest = (code: string) => {
    navigate(ROUTES.COMMISSIONER_REQUEST.replace(':code', code));
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
          ) : (
            <div className="space-y-4">
              {schedule.map((slot) => {
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-lg">
                          {dateTime} <span className="text-sm text-muted-foreground">(TT)</span>
                        </p>
                        {slot.request_details && (
                          <StatusBadge status={slot.request_details.status} size="sm" />
                        )}
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

                  {slot.request_details && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewRequest(slot.request_details!.request_code)}
                      className="sm:w-auto w-full"
                    >
                      View Request
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
