'use client';

import { use, useState } from 'react';

function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
    )}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(
      7,
    )}`;
  }

  return phoneNumber;
}

function getTimeUntilAnniversary(establishedDate: string): string {
  const established = new Date(establishedDate);
  const today = new Date();

  // Get this year's anniversary
  let nextAnniversary = new Date(
    today.getFullYear(),
    established.getMonth(),
    established.getDate(),
  );

  // If this year's anniversary has passed, use next year's
  if (nextAnniversary < today) {
    nextAnniversary = new Date(
      today.getFullYear() + 1,
      established.getMonth(),
      established.getDate(),
    );
  }

  // Calculate months difference
  const monthsDiff =
    (nextAnniversary.getFullYear() - today.getFullYear()) * 12 +
    (nextAnniversary.getMonth() - today.getMonth());

  // Calculate days remaining after full months
  const daysDiff =
    Math.floor(
      (nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
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
import { useAccount } from '@/hooks/use-accounts';
import { useAccountContacts } from '@/hooks/use-account-contact';
import { useAccountRelationships } from '@/hooks/use-account-relationships';
import { useNotes } from '@/hooks/use-notes';
import { useBusinesses } from '@/hooks/use-businesses';
import { useAppointments } from '@/hooks/use-appointments';
import { useTouchpoints } from '@/hooks/use-touchpoints';
import {
  Building2Icon,
  CalendarIcon,
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
import { Badge } from '@/components/ui/badge';
import { capitalizeFirst, getRelativeDate } from '@/lib/utils/string';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { NotesGrid } from '@/components/NotesGrid';
import { CreateNoteDialog } from '@/components/CreateNoteDialog';
import { NoteDetailDialog } from '@/components/NoteDetailDialog';
import { CreateBusinessDialog } from '@/components/CreateBusinessDialog';
import { EditBusinessDialog } from '@/components/EditBusinessDialog';
import { DeleteBusinessDialog } from '@/components/DeleteBusinessDialog';
import { EditClientDialog } from '@/components/EditClientDialog';
import { DeleteClientDialog } from '@/components/DeleteClientDialog';
import { ManageContactsDialog } from '@/components/ManageContactsDialog';
import { AddRelationshipDialog } from '@/components/AddRelationshipDialog';
import { EditRelationshipDialog } from '@/components/EditRelationshipDialog';
import { DeleteRelationshipDialog } from '@/components/DeleteRelationshipDialog';
import { CancelAppointmentDialog } from '@/components/CancelAppointmentDialog';
import { LogTouchpointDialog } from '@/components/LogTouchpointDialog';
import clsx from 'clsx';
import type { Note } from '@/lib/types/note';
import type { Business } from '@/lib/types/business';
import type { AccountRelationship } from '@/lib/types/account-relationship';
import type { Appointment } from '@/lib/types/appointment';

type Props = {
  params: Promise<{ id: string }>;
};

export default function AccountDetailPage({ params }: Props) {
  const { id } = use(params);
  const accountId = parseInt(id);
  const { data: account, isLoading, error } = useAccount(accountId);
  const { data: contacts } = useAccountContacts(accountId);
  const { data: relationships } = useAccountRelationships(accountId);
  const { data: businesses, isLoading: businessesLoading } =
    useBusinesses(accountId);
  const [createNoteDialogOpen, setCreateNoteDialogOpen] = useState(false);
  const [createBusinessDialogOpen, setCreateBusinessDialogOpen] =
    useState(false);
  const [editBusinessDialogOpen, setEditBusinessDialogOpen] = useState(false);
  const [deleteBusinessDialogOpen, setDeleteBusinessDialogOpen] =
    useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteDetailDialogOpen, setNoteDetailDialogOpen] = useState(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [notesLimit, setNotesLimit] = useState(4);
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false);
  const [deleteClientDialogOpen, setDeleteClientDialogOpen] = useState(false);
  const [manageContactsDialogOpen, setManageContactsDialogOpen] =
    useState(false);
  const [addRelationshipDialogOpen, setAddRelationshipDialogOpen] =
    useState(false);
  const [editRelationshipDialogOpen, setEditRelationshipDialogOpen] =
    useState(false);
  const [deleteRelationshipDialogOpen, setDeleteRelationshipDialogOpen] =
    useState(false);
  const [selectedRelationship, setSelectedRelationship] =
    useState<AccountRelationship | null>(null);
  const [cancelAppointmentDialogOpen, setCancelAppointmentDialogOpen] =
    useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [logTouchpointDialogOpen, setLogTouchpointDialogOpen] = useState(false);

  const { data: notesData, isLoading: notesLoading } = useNotes(accountId, {
    search: notesSearchQuery || undefined,
    limit: notesLimit,
    offset: 0,
  });

  const { data: appointments, isLoading: appointmentsLoading } =
    useAppointments({
      accountId: accountId,
    });

  const { data: touchpoints, isLoading: touchpointsLoading } = useTouchpoints({
    accountId,
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

  // Get the most recent phone and email from contacts
  const hasPhone = contacts
    ?.filter((c) => c.phoneNumber)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]?.phoneNumber;
  const hasEmail = contacts
    ?.filter((c) => c.email)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]?.email;

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
              <span
                className={clsx('text-[16px]', {
                  'text-neutral-500': !businesses || businesses.length === 0,
                })}
              >
                {businesses && businesses.length > 0
                  ? `${businesses.length} ${
                      businesses.length === 1 ? 'business' : 'businesses'
                    }`
                  : 'No business associated'}
              </span>
            </div>
          </div>

          <div>
            <ClockIcon size={16} className='inline-block mr-1' />
            <p>Last touchpoint on {lastTouchpointDate}</p>
          </div>
        </div>

        <div className='ml-auto flex flex-col gap-3'>
          <div
            className='flex items-center gap-2 text-purple cursor-pointer'
            onClick={() => setEditClientDialogOpen(true)}
          >
            <Edit2Icon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Edit</span>
          </div>

          <div
            className='flex items-center gap-2 text-purple cursor-pointer'
            onClick={() => setManageContactsDialogOpen(true)}
          >
            <PhoneIcon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Manage Contacts</span>
          </div>

          <div
            className='text-red-700 flex items-center gap-2 cursor-pointer'
            onClick={() => setDeleteClientDialogOpen(true)}
          >
            <TrashIcon size={15} strokeWidth={2.4} />
            <span className='text-[15px] font-medium'>Delete</span>
          </div>
        </div>
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
      <CreateBusinessDialog
        open={createBusinessDialogOpen}
        onOpenChange={setCreateBusinessDialogOpen}
        accountId={accountId}
      />
      <EditBusinessDialog
        open={editBusinessDialogOpen}
        onOpenChange={setEditBusinessDialogOpen}
        accountId={accountId}
        business={selectedBusiness}
      />
      <DeleteBusinessDialog
        open={deleteBusinessDialogOpen}
        onOpenChange={setDeleteBusinessDialogOpen}
        accountId={accountId}
        business={selectedBusiness}
      />
      <EditClientDialog
        open={editClientDialogOpen}
        onOpenChange={setEditClientDialogOpen}
        account={account}
      />
      <DeleteClientDialog
        open={deleteClientDialogOpen}
        onOpenChange={setDeleteClientDialogOpen}
        account={account}
      />
      <ManageContactsDialog
        open={manageContactsDialogOpen}
        onOpenChange={setManageContactsDialogOpen}
        accountId={accountId}
      />
      <AddRelationshipDialog
        open={addRelationshipDialogOpen}
        onOpenChange={setAddRelationshipDialogOpen}
        accountId={accountId}
      />
      <EditRelationshipDialog
        open={editRelationshipDialogOpen}
        onOpenChange={setEditRelationshipDialogOpen}
        accountId={accountId}
        relationship={selectedRelationship}
      />
      <DeleteRelationshipDialog
        open={deleteRelationshipDialogOpen}
        onOpenChange={setDeleteRelationshipDialogOpen}
        accountId={accountId}
        relationship={selectedRelationship}
      />
      <CancelAppointmentDialog
        open={cancelAppointmentDialogOpen}
        onOpenChange={setCancelAppointmentDialogOpen}
        appointment={selectedAppointment}
      />
      <LogTouchpointDialog
        open={logTouchpointDialogOpen}
        onOpenChange={setLogTouchpointDialogOpen}
        accountId={accountId}
      />

      <Tabs defaultValue='notes' className='w-full'>
        <TabsList className='mb-5 py-7 px-2 gap-2 w-full'>
          <TabsTrigger className='py-5 cursor-pointer' value='touchpoints'>
            Touchpoints
          </TabsTrigger>
          <TabsTrigger className='py-5 cursor-pointer' value='notes'>
            Notes
          </TabsTrigger>
          <TabsTrigger
            className='py-5 cursor-pointer'
            value='activity-overview'
          >
            Overview
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
        </TabsContent>

        <TabsContent value='activity-overview' className='flex gap-8'>
          <div className='bg-white border rounded-xl flex-1 p-6 flex flex-col gap-6'>
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

        <TabsContent value='appointments'>
          <div className='bg-white border rounded-xl p-6'>
            <h3 className='text-lg font-semibold mb-6'>Appointments</h3>
            {appointmentsLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-5 h-5 animate-spin text-purple' />
                <span className='ml-2 text-neutral-600 text-sm'>
                  Loading appointments...
                </span>
              </div>
            ) : appointments && appointments.length > 0 ? (
              <div className='flex flex-col gap-4'>
                {appointments.map((appointment) => {
                  const startDate = appointment.startAt
                    ? new Date(appointment.startAt)
                    : null;
                  const endDate = appointment.endAt
                    ? new Date(appointment.endAt)
                    : null;
                  const relativeDate = appointment.startAt
                    ? getRelativeDate(appointment.startAt)
                    : '';

                  return (
                    <div
                      key={appointment.id}
                      className='border rounded-lg p-5 flex flex-col gap-5 hover:border-purple/50 transition-colors'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          {appointment.status && (
                            <Badge
                              variant='secondary'
                              className={clsx('text-[13px] font-medium w-fit', {
                                'bg-green-100 text-green-700':
                                  appointment.status === 'ACCEPTED',
                                'bg-yellow-100 text-yellow-700':
                                  appointment.status === 'PENDING',
                                'bg-red-100 text-red-700':
                                  appointment.status ===
                                    'CANCELLED_BY_CUSTOMER' ||
                                  appointment.status ===
                                    'CANCELLED_BY_SELLER' ||
                                  appointment.status === 'DECLINED',
                                'bg-gray-100 text-gray-700':
                                  appointment.status === 'NO_SHOW',
                                'bg-blue-100 text-blue-700':
                                  appointment.status !== 'ACCEPTED' &&
                                  appointment.status !== 'PENDING' &&
                                  appointment.status !==
                                    'CANCELLED_BY_CUSTOMER' &&
                                  appointment.status !==
                                    'CANCELLED_BY_SELLER' &&
                                  appointment.status !== 'DECLINED' &&
                                  appointment.status !== 'NO_SHOW',
                              })}
                            >
                              {capitalizeFirst(
                                appointment.status.replace(/_/g, ' '),
                              )}
                            </Badge>
                          )}
                          {appointment.service && (
                            <h4 className='font-semibold text-[16px]'>
                              {appointment.service}
                            </h4>
                          )}
                        </div>
                        {appointment.status !== 'CANCELLED_BY_CUSTOMER' &&
                          appointment.status !== 'CANCELLED_BY_SELLER' && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='text-red-600 hover:text-red-700 cursor-pointer'
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setCancelAppointmentDialogOpen(true);
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                      </div>

                      <div className='flex items-center gap-4'>
                        <div className='flex items-center gap-3'>
                          <CalendarIcon className='w-5 h-5 text-neutral-500' />
                          <div className='flex flex-col'>
                            <span className='text-sm font-medium text-neutral-600'>
                              Date
                            </span>
                            <span className='text-[15px] text-neutral-900'>
                              {startDate
                                ? `${relativeDate}${
                                    relativeDate !== 'Today'
                                      ? `, ${format(
                                          startDate,
                                          'EEEE, MMMM d, yyyy',
                                        )}`
                                      : ''
                                  }`
                                : 'N/A'}
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
                              {startDate && endDate
                                ? `${format(
                                    startDate,
                                    'h:mm a',
                                  )} - ${format(endDate, 'h:mm a')}`
                                : startDate
                                  ? format(startDate, 'h:mm a')
                                  : 'N/A'}
                              {appointment.durationMinutes && (
                                <span className='text-neutral-500'>
                                  {' '}
                                  ({appointment.durationMinutes} minutes)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='text-center py-12 text-neutral-500'>
                <p>No appointments found</p>
                <p className='text-sm mt-2'>
                  This client has no appointments scheduled
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value='businesses'>
          <div className='bg-white border rounded-xl p-6 flex flex-col gap-5'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold'>Businesses</h3>

              <Button
                className='bg-purple cursor-pointer'
                onClick={() => setCreateBusinessDialogOpen(true)}
              >
                <span>New</span>
                <PlusIcon />
              </Button>
            </div>

            {businessesLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-5 h-5 animate-spin text-purple' />
                <span className='ml-2 text-neutral-600 text-sm'>
                  Loading businesses...
                </span>
              </div>
            ) : businesses && businesses.length > 0 ? (
              <div className='flex flex-col gap-4'>
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className='border w-full p-5 pr-6 rounded-lg flex flex-col gap-3.5 cursor-pointer hover:border-purple/50 transition-colors'
                    onClick={() => {
                      window.location.href = `/clients/${accountId}/businesses/${business.id}`;
                    }}
                  >
                    <div className='mb-1 flex items-center justify-between'>
                      {business.entity?.name && (
                        <span className='text-sm -ml-0.5 self-start font-medium bg-neutral-100 rounded-full px-2.5 py-0.5 capitalize'>
                          {business.entity.name}
                        </span>
                      )}

                      <div className='ml-auto flex items-center gap-5'>
                        <div
                          className='flex items-center gap-2 text-purple cursor-pointer'
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBusiness(business);
                            setEditBusinessDialogOpen(true);
                          }}
                        >
                          <Edit2Icon size={15} strokeWidth={2.4} />
                          <span className='text-[15px] font-medium'>Edit</span>
                        </div>

                        <div
                          className='text-red-700 flex items-center gap-2 cursor-pointer'
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBusiness(business);
                            setDeleteBusinessDialogOpen(true);
                          }}
                        >
                          <TrashIcon size={15} strokeWidth={2.4} />
                          <span className='text-[15px] font-medium'>
                            Delete
                          </span>
                        </div>
                      </div>
                    </div>

                    <h4 className='font-semibold text-start text-lg text-purple'>
                      {business.registeredName}
                    </h4>
                    {business.address && (
                      <p className='text-[15px] font-medium text-start'>
                        {business.address}
                      </p>
                    )}
                    <div className='flex items-center justify-between'>
                      {business.establishedDate && (
                        <div className='flex items-center gap-1.5 text-neutral-500'>
                          <Building2Icon size={19} strokeWidth={2.3} />
                          <p className='text-start text-[15px]'>
                            Incorporated{' '}
                            {new Date(
                              business.establishedDate,
                            ).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )}

                      {business.establishedDate && (
                        <div className='flex items-center gap-1.5'>
                          <ClockIcon size={16} strokeWidth={2.3} />
                          <span className='text-[15px]'>
                            {getTimeUntilAnniversary(business.establishedDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12 text-neutral-500'>
                <p>No businesses found</p>
                <p className='text-sm mt-2'>
                  Click &quot;New&quot; to add a business
                </p>
              </div>
            )}
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
              <div className='flex flex-col gap-4 mt-10'>
                {touchpoints.touchpoints.map((touchpoint) => (
                  <div
                    key={touchpoint.id}
                    className='rounded-lg flex flex-col gap-3 hover:border-purple/50 transition-colors'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='rounded-full flex items-center justify-center text-purple'>
                          {touchpoint.typeIcon === 'Phone' && (
                            <PhoneIcon size={18} strokeWidth={2.5} />
                          )}
                          {touchpoint.typeIcon === 'User' && (
                            <UserIcon size={18} strokeWidth={2.5} />
                          )}
                          {touchpoint.typeIcon === 'Calendar' && (
                            <CalendarIcon size={18} strokeWidth={2.5} />
                          )}
                          {touchpoint.typeIcon === 'Mail' && (
                            <MailIcon size={18} strokeWidth={2.5} />
                          )}
                        </div>
                        <div>
                          <h4 className='font-semibold text-purple text-[16px]'>
                            {touchpoint.typeName}
                          </h4>
                          {touchpoint.serviceName && (
                            <p className='text-sm text-neutral-500'>
                              Service: {touchpoint.serviceName}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className='text-sm text-neutral-500'>
                        {new Date(touchpoint.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          },
                        )}
                      </span>
                    </div>
                    <p className='text-[15px] text-neutral-700'>
                      {touchpoint.title}
                    </p>
                    <div className='flex items-center gap-2 text-sm text-neutral-500'>
                      <span>Created by {touchpoint.createdBy}</span>
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

        <TabsContent value='relationships'>
          <div className='bg-white border rounded-xl p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Relationships</h3>
              <Button
                className='bg-purple cursor-pointer'
                onClick={() => setAddRelationshipDialogOpen(true)}
              >
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
                      <Button
                        variant='outline'
                        size='sm'
                        className='cursor-pointer'
                        onClick={() => {
                          setSelectedRelationship(relationship);
                          setEditRelationshipDialogOpen(true);
                        }}
                      >
                        <Edit2Icon size={14} />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-red-600 hover:text-red-700 cursor-pointer'
                        onClick={() => {
                          setSelectedRelationship(relationship);
                          setDeleteRelationshipDialogOpen(true);
                        }}
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
