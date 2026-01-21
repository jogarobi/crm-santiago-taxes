'use client';

import { use, useState } from 'react';
import { useBusiness } from '@/hooks/use-businesses';
import { useNotes } from '@/hooks/use-notes';
import { useTouchpoints } from '@/hooks/use-touchpoints';
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
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { NotesGrid } from '@/components/NotesGrid';
import { CreateNoteDialog } from '@/components/CreateNoteDialog';
import { NoteDetailDialog } from '@/components/NoteDetailDialog';
import { EditBusinessDialog } from '@/components/EditBusinessDialog';
import { DeleteBusinessDialog } from '@/components/DeleteBusinessDialog';
import { LogTouchpointDialog } from '@/components/LogTouchpointDialog';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { TasksList } from '@/components/TasksList';
import type { Note } from '@/lib/types/note';

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

  // Get this year's anniversary
  let nextAnniversary = new Date(
    today.getFullYear(),
    established.getMonth(),
    established.getDate()
  );

  // If this year's anniversary has passed, use next year's
  if (nextAnniversary < today) {
    nextAnniversary = new Date(
      today.getFullYear() + 1,
      established.getMonth(),
      established.getDate()
    );
  }

  // Calculate months difference
  const monthsDiff =
    (nextAnniversary.getFullYear() - today.getFullYear()) * 12 +
    (nextAnniversary.getMonth() - today.getMonth());

  // Calculate days remaining after full months
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

  const {
    data: business,
    isLoading,
    error,
  } = useBusiness(accountId, businessIdInt);
  const [createNoteDialogOpen, setCreateNoteDialogOpen] = useState(false);
  const [editBusinessDialogOpen, setEditBusinessDialogOpen] = useState(false);
  const [deleteBusinessDialogOpen, setDeleteBusinessDialogOpen] =
    useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteDetailDialogOpen, setNoteDetailDialogOpen] = useState(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [notesLimit, setNotesLimit] = useState(4);
  const [logTouchpointDialogOpen, setLogTouchpointDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  const { data: notesData, isLoading: notesLoading } = useNotes(null, {
    search: notesSearchQuery || undefined,
    limit: notesLimit,
    offset: 0,
    businessId: businessIdInt,
  });

  const { data: touchpoints, isLoading: touchpointsLoading } = useTouchpoints({ accountId, businessId: businessIdInt });

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
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </span>
              </div>
            )}
          </div>

          {business.establishedDate && (
            <div className='flex gap-2 items-center pt-1'>
              <ClockIcon size={16} className='inline-block' />
              <span className='text-[15px]'>
                Anniversary: {getTimeUntilAnniversary(business.establishedDate)}
              </span>
            </div>
          )}
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
            className='text-red-700 flex items-center gap-2 cursor-pointer'
            onClick={() => setDeleteBusinessDialogOpen(true)}
          >
            <TrashIcon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Delete</span>
          </div>
        </div>
      </div>

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
            <div className='flex items-center gap-6 justify-between mb-7'>
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
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Tasks</h3>
              <Button
                className='bg-purple cursor-pointer'
                onClick={() => setCreateTaskDialogOpen(true)}
              >
                <span>New Task</span>
                <PlusIcon />
              </Button>
            </div>

            <TasksList businessId={businessIdInt} />
          </div>
        </TabsContent>

        <TabsContent value='touchpoints'>
          <div className='bg-white border rounded-xl p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Touchpoints</h3>
              <Button
                className='bg-purple cursor-pointer'
                onClick={() => setLogTouchpointDialogOpen(true)}
              >
                <span>Log Touchpoint</span>
                <PlusIcon />
              </Button>
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
                <p>No touchpoints recorded</p>
                <p className='text-sm mt-2'>
                  Click &quot;Log Touchpoint&quot; to add the first interaction
                </p>
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
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
