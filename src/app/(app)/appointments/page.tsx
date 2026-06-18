'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import { CalendarEvent, CalendarView } from '@/components/Calendar/types';
import {
  useAppointments,
  useDateRangeAvailability,
} from '@/hooks/use-appointments';
import { useCatalogList } from '@/hooks/use-catalog';
import { transformAppointmentsToCalendarEvents } from '@/lib/utils/appointmentUtils';
import {
  endOfDay,
  endOfWeek,
  endOfMonth,
  startOfDay,
  startOfWeek,
  startOfMonth,
  format,
} from 'date-fns';
import {
  Loader2,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  AlertTriangleIcon,
  TriangleAlertIcon,
  ChevronDownIcon,
  ArrowLeft,
  RefreshCwIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Appointment } from '@/lib/types/appointment';
import { capitalizeFirst, getRelativeDate } from '@/lib/utils/string';
import {
  useSyncAppointment,
  useSyncFromSquare,
} from '@/hooks/use-appointments';
import { CreateClientDialog } from '@/components/CreateClientDialog';
import { LinkClientDialog } from '@/components/LinkClientDialog';
import { AppointmentDialog } from '@/components/AppointmentDialog';
import { CancelAppointmentDialog } from '@/components/CancelAppointmentDialog';
import Link from 'next/link';
import clsx from 'clsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStaff } from '@/hooks/use-staff';
import { useCurrentUser } from '@/hooks/use-current-user';

const STAFF_COLORS = [
  '#7c3aed',
  '#2563eb',
  '#059669',
  '#d97706',
  '#db2777',
  '#0891b2',
  '#65a30d',
  '#dc2626',
  '#9333ea',
  '#0d9488',
];
const UNASSIGNED_COLOR = '#6B7280';

type DisplayMode = 'calendar' | 'list';

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('week');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar');
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [viewingAppointmentFromDate, setViewingAppointmentFromDate] =
    useState(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] =
    useState(false);
  const [isLinkClientDialogOpen, setIsLinkClientDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
  const syncAppointment = useSyncAppointment();
  const syncFromSquare = useSyncFromSquare();
  const today = useMemo(() => new Date(), []);

  const { data: currentUser } = useCurrentUser();
  const { data: staffData } = useStaff({ pageSize: 100 });

  const isOwner = useMemo(() => {
    return currentUser?.role === 'owner';
  }, [currentUser]);

  const staffWithSquareId = useMemo(() => {
    if (!staffData?.data) return [];
    return staffData.data.filter((staff) => staff.squareId);
  }, [staffData]);

  const currentUserStaff = useMemo(() => {
    if (!currentUser?.email || !staffWithSquareId.length) return null;
    return staffWithSquareId.find(
      (staff) => staff.email?.toLowerCase() === currentUser.email.toLowerCase(),
    );
  }, [currentUser, staffWithSquareId]);

  const defaultStaffId = useMemo(() => {
    if (!currentUser) return 'all';
    if (isOwner) return 'all';
    return currentUserStaff?.squareId || 'all';
  }, [currentUser, isOwner, currentUserStaff]);

  const [selectedStaffId, setSelectedStaffId] =
    useState<string>(defaultStaffId);

  // Update selectedStaffId when defaultStaffId changes
  useEffect(() => {
    setSelectedStaffId(defaultStaffId);
  }, [defaultStaffId]);

  const allStaffSquareIds = useMemo(() => {
    // If not owner, only include the current user's squareId
    if (!isOwner && currentUserStaff?.squareId) {
      return [currentUserStaff.squareId];
    }

    // Owners can see all staff
    return staffWithSquareId
      .map((staff) => staff.squareId)
      .filter((id): id is string => !!id);
  }, [staffWithSquareId, isOwner, currentUserStaff]);

  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date;

    switch (currentView) {
      case 'day':
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
        break;
      case 'week':
        start = startOfWeek(currentDate, { weekStartsOn: 0 });
        end = endOfWeek(currentDate, { weekStartsOn: 0 });
        break;
      case 'month':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      default:
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
    }

    return {
      startAtMin: start.toISOString(),
      startAtMax: end.toISOString(),
    };
  }, [currentDate, currentView]);

  const rangeLabel = useMemo(() => {
    if (currentView === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (currentView === 'month') return format(currentDate, 'MMMM yyyy');
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }, [currentDate, currentView]);

  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useAppointments({
    limit: 100,
    startAtMin: dateRange.startAtMin,
    startAtMax: dateRange.startAtMax,
  });

  // Stable color per staff member (by id), used to tint appointment blocks.
  const staffColorMap = useMemo(() => {
    const map = new Map<number, string>();
    (staffData?.data ?? []).forEach((staff, index) => {
      map.set(staff.id, STAFF_COLORS[index % STAFF_COLORS.length]);
    });
    return map;
  }, [staffData]);

  const getStaffColor = useCallback(
    (staffId?: number | null) => {
      if (staffId == null) return UNASSIGNED_COLOR;
      return staffColorMap.get(staffId) ?? UNASSIGNED_COLOR;
    },
    [staffColorMap],
  );

  const staffNameById = useCallback(
    (staffId?: number | null) => {
      if (staffId == null) return 'Unassigned';
      const staff = staffData?.data?.find((s) => s.id === staffId);
      return staff ? `${staff.firstName} ${staff.lastName}` : 'Unassigned';
    },
    [staffData],
  );

  // Appointments narrowed to the selected staff member (or all).
  const filteredAppointments = useMemo(() => {
    const list = appointments || [];
    if (selectedStaffId === 'all') return list;
    const staffMember = staffWithSquareId.find(
      (s) => s.squareId === selectedStaffId,
    );
    return staffMember
      ? list.filter((apt) => apt.staffId === staffMember.id)
      : list;
  }, [appointments, selectedStaffId, staffWithSquareId]);

  const events = useMemo(
    () =>
      transformAppointmentsToCalendarEvents(filteredAppointments, (apt) =>
        getStaffColor(apt.staffId),
      ),
    [filteredAppointments, getStaffColor],
  );

  // Active (non-cancelled) appointments sorted chronologically for list view.
  const listAppointments = useMemo(
    () =>
      [...filteredAppointments]
        .filter(
          (a) =>
            a.startAt &&
            a.status !== 'CANCELLED_BY_CUSTOMER' &&
            a.status !== 'CANCELLED_BY_SELLER',
        )
        .sort(
          (a, b) =>
            new Date(a.startAt || '').getTime() -
            new Date(b.startAt || '').getTime(),
        ),
    [filteredAppointments],
  );

  // Which staff appear in the current view, for the color legend.
  const legendStaff = useMemo(() => {
    const ids = new Set(
      filteredAppointments
        .map((a) => a.staffId)
        .filter((id): id is number => id != null),
    );
    return (staffData?.data ?? []).filter((s) => ids.has(s.id));
  }, [filteredAppointments, staffData]);

  const { data: catalogItems } = useCatalogList();

  const serviceVariationIds = useMemo(() => {
    if (!catalogItems) return [];
    return catalogItems
      .filter((item) => item.type === 'ITEM')
      .flatMap((item) => {
        return item.itemData?.variations || [];
      })
      .filter(
        (item) =>
          item.type === 'ITEM_VARIATION' &&
          item.itemVariationData?.availableForBooking,
      )
      .map((variation) => variation.id)
      .filter((id): id is string => !!id);
  }, [catalogItems]);

  const { data: allAvailableSlots = [] } = useDateRangeAvailability(
    serviceVariationIds.length > 0 && allStaffSquareIds.length > 0
      ? {
          startDate: `${today.toISOString().split('T')[0]}T00:00:00.00Z`,
          endDate: `${dateRange.startAtMax.split('T')[0]}T23:59:00.00Z`,
          teamMemberIds: allStaffSquareIds,
          serviceVariationIds,
        }
      : null,
  );

  const availableSlots = useMemo(() => {
    if (!allAvailableSlots) return [];

    // If "All" is selected, return all slots
    if (selectedStaffId === 'all') {
      return allAvailableSlots.map((slot) => slot.startAt);
    }

    // Filter by selected staff member
    if (!selectedStaffId) return [];

    return allAvailableSlots
      .filter((slot) => {
        const hasMatchingTeamMember = slot.appointmentSegments?.some(
          (segment) => segment.teamMemberId === selectedStaffId,
        );
        return hasMatchingTeamMember;
      })
      .map((slot) => slot.startAt);
  }, [allAvailableSlots, selectedStaffId]);

  const formatDateTime = (
    startAt: string,
    endAt?: string,
  ): { date: string; time: string } => {
    const startDate = new Date(startAt);

    const relativeDate = getRelativeDate(startAt);

    const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');

    let dateFormatted: string;
    if (relativeDate === 'Today') {
      dateFormatted = 'Today';
    } else {
      dateFormatted = `${relativeDate}, ${formattedDate}`;
    }

    const startTimeFormatted = format(startDate, 'h:mm a');

    if (endAt) {
      const endDate = new Date(endAt);
      const endTimeFormatted = format(endDate, 'h:mm a');
      return {
        date: dateFormatted,
        time: `${startTimeFormatted} - ${endTimeFormatted}`,
      };
    }

    return { date: dateFormatted, time: startTimeFormatted };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'DECLINED':
        return 'bg-red-100 text-red-700';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Find the appointment that matches the event
    const appointment = appointments?.find((apt) => apt.id === event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsDialogOpen(true);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(new Date(date));
    setIsDateDialogOpen(true);
  };

  const getAppointmentsForDate = (date: Date) => {
    if (!appointments) return [];
    const tzDate = new Date(date);
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.startAt || '');
      return appointmentDate.toDateString() === tzDate.toDateString();
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEventCreate = (_eventData: Partial<CalendarEvent>) => {
    console.log('Create event functionality not implemented for appointments');
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSyncFromSquare = useCallback(async () => {
    await syncFromSquare.mutateAsync(dateRange);
  }, [syncFromSquare, dateRange]);

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(new Date(date));
  }, []);

  const handleViewChange = useCallback((view: CalendarView) => {
    setCurrentView(view);
  }, []);

  // Shift the current date by one unit of the active view (for list-mode nav).
  const shiftDate = useCallback(
    (direction: 1 | -1) => {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        if (currentView === 'day') next.setDate(next.getDate() + direction);
        else if (currentView === 'week')
          next.setDate(next.getDate() + 7 * direction);
        else next.setMonth(next.getMonth() + direction);
        return next;
      });
    },
    [currentView],
  );

  const handleTimeSlotClick = useCallback((dateTime: Date) => {
    setSelectedTimeSlot(new Date(dateTime));
    setIsBookingDialogOpen(true);
  }, []);

  const handleCreateClient = () => {
    setIsCreateClientDialogOpen(true);
  };

  const handleLinkClient = () => {
    setIsLinkClientDialogOpen(true);
  };

  const handleClientCreated = async (accountId: number) => {
    if (!selectedAppointment?.id) return;

    try {
      await syncAppointment.mutateAsync({
        id: selectedAppointment.id,
        accountId,
      });

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error syncing appointment:', error);
    }
  };

  const handleClientLinked = async (accountId: number) => {
    if (!selectedAppointment?.id) return;

    try {
      await syncAppointment.mutateAsync({
        id: selectedAppointment.id,
        accountId,
        customerId: selectedAppointment.customerId,
      });

      setIsLinkClientDialogOpen(false);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error linking appointment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className='p-6 h-screen'>
        <div className='flex items-center justify-center h-[calc(100vh-120px)]'>
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='w-6 h-6 animate-spin text-purple' />
            <span className='ml-2 text-neutral-600 text-sm'>
              Loading appointments...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6 h-screen'>
        <div className='flex flex-col items-center justify-center h-[calc(100vh-120px)]'>
          <div className='text-lg text-red-600 mb-4'>
            Error: {error.message}
          </div>
          <button
            onClick={handleRefresh}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const syncButton = (
    <Button
      variant='outline'
      size='sm'
      onClick={handleSyncFromSquare}
      disabled={syncFromSquare.isPending}
      className='h-9 text-sm'
    >
      <RefreshCwIcon
        className={clsx('w-4 h-4 mr-1', {
          'animate-spin': syncFromSquare.isPending,
        })}
      />
      {syncFromSquare.isPending ? 'Syncing...' : 'Sync with Square'}
    </Button>
  );

  const staffSelector =
    isOwner && staffWithSquareId.length > 0 ? (
      <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
        <SelectTrigger className='h-10 data-[size=default]:h-9'>
          <SelectValue placeholder='Select staff member' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all' className='h-10'>
            All Staff
          </SelectItem>
          {staffWithSquareId.map((staff) => (
            <SelectItem className='h-10' key={staff.id} value={staff.squareId!}>
              {staff.firstName} {staff.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  const viewToggle = (
    <div className='flex items-center rounded-md border border-neutral-200 p-0.5'>
      <button
        onClick={() => setDisplayMode('calendar')}
        className={clsx(
          'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium transition-colors',
          displayMode === 'calendar'
            ? 'bg-purple text-white'
            : 'text-neutral-600 hover:text-neutral-900',
        )}
      >
        <CalendarIcon className='w-4 h-4' />
        Calendar
      </button>
      <button
        onClick={() => setDisplayMode('list')}
        className={clsx(
          'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium transition-colors',
          displayMode === 'list'
            ? 'bg-purple text-white'
            : 'text-neutral-600 hover:text-neutral-900',
        )}
      >
        <ListIcon className='w-4 h-4' />
        List
      </button>
    </div>
  );

  const legend =
    legendStaff.length > 0 ? (
      <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1'>
        {legendStaff.map((staff) => (
          <div key={staff.id} className='flex items-center gap-1.5'>
            <span
              className='inline-block w-3 h-3 rounded-full'
              style={{ backgroundColor: getStaffColor(staff.id) }}
            />
            <span className='text-xs text-neutral-600'>
              {staff.firstName} {staff.lastName}
            </span>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <>
      <div className='h-screen'>
        {displayMode === 'calendar' ? (
          <div className='h-[calc(100vh-120px)] pt-2 flex flex-col gap-2'>
            {legend}
            <div className='flex-1 min-h-0'>
              <Calendar
                events={events}
                view={currentView}
                currentDate={currentDate}
                availableSlots={availableSlots}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onEventCreate={handleEventCreate}
                onTimeSlotClick={handleTimeSlotClick}
                onDateChange={handleDateChange}
                onViewChange={handleViewChange}
                headerActions={
                  <div className='flex items-center gap-2 mr-4'>
                    {viewToggle}
                    {syncButton}
                    {staffSelector}
                  </div>
                }
              />
            </div>
          </div>
        ) : (
          <div className='h-[calc(100vh-120px)] pt-2 flex flex-col gap-3'>
            <div className='flex items-center justify-between gap-3 flex-wrap'>
              <div className='flex items-center gap-2 flex-wrap'>
                {viewToggle}
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-9 w-9 p-0'
                    onClick={() => shiftDate(-1)}
                  >
                    <ChevronLeft className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-9'
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-9 w-9 p-0'
                    onClick={() => shiftDate(1)}
                  >
                    <ChevronRight className='w-4 h-4' />
                  </Button>
                </div>
                <Select
                  value={currentView}
                  onValueChange={(v: CalendarView) => setCurrentView(v)}
                >
                  <SelectTrigger className='h-9 w-[110px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='day'>Day</SelectItem>
                    <SelectItem value='week'>Week</SelectItem>
                    <SelectItem value='month'>Month</SelectItem>
                  </SelectContent>
                </Select>
                <span className='text-sm font-medium text-neutral-700'>
                  {rangeLabel}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                {syncButton}
                {staffSelector}
              </div>
            </div>

            {legend}

            <div className='flex-1 min-h-0 overflow-y-auto'>
              {listAppointments.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-full text-neutral-500'>
                  <CalendarIcon className='w-6 h-6 mb-3' />
                  <p className='text-sm'>No appointments in this period</p>
                </div>
              ) : (
                <div className='flex flex-col gap-2'>
                  {listAppointments.map((appointment) => {
                    const { date, time } = formatDateTime(
                      appointment.startAt || '',
                      appointment.endAt,
                    );
                    return (
                      <button
                        key={appointment.id}
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setIsDialogOpen(true);
                        }}
                        className='flex items-center gap-3 text-left border rounded-lg p-3 hover:bg-neutral-50 transition-colors'
                        style={{
                          borderLeftColor: getStaffColor(appointment.staffId),
                          borderLeftWidth: 4,
                        }}
                      >
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-neutral-900 truncate'>
                              {appointment.service || 'Appointment'}
                            </span>
                            {!appointment.accountId && (
                              <AlertTriangleIcon className='w-4 h-4 text-amber-600 shrink-0' />
                            )}
                            {appointment.status && (
                              <Badge
                                variant='secondary'
                                className={clsx(
                                  getStatusColor(appointment.status),
                                  'text-xs',
                                )}
                              >
                                {capitalizeFirst(appointment.status)}
                              </Badge>
                            )}
                          </div>
                          <div className='flex items-center gap-4 text-sm text-neutral-600 mt-1 flex-wrap'>
                            <span className='flex items-center gap-1'>
                              <CalendarIcon className='w-3.5 h-3.5' />
                              {date}
                            </span>
                            <span className='flex items-center gap-1'>
                              <ClockIcon className='w-3.5 h-3.5' />
                              {time}
                            </span>
                            {appointment.accountName && (
                              <span className='flex items-center gap-1'>
                                <UserIcon className='w-3.5 h-3.5' />
                                {appointment.accountName}
                              </span>
                            )}
                            <span className='flex items-center gap-1.5'>
                              <span
                                className='inline-block w-2.5 h-2.5 rounded-full'
                                style={{
                                  backgroundColor: getStaffColor(
                                    appointment.staffId,
                                  ),
                                }}
                              />
                              {staffNameById(appointment.staffId)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-xl'>
              {selectedAppointment?.service || 'Appointment Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className='flex flex-col gap-4 mt-2'>
              {selectedAppointment.status && (
                <Badge
                  variant='secondary'
                  className={clsx(
                    getStatusColor(selectedAppointment.status),
                    'text-[13px] font-medium w-fit',
                  )}
                >
                  {capitalizeFirst(selectedAppointment.status)}
                </Badge>
              )}

              {!selectedAppointment.accountId && (
                <div className='flex gap-3 border p-4 rounded-lg my-2'>
                  <TriangleAlertIcon
                    className='w-6 text-destructive'
                    strokeWidth={2.4}
                  />

                  <div>
                    <h4 className='text-[15px] font-semibold text-destructive mb-1'>
                      Client Not Synced
                    </h4>
                    <p className='text-sm text-destructive mb-4'>
                      This appointment has a customer which is not linked to a
                      CRM client.
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className='cursor-pointer'>
                          <span>Sync client</span>
                          <ChevronDownIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='start'>
                        <DropdownMenuItem onClick={handleCreateClient}>
                          Create new
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLinkClient}>
                          Link to existing one
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              <div className='flex items-center gap-3'>
                <CalendarIcon className='w-5 h-5 text-neutral-500' />
                <div className='flex flex-col'>
                  <span className='text-sm font-medium text-neutral-600'>
                    Date
                  </span>
                  <span className='text-[15px] text-neutral-900'>
                    {
                      formatDateTime(
                        selectedAppointment.startAt || '',
                        selectedAppointment.endAt,
                      ).date
                    }
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <ClockIcon className='w-5 h-5 text-neutral-500' />
                <div className='flex flex-col'>
                  <span className='text-sm font-medium text-neutral-600'>
                    Time
                  </span>
                  <span className='text-[15px] text-neutral-900'>
                    {
                      formatDateTime(
                        selectedAppointment.startAt || '',
                        selectedAppointment.endAt,
                      ).time
                    }{' '}
                    {selectedAppointment.durationMinutes && (
                      <>({selectedAppointment.durationMinutes} minutes)</>
                    )}
                  </span>
                </div>
              </div>

              {selectedAppointment.accountName && (
                <div className='flex items-center gap-3 w-full'>
                  <UserIcon className='w-5 h-5 text-neutral-500' />
                  <div className='flex flex-col w-full'>
                    <span className='text-sm font-medium text-neutral-600'>
                      Client
                    </span>
                    <Link
                      href={
                        selectedAppointment.accountId
                          ? `/clients/${selectedAppointment.accountId}`
                          : '#'
                      }
                      className={clsx('text-[15px] hover:underline', {
                        'text-purple cursor-pointer':
                          selectedAppointment.accountId,
                        'cursor-not-allowed': !selectedAppointment.accountId,
                      })}
                    >
                      {selectedAppointment.accountName}
                    </Link>
                  </div>
                </div>
              )}

              <div className='border-t pt-6 mt-3 text-sm text-neutral-500 flex flex-col gap-2'>
                {selectedAppointment.createdBy && (
                  <p>Booked by: {selectedAppointment.createdBy}</p>
                )}
                {selectedAppointment.createdAt && (
                  <p>
                    Created on:{' '}
                    {format(new Date(selectedAppointment.createdAt), 'PPP p')}
                  </p>
                )}
              </div>

              {selectedAppointment.status !== 'CANCELLED_BY_CUSTOMER' &&
                selectedAppointment.status !== 'CANCELLED_BY_SELLER' && (
                  <div className='flex justify-end mt-4 pt-4 border-t'>
                    <Button
                      variant='outline'
                      className='text-red-600 hover:text-red-700 cursor-pointer'
                      onClick={() => {
                        setIsDialogOpen(false);
                        setIsCancelDialogOpen(true);
                      }}
                    >
                      Cancel Appointment
                    </Button>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDateDialogOpen}
        onOpenChange={(open) => {
          setIsDateDialogOpen(open);
          if (!open) {
            setViewingAppointmentFromDate(false);
            setSelectedAppointment(null);
          }
        }}
      >
        <DialogContent className='max-w-2xl'>
          {!viewingAppointmentFromDate ? (
            <>
              <DialogHeader>
                <DialogTitle className='text-[19px]'>
                  Appointments for{' '}
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </DialogTitle>
              </DialogHeader>

              {selectedDate && (
                <div className='flex flex-col gap-3 mt-2'>
                  {getAppointmentsForDate(selectedDate).length === 0 ? (
                    <div className='text-center py-8'>
                      <CalendarIcon className='w-6 h-6 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-500 text-[15px]'>
                        No appointments scheduled for this day
                      </p>
                    </div>
                  ) : (
                    getAppointmentsForDate(selectedDate).map((appointment) => (
                      <div
                        key={appointment.id}
                        className='border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors'
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setViewingAppointmentFromDate(true);
                        }}
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-gray-900'>
                              {appointment.service || 'Appointment'}
                            </span>
                            {!appointment.accountId && (
                              <AlertTriangleIcon className='w-4 h-4 text-amber-600' />
                            )}
                          </div>
                          {appointment.status && (
                            <Badge
                              variant='secondary'
                              className={clsx(
                                getStatusColor(appointment.status),
                                'text-xs',
                              )}
                            >
                              {capitalizeFirst(appointment.status)}
                            </Badge>
                          )}
                        </div>

                        <div className='flex items-center gap-4 text-sm text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <ClockIcon className='w-4 h-4' />
                            <span>
                              {
                                formatDateTime(
                                  appointment.startAt || '',
                                  appointment.endAt,
                                ).time
                              }
                            </span>
                          </div>
                          {appointment.accountName && (
                            <div className='flex items-center gap-1'>
                              <UserIcon className='w-4 h-4' />
                              <span>{appointment.accountName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <DialogHeader>
                <div className='flex items-center gap-3'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setViewingAppointmentFromDate(false)}
                  >
                    <ArrowLeft strokeWidth={2.5} className='w-4 h-4' />
                  </Button>
                  <DialogTitle className='text-xl'>
                    {selectedAppointment?.service || 'Appointment Details'}
                  </DialogTitle>
                </div>
              </DialogHeader>

              {selectedAppointment && (
                <div className='flex flex-col gap-4 mt-2'>
                  {selectedAppointment.status && (
                    <Badge
                      variant='secondary'
                      className={clsx(
                        getStatusColor(selectedAppointment.status),
                        'text-[13px] font-medium w-fit',
                      )}
                    >
                      {capitalizeFirst(selectedAppointment.status)}
                    </Badge>
                  )}

                  {!selectedAppointment.accountId && (
                    <div className='flex gap-3 border p-4 rounded-lg my-2'>
                      <TriangleAlertIcon
                        className='w-6 text-destructive'
                        strokeWidth={2.4}
                      />

                      <div>
                        <h4 className='text-[15px] font-semibold text-destructive mb-1'>
                          Client Not Synced
                        </h4>
                        <p className='text-sm text-destructive mb-4'>
                          This appointment has a customer which is not linked to
                          a CRM client.
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className='cursor-pointer'>
                              <span>Sync client</span>
                              <ChevronDownIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='start'>
                            <DropdownMenuItem onClick={handleCreateClient}>
                              Create new
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLinkClient}>
                              Link to existing one
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}

                  <div className='flex items-center gap-3'>
                    <CalendarIcon className='w-5 h-5 text-neutral-500' />
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium text-neutral-600'>
                        Date
                      </span>
                      <span className='text-[15px] text-neutral-900'>
                        {
                          formatDateTime(
                            selectedAppointment.startAt || '',
                            selectedAppointment.endAt,
                          ).date
                        }
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <ClockIcon className='w-5 h-5 text-neutral-500' />
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium text-neutral-600'>
                        Time
                      </span>
                      <span className='text-[15px] text-neutral-900'>
                        {
                          formatDateTime(
                            selectedAppointment.startAt || '',
                            selectedAppointment.endAt,
                          ).time
                        }{' '}
                        {selectedAppointment.durationMinutes && (
                          <>({selectedAppointment.durationMinutes} minutes)</>
                        )}
                      </span>
                    </div>
                  </div>

                  {selectedAppointment.accountName && (
                    <div className='flex items-center gap-3 w-full'>
                      <UserIcon className='w-5 h-5 text-neutral-500' />
                      <div className='flex flex-col w-full'>
                        <span className='text-sm font-medium text-neutral-600'>
                          Client
                        </span>
                        <Link
                          href={
                            selectedAppointment.accountId
                              ? `/clients/${selectedAppointment.accountId}`
                              : '#'
                          }
                          className={clsx('text-[15px] hover:underline', {
                            'text-purple cursor-pointer':
                              selectedAppointment.accountId,
                            'cursor-not-allowed':
                              !selectedAppointment.accountId,
                          })}
                        >
                          {selectedAppointment.accountName}
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className='border-t pt-6 mt-3 text-sm text-neutral-500 flex flex-col gap-2'>
                    {selectedAppointment.createdBy && (
                      <p>Booked by: {selectedAppointment.createdBy}</p>
                    )}
                    {selectedAppointment.createdAt && (
                      <p>
                        Created on:{' '}
                        {new Date(
                          selectedAppointment.createdAt,
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {selectedAppointment.status !== 'CANCELLED_BY_CUSTOMER' &&
                    selectedAppointment.status !== 'CANCELLED_BY_SELLER' && (
                      <div className='flex justify-end mt-4 pt-4 border-t'>
                        <Button
                          variant='outline'
                          className='text-red-600 hover:text-red-700 cursor-pointer'
                          onClick={() => {
                            setIsDateDialogOpen(false);
                            setIsCancelDialogOpen(true);
                          }}
                        >
                          Cancel Appointment
                        </Button>
                      </div>
                    )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <CreateClientDialog
        open={isCreateClientDialogOpen}
        onOpenChange={setIsCreateClientDialogOpen}
        customerId={selectedAppointment?.customerId}
        customerName={selectedAppointment?.accountName}
        onSuccess={handleClientCreated}
      />

      <LinkClientDialog
        open={isLinkClientDialogOpen}
        onOpenChange={setIsLinkClientDialogOpen}
        onSelect={handleClientLinked}
        isLinking={syncAppointment.isPending}
        customerName={selectedAppointment?.accountName}
      />

      <AppointmentDialog
        open={isBookingDialogOpen}
        onOpenChange={setIsBookingDialogOpen}
        selectedDateTime={selectedTimeSlot || undefined}
      />

      <CancelAppointmentDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        appointment={selectedAppointment}
      />
    </>
  );
}
