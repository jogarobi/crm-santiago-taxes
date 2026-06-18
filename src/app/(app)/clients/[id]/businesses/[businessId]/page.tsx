'use client';

import { use, useState } from 'react';
import { useBusiness, useBusinessAccounts, useAddBusinessAccount, useRemoveBusinessAccount } from '@/hooks/use-businesses';
import { useAccounts } from '@/hooks/use-accounts';
import { useNotes } from '@/hooks/use-notes';
import { useTouchpoints } from '@/hooks/use-touchpoints';
import { useSessionUser } from '@/lib/use-session-user';
import {
  Building2Icon,
  ClockIcon,
  Edit2Icon,
  Loader2,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  MailIcon,
  XIcon,
  LinkIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { NotesGrid } from '@/components/NotesGrid';
import { CreateNoteDialog } from '@/components/CreateNoteDialog';
import { NoteDetailDialog } from '@/components/NoteDetailDialog';
import { EditBusinessDialog } from '@/components/EditBusinessDialog';
import { DeleteBusinessDialog } from '@/components/DeleteBusinessDialog';
import { LogTouchpointDialog } from '@/components/LogTouchpointDialog';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { TasksList } from '@/components/TasksList';
import type { Note } from '@/lib/types/note';

type DatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';

function getDateRange(preset: DatePreset, customFrom: string, customTo: string) {
  const now = new Date();
  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (preset === 'this_week') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
    return { dateFrom: monday.toISOString(), dateTo: sunday.toISOString() };
  }
  if (preset === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (preset === 'custom') {
    return {
      dateFrom: customFrom ? new Date(customFrom).toISOString() : undefined,
      dateTo: customTo ? new Date(customTo + 'T23:59:59.999').toISOString() : undefined,
    };
  }
  return {};
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

function DatePresetPills({
  preset,
  onChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  preset: DatePreset;
  onChange: (p: DatePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
}) {
  return (
    <div className='flex items-center gap-2 flex-wrap'>
      {DATE_PRESETS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => {
            onChange(value);
            if (value !== 'custom') {
              onCustomFromChange('');
              onCustomToChange('');
            }
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            preset === value
              ? 'bg-purple text-white border-purple'
              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:text-neutral-900'
          }`}
        >
          {label}
        </button>
      ))}
      {preset === 'custom' && (
        <>
          <input
            type='date'
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className='text-sm border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-purple'
          />
          <span className='text-neutral-400 text-sm'>to</span>
          <input
            type='date'
            value={customTo}
            min={customFrom}
            onChange={(e) => onCustomToChange(e.target.value)}
            className='text-sm border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-purple'
          />
        </>
      )}
    </div>
  );
}

function formatEIN(ein: string): string {
  const cleaned = ein.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }
  return ein;
}

function getTimeUntilAnniversary(establishedDate: string): string {
  const established = new Date(establishedDate);
  const today = new Date();

  let nextAnniversary = new Date(
    today.getFullYear(),
    established.getMonth(),
    established.getDate()
  );

  if (nextAnniversary < today) {
    nextAnniversary = new Date(
      today.getFullYear() + 1,
      established.getMonth(),
      established.getDate()
    );
  }

  const monthsDiff =
    (nextAnniversary.getFullYear() - today.getFullYear()) * 12 +
    (nextAnniversary.getMonth() - today.getMonth());

  const daysDiff =
    Math.floor(
      (nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    ) -
    monthsDiff * 30;

  if (monthsDiff === 0) {
    if (daysDiff <= 0) {
      return 'Today';
    } else if (daysDiff === 1) {
      return 'Due in 1 day';
    } else {
      return `Due in ${daysDiff} days`;
    }
  } else if (monthsDiff === 1) {
    return 'Due in 1 month';
  } else {
    return `Due in ${monthsDiff} months`;
  }
}

type Props = {
  params: Promise<{ id: string; businessId: string }>;
};

export default function BusinessDetailPage({ params }: Props) {
  const { id, businessId } = use(params);
  const accountId = parseInt(id);
  const businessIdInt = parseInt(businessId);

  const session = useSessionUser();

  const {
    data: business,
    isLoading,
    error,
  } = useBusiness(accountId, businessIdInt);

  const { data: linkedAccounts, isLoading: linkedAccountsLoading } =
    useBusinessAccounts(businessIdInt);

  const addBusinessAccount = useAddBusinessAccount();
  const removeBusinessAccount = useRemoveBusinessAccount();

  const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const { data: accountsData } = useAccounts(
    addAccountDialogOpen ? { search: accountSearch, pageSize: 10 } : undefined
  );

  const [createNoteDialogOpen, setCreateNoteDialogOpen] = useState(false);
  const [editBusinessDialogOpen, setEditBusinessDialogOpen] = useState(false);
  const [deleteBusinessDialogOpen, setDeleteBusinessDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteDetailDialogOpen, setNoteDetailDialogOpen] = useState(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [notesLimit, setNotesLimit] = useState(4);
  const [logTouchpointDialogOpen, setLogTouchpointDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  // Notes date filter
  const [notesPreset, setNotesPreset] = useState<DatePreset>('all');
  const [notesCustomFrom, setNotesCustomFrom] = useState('');
  const [notesCustomTo, setNotesCustomTo] = useState('');

  // Tasks date filter
  const [tasksPreset, setTasksPreset] = useState<DatePreset>('all');
  const [tasksCustomFrom, setTasksCustomFrom] = useState('');
  const [tasksCustomTo, setTasksCustomTo] = useState('');

  // Touchpoints date filter
  const [touchpointsPreset, setTouchpointsPreset] = useState<DatePreset>('all');
  const [touchpointsCustomFrom, setTouchpointsCustomFrom] = useState('');
  const [touchpointsCustomTo, setTouchpointsCustomTo] = useState('');

  const notesDateRange = notesPreset !== 'all' ? getDateRange(notesPreset, notesCustomFrom, notesCustomTo) : {};
  const tasksDateRange = tasksPreset !== 'all' ? getDateRange(tasksPreset, tasksCustomFrom, tasksCustomTo) : {};
  const touchpointsDateRange = touchpointsPreset !== 'all' ? getDateRange(touchpointsPreset, touchpointsCustomFrom, touchpointsCustomTo) : {};

  const { data: notesData, isLoading: notesLoading } = useNotes(null, {
    search: notesSearchQuery || undefined,
    limit: notesLimit,
    offset: 0,
    businessId: businessIdInt,
    ...notesDateRange,
  });

  const { data: touchpoints, isLoading: touchpointsLoading } = useTouchpoints({
    accountId,
    businessId: businessIdInt,
    ...touchpointsDateRange,
  });

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setNoteDetailDialogOpen(true);
  };

  const handleNoteDetailDialogClose = (open: boolean) => {
    setNoteDetailDialogOpen(open);
    if (!open) {
      setSelectedNote(null);
    }
  };

  const handleShowMore = () => {
    setNotesLimit((prev) => prev + 4);
  };

  const handleSearchChange = (value: string) => {
    setNotesSearchQuery(value);
    setNotesLimit(4);
  };

  const handleNotesPresetChange = (preset: DatePreset) => {
    setNotesPreset(preset);
    setNotesLimit(4);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='animate-spin' />
        <span className='ml-2'>Loading business...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8'>
        <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
          <p className='text-red-800'>
            Error loading business: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className='p-8'>
        <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
          <p className='text-yellow-800'>Business not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-8 pt-3'>
      <div className='flex items-center gap-8 bg-white border rounded-xl p-8'>
        <div className='text-3xl font-semibold h-20 w-20 rounded-full bg-purple text-white flex items-center justify-center'>
          <Building2Icon strokeWidth={1.4} size={36} />
        </div>

        <div className='flex flex-col gap-3'>
          <h1 className='text-2xl font-bold'>{business.registeredName}</h1>

          <div className='flex items-center gap-3'>
            {business.entity?.name && (
              <div className='flex gap-2 items-center'>
                <span className='text-sm font-medium bg-neutral-100 rounded-full px-3 py-1 capitalize'>
                  {business.entity.name}
                </span>
              </div>
            )}

            {business.ein && (
              <div className='flex gap-2 items-center'>
                <span className='text-[16px]'>
                  EIN: {formatEIN(business.ein)}
                </span>
              </div>
            )}

            {business.establishedDate && (
              <div className='flex gap-2 items-center'>
                <Building2Icon
                  size={18}
                  className='inline-block text-neutral-500'
                />
                <span className='text-[16px] text-neutral-600'>
                  Incorporated{' '}
                  {new Date(business.establishedDate).toLocaleDateString(
                    'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </span>
              </div>
            )}
          </div>

          <div className='flex items-center gap-4 flex-wrap'>
            {business.establishedDate && (
              <div className='flex gap-2 items-center'>
                <ClockIcon size={16} className='inline-block' />
                <span className='text-[15px]'>
                  Anniversary: {getTimeUntilAnniversary(business.establishedDate)}
                </span>
              </div>
            )}

            {linkedAccounts && linkedAccounts.length > 0
              ? linkedAccounts.map((link) => (
                  <div key={link.id} className='flex items-center gap-1'>
                    <button
                      className='flex items-center gap-1.5 text-[15px] text-purple hover:underline'
                      onClick={() => {
                        window.location.href = `/clients/${link.account.id}`;
                      }}
                    >
                      <UserIcon size={15} />
                      <span>{link.account.firstName} {link.account.lastName}</span>
                    </button>
                    <button
                      disabled={removeBusinessAccount.isPending}
                      className='text-neutral-300 hover:text-red-400 transition-colors ml-0.5 disabled:opacity-40'
                      title='Unlink person'
                      onClick={() =>
                        removeBusinessAccount.mutate({
                          businessId: businessIdInt,
                          accountId: link.accountId,
                        })
                      }
                    >
                      <XIcon size={13} />
                    </button>
                  </div>
                ))
              : business.account?.id && (
                  <button
                    className='flex items-center gap-1.5 text-[15px] text-purple hover:underline'
                    onClick={() => {
                      window.location.href = `/clients/${business.account!.id}`;
                    }}
                  >
                    <UserIcon size={15} />
                    <span>
                      {business.account.firstName} {business.account.lastName}
                    </span>
                  </button>
                )}
          </div>
        </div>

        <div className='ml-auto flex flex-col gap-3'>
          <div
            className='flex items-center gap-2 text-purple cursor-pointer'
            onClick={() => setEditBusinessDialogOpen(true)}
          >
            <Edit2Icon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Edit</span>
          </div>

          <div
            className='flex items-center gap-2 text-purple cursor-pointer'
            onClick={() => setAddAccountDialogOpen(true)}
          >
            <LinkIcon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Link Person</span>
          </div>

          <div
            className='text-red-700 flex items-center gap-2 cursor-pointer'
            onClick={() => setDeleteBusinessDialogOpen(true)}
          >
            <TrashIcon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Delete</span>
          </div>
        </div>
      </div>

      <Dialog
        open={addAccountDialogOpen}
        onOpenChange={(open) => {
          setAddAccountDialogOpen(open);
          if (!open) setAccountSearch('');
        }}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Link Account to Business</DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-4 py-2'>
            <input
              type='text'
              placeholder='Search accounts...'
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className='border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple'
            />
            <div className='flex flex-col gap-1 max-h-64 overflow-y-auto'>
              {accountsData?.data.map((acct) => {
                const alreadyLinked = linkedAccounts?.some(
                  (l) => l.accountId === acct.id
                );
                return (
                  <button
                    key={acct.id}
                    disabled={alreadyLinked || addBusinessAccount.isPending}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      alreadyLinked
                        ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                        : 'hover:bg-purple/5 hover:text-purple cursor-pointer'
                    }`}
                    onClick={() => {
                      if (alreadyLinked) return;
                      addBusinessAccount.mutate(
                        {
                          businessId: businessIdInt,
                          accountId: acct.id,
                          createdBy: session?.user?.name ?? 'unknown',
                        },
                        {
                          onSuccess: () => setAddAccountDialogOpen(false),
                        }
                      );
                    }}
                  >
                    <span>
                      {acct.firstName} {acct.lastName}
                    </span>
                    {alreadyLinked && (
                      <span className='text-xs text-neutral-400'>Linked</span>
                    )}
                  </button>
                );
              })}
              {accountsData?.data.length === 0 && (
                <p className='text-sm text-neutral-500 text-center py-4'>
                  No accounts found
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setAddAccountDialogOpen(false)}
              className='cursor-pointer'
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateNoteDialog
        open={createNoteDialogOpen}
        onOpenChange={setCreateNoteDialogOpen}
        businessId={businessIdInt}
      />
      <NoteDetailDialog
        open={noteDetailDialogOpen}
        onOpenChange={handleNoteDetailDialogClose}
        note={selectedNote}
      />
      <EditBusinessDialog
        open={editBusinessDialogOpen}
        onOpenChange={setEditBusinessDialogOpen}
        accountId={accountId}
        business={business}
      />
      <DeleteBusinessDialog
        open={deleteBusinessDialogOpen}
        onOpenChange={setDeleteBusinessDialogOpen}
        accountId={accountId}
        business={business}
      />
      <LogTouchpointDialog
        open={logTouchpointDialogOpen}
        onOpenChange={setLogTouchpointDialogOpen}
        accountId={accountId}
        businessId={businessIdInt}
      />
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        businessId={businessIdInt}
      />

      <Tabs defaultValue='notes' className='w-full'>
        <TabsList className='mb-5 py-7 px-2 gap-2 w-full'>
          <TabsTrigger className='py-5 cursor-pointer' value='notes'>
            Notes
          </TabsTrigger>
          <TabsTrigger className='py-5 cursor-pointer' value='tasks'>
            Tasks
          </TabsTrigger>
          <TabsTrigger className='py-5 cursor-pointer' value='touchpoints'>
            Touchpoints
          </TabsTrigger>
          <TabsTrigger className='py-5 cursor-pointer' value='overview'>
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value='notes'>
          <div className='bg-white border rounded-xl p-6.5'>
            <div className='flex items-center gap-6 justify-between mb-4'>
              <div className='flex items-center gap-4 w-full'>
                <div className='relative w-full'>
                  <SearchIcon
                    className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                    size={18}
                  />
                  <input
                    type='text'
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder='Search notes...'
                    className='pl-10 pr-3 py-3 rounded-lg border text-sm w-full'
                  />
                </div>
              </div>
              <Button
                className='bg-purple cursor-pointer'
                onClick={() => setCreateNoteDialogOpen(true)}
              >
                <span>Add Note</span>
                <PlusIcon />
              </Button>
            </div>

            <div className='mb-6'>
              <DatePresetPills
                preset={notesPreset}
                onChange={handleNotesPresetChange}
                customFrom={notesCustomFrom}
                customTo={notesCustomTo}
                onCustomFromChange={setNotesCustomFrom}
                onCustomToChange={setNotesCustomTo}
              />
            </div>

            {notesLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-5 h-5 animate-spin text-purple' />
                <span className='ml-2 text-neutral-600 text-sm'>
                  Loading notes...
                </span>
              </div>
            ) : (
              <>
                {notesData?.notes.length === 0 && notesSearchQuery ? (
                  <div className='text-center py-12 text-neutral-500'>
                    <p>
                      No notes found matching &quot;{notesSearchQuery}&quot;
                    </p>
                  </div>
                ) : notesData?.notes.length === 0 ? (
                  <div className='text-center py-12 text-neutral-500'>
                    <p>No notes found{notesPreset !== 'all' ? ' for this period' : ''}</p>
                  </div>
                ) : (
                  <>
                    <NotesGrid
                      notes={notesData?.notes || []}
                      onNoteClick={handleNoteClick}
                    />
                    {notesData?.hasMore && (
                      <div className='flex justify-center mt-6'>
                        <Button
                          variant='outline'
                          onClick={handleShowMore}
                          className='cursor-pointer'
                        >
                          Show More
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value='tasks'>
          <div className='bg-white border rounded-xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>Tasks</h3>
              <Button
                className='bg-purple cursor-pointer'
                onClick={() => setCreateTaskDialogOpen(true)}
              >
                <span>New Task</span>
                <PlusIcon />
              </Button>
            </div>

            <div className='mb-6'>
              <DatePresetPills
                preset={tasksPreset}
                onChange={setTasksPreset}
                customFrom={tasksCustomFrom}
                customTo={tasksCustomTo}
                onCustomFromChange={setTasksCustomFrom}
                onCustomToChange={setTasksCustomTo}
              />
            </div>

            <TasksList
              businessId={businessIdInt}
              {...tasksDateRange}
            />
          </div>
        </TabsContent>

        <TabsContent value='touchpoints'>
          <div className='bg-white border rounded-xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>Touchpoints</h3>
              <Button
                className='bg-purple cursor-pointer'
                onClick={() => setLogTouchpointDialogOpen(true)}
              >
                <span>Log Touchpoint</span>
                <PlusIcon />
              </Button>
            </div>

            <div className='mb-6'>
              <DatePresetPills
                preset={touchpointsPreset}
                onChange={setTouchpointsPreset}
                customFrom={touchpointsCustomFrom}
                customTo={touchpointsCustomTo}
                onCustomFromChange={setTouchpointsCustomFrom}
                onCustomToChange={setTouchpointsCustomTo}
              />
            </div>

            {touchpointsLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-5 h-5 animate-spin text-purple' />
                <span className='ml-2 text-neutral-600 text-sm'>
                  Loading touchpoints...
                </span>
              </div>
            ) : touchpoints && touchpoints.touchpoints.length > 0 ? (
              <div className='flex flex-col gap-4'>
                {touchpoints.touchpoints.map((touchpoint) => (
                  <div
                    key={touchpoint.id}
                    className='border rounded-lg p-5 flex flex-col gap-3 hover:border-purple/50 transition-colors'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center text-purple'>
                          {touchpoint.typeIcon === 'Phone' && <PhoneIcon size={18} />}
                          {touchpoint.typeIcon === 'User' && <UserIcon size={18} />}
                          {touchpoint.typeIcon === 'Calendar' && <CalendarIcon size={18} />}
                          {touchpoint.typeIcon === 'Mail' && <MailIcon size={18} />}
                        </div>
                        <div>
                          <h4 className='font-semibold text-[16px]'>{touchpoint.typeName}</h4>
                          {touchpoint.serviceName && (
                            <p className='text-sm text-neutral-500'>
                              Service: {touchpoint.serviceName}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className='text-sm text-neutral-500'>
                        {new Date(touchpoint.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className='text-[15px] text-neutral-700'>{touchpoint.title}</p>
                    <div className='flex items-center gap-2 text-xs text-neutral-500'>
                      <UserIcon size={12} />
                      <span>Logged by {touchpoint.createdBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12 text-neutral-500'>
                <p>No touchpoints{touchpointsPreset !== 'all' ? ' for this period' : ' recorded'}</p>
                {touchpointsPreset === 'all' && (
                  <p className='text-sm mt-2'>
                    Click &quot;Log Touchpoint&quot; to add the first interaction
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value='overview'>
          <div className='bg-white border rounded-xl p-6 flex flex-col gap-6'>
            <h3 className='text-lg font-semibold'>Business Details</h3>
            <div className='grid grid-cols-2 gap-6'>
              <div>
                <label className='text-sm text-neutral-500'>
                  Registered Name
                </label>
                <p className='font-medium text-[15px]'>
                  {business.registeredName}
                </p>
              </div>

              {business.account?.id && (
                <div>
                  <label className='text-sm text-neutral-500'>Primary Owner</label>
                  <button
                    className='block font-medium text-[15px] text-purple hover:underline text-left'
                    onClick={() => {
                      window.location.href = `/clients/${business.account!.id}`;
                    }}
                  >
                    {business.account.firstName} {business.account.lastName}
                  </button>
                </div>
              )}

              {business.entity?.name && (
                <div>
                  <label className='text-sm text-neutral-500'>
                    Entity Type
                  </label>
                  <p className='font-medium text-[15px] capitalize'>
                    {business.entity.name}
                  </p>
                </div>
              )}

              {business.ein && (
                <div>
                  <label className='text-sm text-neutral-500'>EIN</label>
                  <p className='font-medium text-[15px]'>
                    {formatEIN(business.ein)}
                  </p>
                </div>
              )}

              {business.address && (
                <div>
                  <label className='text-sm text-neutral-500'>
                    Address Line
                  </label>
                  <p className='font-medium text-[15px]'>{business.address}</p>
                </div>
              )}

              {business.city && (
                <div>
                  <label className='text-sm text-neutral-500'>City</label>
                  <p className='font-medium text-[15px]'>{business.city}</p>
                </div>
              )}

              {business.state && (
                <div>
                  <label className='text-sm text-neutral-500'>State</label>
                  <p className='font-medium text-[15px]'>{business.state}</p>
                </div>
              )}

              {business.zipCode && (
                <div>
                  <label className='text-sm text-neutral-500'>Zip Code</label>
                  <p className='font-medium text-[15px]'>{business.zipCode}</p>
                </div>
              )}

              {business.establishedDate && (
                <div>
                  <label className='text-sm text-neutral-500'>
                    Established Date
                  </label>
                  <p className='font-medium text-[15px]'>
                    {new Date(business.establishedDate).toLocaleDateString(
                      'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                </div>
              )}

              <div>
                <label className='text-sm text-neutral-500'>Created At</label>
                <p className='font-medium text-[15px]'>
                  {new Date(business.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className='text-sm text-neutral-500'>Created By</label>
                <p className='font-medium text-[15px]'>{business.createdBy}</p>
              </div>

              {business.updatedAt && (
                <div>
                  <label className='text-sm text-neutral-500'>Updated At</label>
                  <p className='font-medium text-[15px]'>
                    {new Date(business.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {business.updatedBy && (
                <div>
                  <label className='text-sm text-neutral-500'>Updated By</label>
                  <p className='font-medium text-[15px]'>
                    {business.updatedBy}
                  </p>
                </div>
              )}
            </div>

            <div className='border-t pt-6'>
              <div className='flex items-center justify-between mb-4'>
                <h4 className='text-base font-semibold'>Associated Accounts</h4>
                <Button
                  variant='outline'
                  size='sm'
                  className='cursor-pointer'
                  onClick={() => setAddAccountDialogOpen(true)}
                >
                  <LinkIcon size={14} />
                  <span>Link Account</span>
                </Button>
              </div>

              {linkedAccountsLoading ? (
                <div className='flex items-center gap-2 text-neutral-500 text-sm py-2'>
                  <Loader2 size={14} className='animate-spin' />
                  <span>Loading accounts...</span>
                </div>
              ) : linkedAccounts && linkedAccounts.length > 0 ? (
                <div className='flex flex-col gap-2'>
                  {linkedAccounts.map((link) => {
                    const isPrimary = link.accountId === parseInt(business.accountId?.toString() ?? '');
                    return (
                      <div
                        key={link.id}
                        className='flex items-center justify-between rounded-lg border px-4 py-3'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-full bg-purple/10 flex items-center justify-center text-purple'>
                            <UserIcon size={15} />
                          </div>
                          <div>
                            <button
                              className='font-medium text-[15px] text-purple hover:underline'
                              onClick={() => {
                                window.location.href = `/clients/${link.account.id}`;
                              }}
                            >
                              {link.account.firstName} {link.account.lastName}
                            </button>
                            {isPrimary && (
                              <span className='ml-2 text-xs bg-purple/10 text-purple rounded-full px-2 py-0.5'>
                                Primary Owner
                              </span>
                            )}
                          </div>
                        </div>
                        {!isPrimary && (
                          <button
                            className='text-neutral-400 hover:text-red-500 transition-colors'
                            title='Remove association'
                            onClick={() =>
                              removeBusinessAccount.mutate({
                                businessId: businessIdInt,
                                accountId: link.accountId,
                              })
                            }
                          >
                            <XIcon size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className='text-sm text-neutral-500'>No accounts linked yet.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
