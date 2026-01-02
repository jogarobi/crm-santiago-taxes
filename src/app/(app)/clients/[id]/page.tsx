'use client';

import { use, useState } from 'react';

function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(
      7
    )}`;
  }

  return phoneNumber;
}
import { useAccount } from '@/hooks/use-accounts';
import { useActivities } from '@/hooks/use-activities';
import { useAccountContacts } from '@/hooks/use-account-contact';
import { useAccountRelationships } from '@/hooks/use-account-relationships';
import { useNotes } from '@/hooks/use-notes';
import {
  Building2Icon,
  ClockIcon,
  Edit2Icon,
  IdCardIcon,
  Loader2,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UserIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DynamicIcon, IconName } from '@/components/DynamicIcon';
import { NotesGrid } from '@/components/NotesGrid';
import { CreateNoteDialog } from '@/components/CreateNoteDialog';
import { NoteDetailDialog } from '@/components/NoteDetailDialog';
import clsx from 'clsx';
import type { Note } from '@/lib/types/note';

type Props = {
  params: Promise<{ id: string }>;
};

export default function AccountDetailPage({ params }: Props) {
  const { id } = use(params);
  const accountId = parseInt(id);
  const { data: account, isLoading, error } = useAccount(accountId);
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useActivities(accountId, 20);
  const { data: contacts } = useAccountContacts(accountId);
  const { data: relationships } = useAccountRelationships(accountId);
  const [createNoteDialogOpen, setCreateNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteDetailDialogOpen, setNoteDetailDialogOpen] = useState(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [notesLimit, setNotesLimit] = useState(4);

  const { data: notesData, isLoading: notesLoading } = useNotes(accountId, {
    search: notesSearchQuery || undefined,
    limit: notesLimit,
    offset: 0,
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

  const primaryContact = contacts?.[0];
  const hasPhone = primaryContact?.phoneNumber;
  const hasEmail = primaryContact?.email;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='animate-spin' />
        <span className='ml-2'>Loading account...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8'>
        <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
          <p className='text-red-800'>Error loading account: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className='p-8'>
        <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
          <p className='text-yellow-800'>Account not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-8 pt-3'>
      <div className='flex items-center gap-8 bg-white border rounded-xl p-8'>
        <div className='text-3xl font-semibold h-20 w-20 rounded-full bg-purple text-white flex items-center justify-center'>
          {account.firstName[0] + account.lastName[0]}
        </div>

        <div className='flex flex-col gap-3'>
          <h1 className='text-2xl font-bold'>
            {account.firstName} {account.lastName}
          </h1>

          <div className='flex items-center gap-8'>
            <div className='flex gap-2 items-center'>
              <PhoneIcon size={16} className='inline-block' />
              <span
                className={clsx('text-[16px]', {
                  'text-neutral-500': !hasPhone,
                })}
              >
                {hasPhone ? formatPhoneNumber(hasPhone) : 'Not available'}
              </span>
            </div>
            <div className='flex gap-2 items-center'>
              <MailIcon size={16} className='inline-block' />
              <span
                className={clsx('text-[16px]', {
                  'text-neutral-500': !hasEmail,
                })}
              >
                {hasEmail || 'Not available'}
              </span>
            </div>

            {account.ssnLastFour && (
              <div className='flex gap-2 items-center'>
                <IdCardIcon size={18} className='inline-block' />
                <span className='text-[16px]'>{account.ssnLastFour}</span>
              </div>
            )}

            <div className='flex gap-2 items-center'>
              <Building2Icon size={18} className='inline-block' />
              <span className='text-[16px] text-neutral-500'>
                No business associated
              </span>
            </div>
          </div>

          <div className='flex gap-2 items-center pt-1'>
            <ClockIcon size={16} className='inline-block' />
            <span className='text-[15px]'>
              Last interaction on {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        <div className='ml-auto flex flex-col gap-3'>
          <div className='flex items-center gap-2 text-purple'>
            <Edit2Icon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Edit</span>
          </div>

          <div className='text-red-700 flex items-center gap-2'>
            <TrashIcon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Delete</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue='notes' className='w-full'>
        <TabsList className='mb-5 py-7 px-2 gap-2 w-full'>
          <TabsTrigger className='py-5 cursor-pointer' value='notes'>
            Notes
          </TabsTrigger>
          <TabsTrigger
            className='py-5 cursor-pointer'
            value='activity-overview'
          >
            Overview & History
          </TabsTrigger>
          <TabsTrigger className='py-5 cursor-pointer' value='businesses'>
            Businesses
          </TabsTrigger>
          <TabsTrigger className='py-5 cursor-pointer' value='tasks'>
            Tasks
          </TabsTrigger>
          <TabsTrigger className='py-5 cursor-pointer' value='appointments'>
            Appointments
          </TabsTrigger>
          <TabsTrigger className='py-5 cursor-pointer' value='relationships'>
            Relationships
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

          <CreateNoteDialog
            open={createNoteDialogOpen}
            onOpenChange={setCreateNoteDialogOpen}
            accountId={accountId}
          />
          <NoteDetailDialog
            open={noteDetailDialogOpen}
            onOpenChange={handleNoteDetailDialogClose}
            note={selectedNote}
          />
        </TabsContent>

        <TabsContent value='activity-overview' className='flex gap-8'>
          <div className='bg-white border rounded-xl p-6 flex-2 flex flex-col gap-6'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold'>History</h3>
              <div className='flex items-center gap-4'>
                <Button variant='outline'>
                  <span>Search</span>
                  <SearchIcon />
                </Button>
                <Button className='bg-purple'>
                  <span>New</span>
                  <PlusIcon />
                </Button>
              </div>
            </div>
            <div className='flex flex-col gap-0'>
              {activitiesLoading && (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='w-5 h-5 animate-spin text-purple' />
                  <span className='ml-2 text-neutral-600 text-sm'>
                    Loading...
                  </span>
                </div>
              )}

              {activitiesError && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                  <p className='text-red-800 text-sm'>
                    Failed to load activities
                  </p>
                </div>
              )}

              {!activitiesLoading &&
                !activitiesError &&
                activities &&
                activities.length === 0 && (
                  <div className='py-8 text-center text-neutral-500'>
                    <p>No activities yet</p>
                  </div>
                )}

              {!activitiesLoading &&
                !activitiesError &&
                activities &&
                activities.map((activity, index) => (
                  <div key={activity.id} className='flex gap-4'>
                    <div className='flex flex-col items-center'>
                      <div className='w-2 h-2 rounded-full bg-neutral-300 my-2'></div>
                      {index < activities.length - 1 && (
                        <div className='w-px flex-1 bg-neutral-200 min-h-[60px]'></div>
                      )}
                    </div>
                    <div className='flex-1 pb-6'>
                      <div className='flex flex-col gap-3 p-2 rounded-lg'>
                        <p className='font-medium'>{activity.title}</p>
                        <div className='flex items-center gap-4 flex-wrap'>
                          {activity.typeIcon && activity.typeName && (
                            <div className='flex items-center gap-1.5 text-purple'>
                              <DynamicIcon
                                name={activity.typeIcon as IconName}
                                size={16}
                                strokeWidth={2.3}
                              />
                              <span className='text-[15px] font-semibold'>
                                {activity.typeName}
                              </span>
                            </div>
                          )}
                          <div className='flex items-center gap-1 text-neutral-500'>
                            <UserIcon size={15} strokeWidth={2.3} />
                            <span className='text-[15px]'>
                              {activity.createdBy}
                            </span>
                          </div>
                          <div className='flex items-center gap-1 text-neutral-500'>
                            <ClockIcon size={15} strokeWidth={2.5} />
                            <span className='text-[15px]'>
                              {new Date(activity.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className='bg-white border rounded-xl flex-1 p-6 w-full flex flex-col gap-6'>
            <h3 className='text-lg font-semibold'>Overview</h3>
            <div className='grid grid-cols-2 gap-6'>
              {account.address && (
                <div>
                  <div className='text-sm text-neutral-500 flex items-center gap-1 mb-1'>
                    <span>Address Line</span>
                  </div>
                  <p className='font-medium text-[15px]'>{account.address}</p>
                </div>
              )}

              {account.city && (
                <div>
                  <label className='text-sm text-neutral-500'>City</label>
                  <p className='font-medium text-[15px]'>{account.city}</p>
                </div>
              )}

              {account.state && (
                <div>
                  <label className='text-sm text-neutral-500'>State</label>
                  <p className='font-medium text-[15px]'>{account.state}</p>
                </div>
              )}

              {account.zipCode && (
                <div>
                  <label className='text-sm text-neutral-500'>Zip Code</label>
                  <p className='font-medium text-[15px]'>{account.zipCode}</p>
                </div>
              )}

              {account.ssnLastFour && (
                <div>
                  <label className='text-sm text-neutral-500'>
                    SSN (Last 4)
                  </label>
                  <p className='font-medium text-[15px]'>
                    {account.ssnLastFour}
                  </p>
                </div>
              )}

              {hasEmail && (
                <div>
                  <label className='text-sm text-neutral-500'>Email</label>
                  <p className='font-medium text-[15px]'>{hasEmail}</p>
                </div>
              )}

              {hasPhone && (
                <div>
                  <label className='text-sm text-neutral-500'>
                    Phone Number
                  </label>
                  <p className='font-medium text-[15px]'>
                    {formatPhoneNumber(hasPhone)}
                  </p>
                </div>
              )}

              <div>
                <label className='text-sm text-neutral-500'>
                  Date of Birth
                </label>
                <p className='font-medium text-[15px]'>{account.dateOfBirth}</p>
              </div>

              <div>
                <label className='text-sm text-neutral-500'>Created At</label>
                <p className='font-medium text-[15px]'>
                  {new Date(account.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className='text-sm text-neutral-500'>Created By</label>
                <p className='font-medium text-[15px]'>{account.createdBy}</p>
              </div>

              {account.updatedAt && (
                <div>
                  <label className='text-sm text-neutral-500'>Updated At</label>
                  <p className='font-medium text-[15px]'>
                    {new Date(account.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {account.updatedBy && (
                <div>
                  <label className='text-sm text-neutral-500'>Updated By</label>
                  <p className='font-medium text-[15px]'>{account.updatedBy}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value='documents'>
          <div className='bg-white border rounded-xl p-6'>
            <p className='text-neutral-500'>Documents content coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value='appointments'>
          <div className='bg-white border rounded-xl p-6'>
            <p className='text-neutral-500'>
              Appointments content coming soon...
            </p>
          </div>
        </TabsContent>

        <TabsContent value='businesses'>
          <div className='bg-white border rounded-xl p-6'>
            <p className='text-neutral-500'>
              Businesses content coming soon...
            </p>
          </div>
        </TabsContent>

        <TabsContent value='relationships'>
          <div className='bg-white border rounded-xl p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Relationships</h3>
              <Button className='bg-purple'>
                <span>Add Relationship</span>
                <PlusIcon />
              </Button>
            </div>

            {relationships && relationships.length > 0 ? (
              <div className='space-y-4'>
                {relationships.map((relationship) => (
                  <div
                    key={relationship.id}
                    className='border rounded-lg p-4 flex items-center justify-between'
                  >
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-center gap-3'>
                        <div className='text-lg font-medium h-10 w-10 rounded-full bg-purple text-white flex items-center justify-center'>
                          {relationship.relatedAccount?.firstName[0]}
                          {relationship.relatedAccount?.lastName[0]}
                        </div>
                        <div>
                          <p className='font-semibold'>
                            {relationship.relatedAccount?.firstName}{' '}
                            {relationship.relatedAccount?.lastName}
                          </p>
                          <p className='text-sm text-neutral-500 capitalize'>
                            {relationship.relationship}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant='outline' size='sm'>
                        <Edit2Icon size={14} />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-red-600 hover:text-red-700'
                      >
                        <TrashIcon size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-neutral-500'>
                <p className='mb-2'>No relationships found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
