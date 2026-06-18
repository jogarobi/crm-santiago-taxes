'use client';

import { Fragment } from 'react/jsx-runtime';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarProps } from './types';
import { startOfWeek } from 'date-fns';

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  view,
  currentDate,
  availableSlots,
  onEventClick,
  onDateClick,
  onTimeSlotClick,
  onDateChange,
  onViewChange,
  className,
  headerActions,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    onDateChange(newDate);
  };

  const getDateTitle = () => {
    switch (view) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return `${startOfWeek.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} - ${endOfWeek.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;
      case 'month':
        return currentDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        });
      default:
        return '';
    }
  };

  const currentDayHasEvents = () => {
    return events.some((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === currentDate.toDateString();
    });
  };

  const renderDayView = () => {
    const dayEvents = events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === currentDate.toDateString();
    });

    const hours = Array.from({ length: 15 }, (_, i) => i + 6);
    const timeSlots = [];

    for (const hour of hours) {
      for (let minute = 0; minute < 60; minute += 15) {
        timeSlots.push({ hour, minute });
      }
    }

    const getEventsForSlot = (hour: number, minute: number) => {
      return dayEvents.filter((event) => {
        const eventStart = event.startDate;
        const eventHour = eventStart.getHours();
        const eventMinute = eventStart.getMinutes();

        return (
          eventHour === hour &&
          eventMinute >= minute &&
          eventMinute < minute + 15
        );
      });
    };

    return (
      <div className='flex-1 overflow-y-auto'>
        <div className='grid grid-cols-[60px_1fr] gap-0'>
          {timeSlots.map(({ hour, minute }, index) => {
            const slotEvents = getEventsForSlot(hour, minute);
            const isLastSlot = index === timeSlots.length - 1;
            const isHourStart = minute === 0;

            const slotDateTime = new Date(currentDate);
            slotDateTime.setHours(hour, minute, 0, 0);
            const formattedSlot = slotDateTime
              .toISOString()
              .replace('.000Z', 'Z');

            // Check 15 minutes before to cover the full 30-minute availability window
            const slotDateTime15MinBefore = new Date(currentDate);
            slotDateTime15MinBefore.setHours(hour, minute - 15, 0, 0);
            const formattedSlot15MinBefore = slotDateTime15MinBefore
              .toISOString()
              .replace('.000Z', 'Z');

            const now = new Date();
            const isInPast = slotDateTime < now;
            // Available if this exact slot OR if a 30-min block started 15 min ago
            const isAvailableForBooking =
              availableSlots.includes(formattedSlot) ||
              (minute % 30 === 15 &&
                availableSlots.includes(formattedSlot15MinBefore));
            const isUnavailable = isInPast || !isAvailableForBooking;

            return (
              <Fragment key={`${hour}-${minute}`}>
                <div className='py-1 pr-2 text-xs text-gray-500 text-right border-r min-h-[15px]'>
                  {isHourStart && (
                    <>
                      {hour === 0
                        ? '12 AM'
                        : hour <= 12
                        ? `${hour} ${hour === 12 ? 'PM' : 'AM'}`
                        : `${hour - 12} PM`}
                    </>
                  )}
                </div>
                <div
                  className={cn(
                    'border-gray-100 min-h-[15px] p-1 relative transition-colors',
                    !isLastSlot && 'border-b',
                    isUnavailable && slotEvents.length === 0
                      ? 'bg-gray-100 cursor-not-allowed opacity-60'
                      : slotEvents.length === 0
                      ? 'cursor-pointer hover:bg-green-50 bg-green-50/30'
                      : 'cursor-pointer'
                  )}
                  onClick={() => {
                    if (
                      onTimeSlotClick &&
                      slotEvents.length === 0 &&
                      !isUnavailable
                    ) {
                      onTimeSlotClick(slotDateTime);
                    }
                  }}
                >
                  {slotEvents.map((event) => {
                    const durationMinutes = Math.round(
                      (event.endDate.getTime() - event.startDate.getTime()) /
                        (1000 * 60)
                    );
                    const height = Math.max(
                      Math.round(durationMinutes / 15) * 15,
                      60
                    );

                    return (
                      <div
                        key={event.id}
                        className='text-white p-1.5 rounded text-xs cursor-pointer hover:opacity-90 absolute left-1 right-1 z-10 overflow-hidden flex flex-col justify-start'
                        style={{ height: `${height}px`, backgroundColor: event.color || '#7c3aed' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <div className='font-medium truncate leading-tight'>
                          {event.title}
                        </div>
                        <div className='text-xs opacity-75 truncate leading-tight'>
                          {event.startDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    return (
      <div className='flex-1 flex flex-col'>
        <div className='bg-white border-b sticky top-0 z-20'>
          <div className='grid grid-cols-8 gap-0'>
            <div className='border-r border-b p-2'></div>
            {weekDays.map((day, dayIndex) => {
              const dayHasEvents = events.some((event) => {
                const eventDate = new Date(event.startDate);
                return eventDate.toDateString() === day.toDateString();
              });

              return (
                <div
                  key={day.toDateString()}
                  className={cn(
                    'p-2 text-center flex flex-col items-center relative',
                    dayIndex < 6 && 'border-r'
                  )}
                >
                  <div className='text-sm font-medium'>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div
                    className={cn(
                      'text-[15px]',
                      day.toDateString() === today.toDateString() &&
                        'text-white grid place-items-center bg-purple font-bold rounded-full w-8 h-8'
                    )}
                  >
                    {day.getDate()}
                  </div>
                  {dayHasEvents &&
                    day.toDateString() !== today.toDateString() && (
                      <div className='w-1.5 h-1.5 bg-purple rounded-full mt-1'></div>
                    )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className='grid grid-cols-8 gap-0'>
            {(() => {
              const hours = Array.from({ length: 15 }, (_, i) => i + 6);
              const timeSlots = [];

              for (const hour of hours) {
                for (let minute = 0; minute < 60; minute += 15) {
                  timeSlots.push({ hour, minute });
                }
              }

              return timeSlots.map(({ hour, minute }, index) => {
                const isLastSlot = index === timeSlots.length - 1;
                const isHourStart = minute === 0;

                return (
                  <Fragment key={`${hour}-${minute}`}>
                    <div
                      className={cn(
                        'border-r py-1 pr-2 text-xs text-gray-500 text-right min-h-[15px]',
                        !isLastSlot && 'border-b'
                      )}
                    >
                      {isHourStart && (
                        <>
                          {hour === 0
                            ? '12 AM'
                            : hour <= 12
                            ? `${hour} ${hour === 12 ? 'PM' : 'AM'}`
                            : `${hour - 12} PM`}
                        </>
                      )}
                    </div>

                    {weekDays.map((day, dayIndex) => {
                      const dayEvents = events.filter((event) => {
                        const eventDate = new Date(event.startDate);
                        const eventHour = eventDate.getHours();
                        const eventMinute = eventDate.getMinutes();

                        return (
                          eventDate.toDateString() === day.toDateString() &&
                          eventHour === hour &&
                          eventMinute >= minute &&
                          eventMinute < minute + 15
                        );
                      });

                      const isRightEdge = dayIndex === 6;
                      const slotDateTime = new Date(day);

                      slotDateTime.setHours(hour, minute, 0, 0);

                      const formattedSlot = slotDateTime
                        .toISOString()
                        .replace('.000Z', 'Z');

                      // Check 15 minutes before to cover the full 30-minute availability window
                      const slotDateTime15MinBefore = new Date(day);
                      slotDateTime15MinBefore.setHours(hour, minute - 15, 0, 0);
                      const formattedSlot15MinBefore = slotDateTime15MinBefore
                        .toISOString()
                        .replace('.000Z', 'Z');

                      const now = new Date();
                      const isInPast = slotDateTime < now;
                      // Available if this exact slot OR if a 30-min block started 15 min ago
                      const isAvailableForBooking =
                        availableSlots.includes(formattedSlot) ||
                        (minute % 30 === 15 &&
                          availableSlots.includes(formattedSlot15MinBefore));

                      const isUnavailable = isInPast || !isAvailableForBooking;

                      return (
                        <div
                          key={`${day.toDateString()}-${hour}-${minute}`}
                          className={cn(
                            'min-h-[15px] p-1 relative transition-colors',
                            !isLastSlot && 'border-b',
                            !isRightEdge && 'border-r',
                            isUnavailable && dayEvents.length === 0
                              ? 'bg-gray-100 cursor-not-allowed opacity-60'
                              : dayEvents.length === 0
                              ? 'cursor-pointer hover:bg-green-50 bg-green-50/30'
                              : 'cursor-pointer'
                          )}
                          onClick={() => {
                            if (
                              onTimeSlotClick &&
                              dayEvents.length === 0 &&
                              !isUnavailable
                            ) {
                              onTimeSlotClick(slotDateTime);
                            }
                          }}
                        >
                          {dayEvents.map((event) => {
                            const durationMinutes = Math.round(
                              (event.endDate.getTime() -
                                event.startDate.getTime()) /
                                (1000 * 60)
                            );
                            const height = Math.max(
                              Math.round(durationMinutes / 15) * 15,
                              45
                            );

                            return (
                              <div
                                key={event.id}
                                className='text-white p-1.5 rounded text-xs cursor-pointer hover:opacity-90 absolute left-1 right-1 z-10 overflow-hidden flex flex-col justify-start'
                                style={{
                                  height: `${height}px`,
                                  backgroundColor: event.color || '#7c3aed',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEventClick?.(event);
                                }}
                              >
                                <div className='font-medium truncate leading-tight'>
                                  {event.title}
                                </div>
                                <div className='text-xs opacity-75 truncate leading-tight'>
                                  {event.startDate.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </Fragment>
                );
              });
            })()}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const startCalendar = new Date(firstDayOfMonth);

    const firstDayWeekday = firstDayOfMonth.getDay();
    startCalendar.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

    const calendarDays = [];
    const totalDays = 42;

    for (let i = 0; i < totalDays; i++) {
      const day = new Date(startCalendar);
      day.setDate(startCalendar.getDate() + i);
      calendarDays.push(day);
    }

    return (
      <div className='flex-1'>
        <div className='grid grid-cols-7 gap-0 h-full'>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
            <div
              key={day}
              className={cn(
                'border-b p-2 text-center text-sm font-medium bg-gray-50',
                idx !== 6 && 'border-r'
              )}
            >
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            const dayEvents = events.filter((event) => {
              const eventDate = new Date(event.startDate);
              return eventDate.toDateString() === day.toDateString();
            });

            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === today.toDateString();
            const isBottomRow = index >= 35;
            const isRightEdge = (index + 1) % 7 === 0;

            return (
              <div
                key={`${day.toDateString()}-${index}`}
                className={cn(
                  'p-3 cursor-pointer hover:bg-gray-50',
                  !isBottomRow && 'border-b',
                  !isRightEdge && 'border-r',
                  !isCurrentMonth && 'text-gray-400 bg-gray-50'
                )}
                onClick={() => onDateClick?.(day)}
              >
                <div
                  className={cn(
                    'text-sm mb-1',
                    isToday &&
                      'text-white grid place-items-center bg-purple font-bold rounded-full w-8 h-8'
                  )}
                >
                  {day.getDate()}
                </div>
                <div className='space-y-1'>
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className='text-white p-1 rounded text-xs cursor-pointer hover:opacity-90'
                      style={{ backgroundColor: event.color || '#7c3aed' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <div className='font-medium truncate'>{event.title}</div>
                      <div className='text-xs opacity-75 truncate'>
                        {event.startDate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className='text-xs text-gray-500'>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white overflow-y-scroll border rounded-lg',
        className
      )}
    >
      <div className='flex items-center justify-between p-4 border-b'>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className='w-4 h-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className='w-4 h-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onDateChange(new Date())}
            >
              Today
            </Button>
          </div>
          <div className='flex items-center space-x-2'>
            <h2 className='text-[17px] font-semibold'>{getDateTitle()}</h2>
            {view === 'day' && currentDayHasEvents() && (
              <div className='w-2 h-2 bg-purple rounded-full'></div>
            )}
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          {headerActions}
          <Button
            variant='outline'
            size='sm'
            onClick={() => onViewChange('day')}
            className={view === 'day' ? 'bg-white text-purple shadow-sm' : ''}
          >
            Day
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onViewChange('week')}
            className={view === 'week' ? 'bg-white text-purple shadow-sm' : ''}
          >
            Week
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onViewChange('month')}
            className={view === 'month' ? 'bg-white text-purple shadow-sm' : ''}
          >
            Month
          </Button>
        </div>
      </div>

      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
    </div>
  );
};

export default Calendar;
