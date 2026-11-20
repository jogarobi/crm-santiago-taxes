'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DateInput } from '@/components/ui/date-input';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  ActivityIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CheckCheckIcon,
  ListChecksIcon,
  Loader2,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react';
import { useRecentActivities } from '@/hooks/use-activities';
import { useTasks } from '@/hooks/use-tasks';
import { StaffName } from './StaffName';
import type { LucideIcon } from 'lucide-react';

type FeedItem = {
  key: string;
  kind: 'activity' | 'task';
  createdAt: string;
  createdBy: string;
  title: string;
  typeName?: string | null;
  typeIcon?: string | null;
  accountId?: number | null;
  accountName?: string | null;
  businessName?: string | null;
  status?: string | null;
};

const ICON_BY_NAME: Record<string, LucideIcon> = {
  Phone: PhoneIcon,
  User: UserIcon,
  Calendar: CalendarIcon,
  Mail: MailIcon,
};

function iconFor(item: FeedItem): LucideIcon {
  if (item.kind === 'task') return ListChecksIcon;
  if (item.typeIcon && ICON_BY_NAME[item.typeIcon])
    return ICON_BY_NAME[item.typeIcon];
  return ActivityIcon;
}

// Text color per activity type, applied to both the icon and the type label.
const COLOR_BY_ICON: Record<string, string> = {
  Phone: 'text-green-600',
  User: 'text-blue-600',
  Calendar: 'text-purple',
  Mail: 'text-amber-600',
};

function colorFor(item: FeedItem): string {
  if (item.kind === 'task') return 'text-purple';
  if (item.typeIcon && COLOR_BY_ICON[item.typeIcon])
    return COLOR_BY_ICON[item.typeIcon];
  return 'text-neutral-600';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function TodaysWork() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const isToday = isSameDay(selectedDate, new Date());

  const range = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    return { since: start.toISOString(), until: end.toISOString() };
  }, [selectedDate]);

  const {
    data: activities,
    isLoading: loadingActivities,
    error: activitiesError,
  } = useRecentActivities({ since: range.since, until: range.until, limit: 20 });

  const {
    data: tasksData,
    isLoading: loadingTasks,
    error: tasksError,
  } = useTasks({ dateFrom: range.since, dateTo: range.until, limit: 20 });

  const isLoading = loadingActivities || loadingTasks;
  const error = activitiesError || tasksError;

  const items = useMemo<FeedItem[]>(() => {
    const feed: FeedItem[] = [];

    for (const a of activities ?? []) {
      feed.push({
        key: `activity-${a.id}`,
        kind: 'activity',
        createdAt: a.createdAt,
        createdBy: a.createdBy,
        title: a.title,
        typeName: a.typeName,
        typeIcon: a.typeIcon,
        accountId: a.clientId,
        accountName: a.accountName,
      });
    }

    for (const t of tasksData?.tasks ?? []) {
      feed.push({
        key: `task-${t.id}`,
        kind: 'task',
        createdAt: t.createdAt,
        createdBy: t.createdBy,
        title: t.content,
        accountId: t.accountId,
        accountName: t.accountName,
        businessName: t.businessName,
        status: t.status,
      });
    }

    return feed
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [activities, tasksData]);

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <div className='flex items-center justify-center py-8 mt-4'>
        <Loader2 className='w-6 h-6 animate-spin text-purple' />
        <span className='ml-2 text-neutral-600 text-sm'>Loading activity...</span>
      </div>
    );
  } else if (error) {
    content = (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4 mt-4'>
        <p className='text-red-800 text-sm'>
          Failed to load activity. Please try again later.
        </p>
      </div>
    );
  } else if (items.length === 0) {
    content = (
      <div className='mt-4'>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='default' className='py-2 px-3 border rounded-md'>
              <CheckCheckIcon className='w-5 stroke-neutral-500' />
            </EmptyMedia>
            <EmptyTitle className='text-[16px] text-neutral-500 font-normal'>
              {isToday ? 'No activity yet today' : 'No activity on this day'}
            </EmptyTitle>
            <Link
              className='text-purple text-[15px] hover:underline mt-1'
              href='/tasks'
            >
              Create a task
              <ArrowUpRightIcon className='w-4 inline-block ml-1' />
            </Link>
          </EmptyHeader>
        </Empty>
      </div>
    );
  } else {
    content = (
    <div className='mt-4 flex flex-col gap-5'>
      {items.map((item) => {
        const Icon = iconFor(item);
        const color = colorFor(item);
        const target = item.accountId ? `/clients/${item.accountId}` : null;

        const body = (
          <>
            <div className='flex items-start gap-3'>
              <div className='py-2 px-2 border rounded-md shrink-0'>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-3 min-w-0'>
                  <p className='font-medium text-neutral-900 text-[15px] truncate min-w-0'>
                    {item.title}
                  </p>
                  <span className='text-sm text-neutral-500 shrink-0'>
                    {formatTime(item.createdAt)}
                  </span>
                </div>
                <div className='mt-1 flex items-center gap-2 flex-wrap text-sm text-neutral-600'>
                  <span className={`font-medium ${color}`}>
                    {item.kind === 'task'
                      ? 'Task'
                      : item.typeName ?? 'Activity'}
                  </span>
                  {(item.accountName || item.businessName) && (
                    <>
                      <span className='text-neutral-300'>·</span>
                      <span className='truncate'>
                        {item.accountName ?? item.businessName}
                      </span>
                    </>
                  )}
                  <span className='text-neutral-300'>·</span>
                  <StaffName id={item.createdBy} className='text-neutral-600' />
                </div>
              </div>
            </div>
          </>
        );

        return target ? (
          <Link
            key={item.key}
            href={target}
            className='block bg-white border rounded-lg p-4 hover:shadow-xs transition-shadow'
          >
            {body}
          </Link>
        ) : (
          <div
            key={item.key}
            className='block bg-white border rounded-lg p-4'
          >
            {body}
          </div>
        );
      })}

      <Link
        href='/tasks'
        className='block text-center text-purple text-[15px] font-normal hover:underline pt-2'
      >
        View all tasks
        <ArrowUpRightIcon className='w-4 inline-block ml-1' />
      </Link>
    </div>
    );
  }

  return (
    <div className='w-full min-w-0'>
      <div className='flex items-center justify-between gap-3 mb-5'>
        <h3 className='font-semibold text-[17px] shrink-0'>
          {isToday ? "Today's activity" : 'Activity'}
        </h3>
        <div className='w-[170px] bg-white rounded-md'>
          <DateInput
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            disabled={{ after: new Date() }}
          />
        </div>
      </div>
      {content}
    </div>
  );
}
