'use client';

import { Fragment } from 'react/jsx-runtime';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarProps } from './types';

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  view,
  currentDate,
  onEventClick,
  onDateClick,
  onDateChange,
  onViewChange,
  className,
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

  const renderDayView = () => {
    const dayEvents = events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === currentDate.toDateString();
    });

    const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM

    return (
      <div className='flex-1 overflow-y-auto'>
        <div className='grid grid-cols-[60px_1fr] gap-0'>
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter((event) => {
              return event.startDate.getHours() === hour;
            });

            const isLastHour = hour === 20;

            return (
              <Fragment key={hour}>
                <div className='py-2 pr-2 text-xs text-gray-500 text-right border-r'>
                  {hour === 0
                    ? '12 AM'
                    : hour <= 12
                    ? `${hour} ${hour === 12 ? 'PM' : 'AM'}`
                    : `${hour - 12} PM`}
                </div>
                <div
                  className={cn(
                    'border-gray-100 min-h-[60px] p-1',
                    !isLastHour && 'border-b'
                  )}
                >
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className='bg-blue-100 text-blue-800 p-1 rounded text-xs cursor-pointer hover:bg-blue-200 mb-1'
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className='font-medium truncate'>{event.title}</div>
                      <div className='text-xs opacity-75'>
                        {event.startDate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className='flex-1 overflow-y-auto'>
        <div className='grid grid-cols-8 gap-0'>
          <div className='border-r border-b p-2'></div>
          {weekDays.map((day, dayIndex) => (
            <div
              key={day.toDateString()}
              className={cn(
                'border-b p-2 text-center flex flex-col items-center',
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
            </div>
          ))}

          {Array.from({ length: 15 }, (_, i) => {
            const hour = i + 6;
            const isLastHour = hour === 20;

            return (
              <Fragment key={hour}>
                <div
                  className={cn(
                    'border-r py-2 pr-2 text-xs text-gray-500 text-right',
                    !isLastHour && 'border-b'
                  )}
                >
                  {hour === 0
                    ? '12 AM'
                    : hour <= 12
                    ? `${hour} ${hour === 12 ? 'PM' : 'AM'}`
                    : `${hour - 12} PM`}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = events.filter((event) => {
                    const eventDate = new Date(event.startDate);
                    return (
                      eventDate.toDateString() === day.toDateString() &&
                      eventDate.getHours() === hour
                    );
                  });

                  const isRightEdge = dayIndex === 6;

                  return (
                    <div
                      key={`${day.toDateString()}-${hour}`}
                      className={cn(
                        'min-h-14 p-1',
                        !isLastHour && 'border-b',
                        !isRightEdge && 'border-r'
                      )}
                    >
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className='bg-blue-100 text-blue-800 p-1 rounded text-xs cursor-pointer hover:bg-blue-200 mb-1'
                          onClick={() => onEventClick?.(event)}
                        >
                          <div className='font-medium truncate'>
                            {event.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
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
            const isRightEdge = (index + 1) % 7 === 0; // Every 7th item (indexes 6, 13, 20, 27, 34, 41)

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
                      className='bg-blue-100 text-blue-800 p-1 rounded text-xs cursor-pointer hover:bg-blue-200'
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <div className='font-medium truncate'>{event.title}</div>
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
        'flex flex-col h-full bg-white border rounded-lg',
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
          <h2 className='text-[17px] font-semibold'>{getDateTitle()}</h2>
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size='sm'
            onClick={() => onViewChange('day')}
            className={view === 'day' ? 'bg-purple' : ''}
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size='sm'
            onClick={() => onViewChange('week')}
            className={view === 'week' ? 'bg-purple' : ''}
          >
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size='sm'
            onClick={() => onViewChange('month')}
            className={view === 'month' ? 'bg-purple' : ''}
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
