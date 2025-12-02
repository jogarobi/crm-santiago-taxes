export type CalendarView = 'day' | 'week' | 'month';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
  status?: string;
  color?: string;
}

export interface CalendarProps {
  events: CalendarEvent[];
  view: CalendarView;
  currentDate: Date;
  availableSlots: string[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventCreate?: (eventData: Partial<CalendarEvent>) => void;
  onTimeSlotClick?: (dateTime: Date) => void;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  className?: string;
}
