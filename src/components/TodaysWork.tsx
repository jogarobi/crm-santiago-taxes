'use client';

import { createElement, useMemo, useState } from 'react';
import Link from 'next/link';
import { DateInput } from '@/components/ui/date-input';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Human label used both for the row's type pill and the type filter options.
function typeLabel(item: FeedItem): string {
  return item.kind === 'task' ? 'Task' : item.typeName ?? 'Activity';
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

function FeedItemCard({ item }: { item: FeedItem }) {
  const color = colorFor(item);
  const target = item.accountId ? `/clients/${item.accountId}` : null;

  const body = (
    <div className='flex items-start gap-3'>
      <div className='py-2 px-2 border rounded-md shrink-0'>
        {createElement(iconFor(item), { className: `w-4 h-4 ${color}` })}
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
          <span className={`font-medium ${color}`}>{typeLabel(item)}</span>
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
  );

  return target ? (
    <Link
      href={target}
      className='block bg-white border rounded-lg p-4 hover:shadow-xs transition-shadow'
    >
      {body}
    </Link>
  ) : (
    <div className='block bg-white border rounded-lg p-4'>{body}</div>
  );
}

const INLINE_LIMIT = 6;

export function TodaysWork() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

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
  } = useRecentActivities({ since: range.since, until: range.until, limit: 100 });

  const {
    data: tasksData,
    isLoading: loadingTasks,
    error: tasksError,
  } = useTasks({ dateFrom: range.since, dateTo: range.until, limit: 100 });

  const isLoading = loadingActivities || loadingTasks;
  const error = activitiesError || tasksError;

  // Full merged + sorted feed for the selected day (unfiltered, unsliced).
  const allItems = useMemo<FeedItem[]>(() => {
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

    return feed.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [activities, tasksData]);

  // Distinct type labels present in the day, for the filter dropdown.
  const typeOptions = useMemo(() => {
    const labels = new Set<string>();
    for (const item of allItems) labels.add(typeLabel(item));
    return Array.from(labels).sort();
  }, [allItems]);

  const filteredItems = useMemo(
    () =>
      typeFilter === 'all'
        ? allItems
        : allItems.filter((item) => typeLabel(item) === typeFilter),
    [allItems, typeFilter]
  );

  const inlineItems = filteredItems.slice(0, INLINE_LIMIT);

  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
  } else if (inlineItems.length === 0) {
    content = (
      <div className='mt-4'>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='default' className='py-2 px-3 border rounded-md'>
              <CheckCheckIcon className='w-5 stroke-neutral-500' />
            </EmptyMedia>
            <EmptyTitle className='text-[16px] text-neutral-500 font-normal'>
              {typeFilter !== 'all'
                ? `No ${typeFilter.toLowerCase()} activity on this day`
                : isToday
                  ? 'No activity yet today'
                  : 'No activity on this day'}
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
        {inlineItems.map((item) => (
          <FeedItemCard key={item.key} item={item} />
        ))}

        <button
          type='button'
          onClick={() => setDialogOpen(true)}
          className='block text-center text-purple text-[15px] font-normal hover:underline pt-2 cursor-pointer'
        >
          View all activity
          {filteredItems.length > INLINE_LIMIT && ` (${filteredItems.length})`}
          <ArrowUpRightIcon className='w-4 inline-block ml-1' />
        </button>
      </div>
    );
  }

  return (
    <div className='w-full min-w-0'>
      <div className='flex items-center justify-between gap-3 mb-5 flex-wrap'>
        <h3 className='font-semibold text-[17px] shrink-0'>
          {isToday ? "Today's activity" : 'Activity'}
        </h3>
        <div className='flex items-center gap-2'>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-[140px] bg-white'>
              <SelectValue placeholder='All types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              {typeOptions.map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className='w-[150px] bg-white rounded-md'>
            <DateInput
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              disabled={{ after: new Date() }}
            />
          </div>
        </div>
      </div>
      {content}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-xl'>
              Activity · {isToday ? 'Today' : dateLabel}
              {typeFilter !== 'all' && (
                <span className='text-neutral-500 font-normal'>
                  {' '}
                  — {typeFilter}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {filteredItems.length === 0 ? (
            <p className='text-neutral-500 text-sm py-6 text-center'>
              No activity to show.
            </p>
          ) : (
            <div className='mt-2 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1'>
              {filteredItems.map((item) => (
                <FeedItemCard key={item.key} item={item} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
