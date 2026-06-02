'use client';

import { useState } from 'react';
import {
  useClientLogins,
  useCreateClientLogin,
  useUpdateClientLogin,
  useDeleteClientLogin,
  useRevealLoginPassword,
} from '@/hooks/use-client-logins';
import type { ClientLogin } from '@/lib/types/client-login';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  Edit2Icon,
  TrashIcon,
  KeyIcon,
  Loader2,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
} from 'lucide-react';

interface Props {
  accountId: number;
  createdBy: string;
}

interface LoginFormState {
  label: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

const EMPTY_FORM: LoginFormState = { label: '', username: '', password: '', url: '', notes: '' };

function LoginForm({
  value,
  onChange,
  isEdit,
}: {
  value: LoginFormState;
  onChange: (v: LoginFormState) => void;
  isEdit: boolean;
}) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className='flex flex-col gap-3'>
      <div>
        <label className='text-sm text-neutral-500 mb-1 block'>Label *</label>
        <input
          className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple'
          placeholder='e.g. IRS Portal, Square...'
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
      </div>
      <div>
        <label className='text-sm text-neutral-500 mb-1 block'>Username / Email *</label>
        <input
          className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple'
          placeholder='username@example.com'
          value={value.username}
          onChange={(e) => onChange({ ...value, username: e.target.value })}
        />
      </div>
      <div>
        <label className='text-sm text-neutral-500 mb-1 block'>
          Password {isEdit && <span className='text-neutral-400'>(leave blank to keep existing)</span>}
          {!isEdit && '*'}
        </label>
        <div className='relative'>
          <input
            type={showPw ? 'text' : 'password'}
            className='w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-purple'
            placeholder={isEdit ? '••••••••' : 'Enter password'}
            value={value.password}
            onChange={(e) => onChange({ ...value, password: e.target.value })}
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600'
            onClick={() => setShowPw((p) => !p)}
          >
            {showPw ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
          </button>
        </div>
      </div>
      <div>
        <label className='text-sm text-neutral-500 mb-1 block'>URL</label>
        <input
          className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple'
          placeholder='https://...'
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
        />
      </div>
      <div>
        <label className='text-sm text-neutral-500 mb-1 block'>Notes</label>
        <textarea
          className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple resize-none'
          rows={2}
          placeholder='Optional notes...'
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className='text-neutral-400 hover:text-purple transition-colors'
      title='Copy'
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
    </button>
  );
}

function RevealDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  error,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (pw: string) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw) onConfirm(pw);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setPw('');
        onOpenChange(v);
      }}
    >
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Confirm Your Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4 py-1'>
          <p className='text-sm text-neutral-500'>
            Enter your account password to reveal the stored credential.
          </p>
          <div className='relative'>
            <input
              type={show ? 'text' : 'password'}
              autoFocus
              className='w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-purple'
              placeholder='Your password'
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <button
              type='button'
              className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600'
              onClick={() => setShow((s) => !s)}
            >
              {show ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
            </button>
          </div>
          {error && <p className='text-sm text-red-500'>{error}</p>}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} className='cursor-pointer'>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!pw || isPending}
              className='bg-purple cursor-pointer'
            >
              {isPending ? <Loader2 size={14} className='animate-spin' /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoginRow({
  login,
  accountId,
  onEdit,
  onDelete,
}: {
  login: ClientLogin;
  accountId: number;
  onEdit: (login: ClientLogin) => void;
  onDelete: (login: ClientLogin) => void;
}) {
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [showRevealed, setShowRevealed] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  const reveal = useRevealLoginPassword();

  const handleRevealConfirm = (userPassword: string) => {
    setRevealError(null);
    reveal.mutate(
      { accountId, loginId: login.id, userPassword },
      {
        onSuccess: (pw) => {
          setRevealedPassword(pw);
          setShowRevealed(true);
          setRevealDialogOpen(false);
        },
        onError: (err) => {
          setRevealError(err.message);
        },
      }
    );
  };

  const handleHide = () => {
    setRevealedPassword(null);
    setShowRevealed(false);
  };

  return (
    <>
      <div className='grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 border rounded-lg hover:border-neutral-300 transition-colors'>
        <div className='min-w-0'>
          <p className='font-medium text-sm truncate'>{login.label}</p>
          {login.url && (
            <a
              href={login.url.startsWith('http') ? login.url : `https://${login.url}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-xs text-purple hover:underline flex items-center gap-1 mt-0.5'
            >
              <ExternalLinkIcon size={10} />
              <span className='truncate'>{login.url}</span>
            </a>
          )}
        </div>

        <div className='flex items-center gap-1.5 min-w-0'>
          <span className='text-sm text-neutral-700 truncate'>{login.username}</span>
          <CopyButton text={login.username} />
        </div>

        <div className='flex items-center gap-1.5'>
          {showRevealed && revealedPassword ? (
            <>
              <span className='text-sm font-mono text-neutral-700'>{revealedPassword}</span>
              <CopyButton text={revealedPassword} />
              <button
                className='text-neutral-400 hover:text-neutral-600 transition-colors'
                title='Hide'
                onClick={handleHide}
              >
                <EyeOffIcon size={13} />
              </button>
            </>
          ) : (
            <>
              <span className='text-sm text-neutral-400 tracking-widest'>••••••••</span>
              <button
                className='text-neutral-400 hover:text-purple transition-colors'
                title='Reveal password'
                onClick={() => {
                  setRevealError(null);
                  setRevealDialogOpen(true);
                }}
              >
                <EyeIcon size={13} />
              </button>
            </>
          )}
        </div>

        <div className='flex items-center gap-3'>
          <button
            className='text-neutral-400 hover:text-purple transition-colors'
            title='Edit'
            onClick={() => onEdit(login)}
          >
            <Edit2Icon size={14} />
          </button>
          <button
            className='text-neutral-400 hover:text-red-500 transition-colors'
            title='Delete'
            onClick={() => onDelete(login)}
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      <RevealDialog
        open={revealDialogOpen}
        onOpenChange={setRevealDialogOpen}
        onConfirm={handleRevealConfirm}
        isPending={reveal.isPending}
        error={revealError}
      />
    </>
  );
}

export function LoginsTab({ accountId, createdBy }: Props) {
  const { data: logins, isLoading } = useClientLogins(accountId);
  const createLogin = useCreateClientLogin();
  const updateLogin = useUpdateClientLogin();
  const deleteLogin = useDeleteClientLogin();

  const [addOpen, setAddOpen] = useState(false);
  const [editLogin, setEditLogin] = useState<ClientLogin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientLogin | null>(null);
  const [form, setForm] = useState<LoginFormState>(EMPTY_FORM);

  const handleAdd = () => {
    setForm(EMPTY_FORM);
    setAddOpen(true);
  };

  const handleAddSubmit = () => {
    if (!form.label || !form.username || !form.password) return;
    createLogin.mutate(
      { accountId, data: { ...form, createdBy } },
      { onSuccess: () => { setAddOpen(false); setForm(EMPTY_FORM); } }
    );
  };

  const handleEditOpen = (login: ClientLogin) => {
    setForm({ label: login.label, username: login.username, password: '', url: login.url ?? '', notes: login.notes ?? '' });
    setEditLogin(login);
  };

  const handleEditSubmit = () => {
    if (!editLogin) return;
    updateLogin.mutate(
      {
        accountId,
        loginId: editLogin.id,
        data: {
          label: form.label,
          username: form.username,
          password: form.password || undefined,
          url: form.url,
          notes: form.notes,
          updatedBy: createdBy,
        },
      },
      { onSuccess: () => { setEditLogin(null); setForm(EMPTY_FORM); } }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteLogin.mutate(
      { accountId, loginId: deleteTarget.id },
      { onSuccess: () => setDeleteTarget(null) }
    );
  };

  return (
    <div className='bg-white border rounded-xl p-6'>
      <div className='flex items-center justify-between mb-5'>
        <div className='flex items-center gap-2'>
          <KeyIcon size={18} className='text-neutral-500' />
          <h3 className='text-lg font-semibold'>Logins & Accounts</h3>
        </div>
        <Button className='bg-purple cursor-pointer' onClick={handleAdd}>
          <PlusIcon size={14} />
          <span>Add Login</span>
        </Button>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-12 text-neutral-500'>
          <Loader2 size={16} className='animate-spin mr-2' />
          <span className='text-sm'>Loading...</span>
        </div>
      ) : logins && logins.length > 0 ? (
        <div className='flex flex-col gap-2'>
          <div className='grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 pb-2'>
            <span className='text-xs font-medium text-neutral-400 uppercase tracking-wide'>Label</span>
            <span className='text-xs font-medium text-neutral-400 uppercase tracking-wide'>Username</span>
            <span className='text-xs font-medium text-neutral-400 uppercase tracking-wide'>Password</span>
            <span />
          </div>
          {logins.map((login) => (
            <LoginRow
              key={login.id}
              login={login}
              accountId={accountId}
              onEdit={handleEditOpen}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <div className='text-center py-12 text-neutral-500'>
          <KeyIcon size={32} className='mx-auto mb-3 text-neutral-300' />
          <p className='text-sm'>No logins stored yet.</p>
          <p className='text-xs text-neutral-400 mt-1'>Click &quot;Add Login&quot; to store a credential.</p>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) setForm(EMPTY_FORM); }}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Add Login</DialogTitle>
          </DialogHeader>
          <div className='py-2'>
            <LoginForm value={form} onChange={setForm} isEdit={false} />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAddOpen(false)} className='cursor-pointer'>Cancel</Button>
            <Button
              className='bg-purple cursor-pointer'
              disabled={!form.label || !form.username || !form.password || createLogin.isPending}
              onClick={handleAddSubmit}
            >
              {createLogin.isPending ? <Loader2 size={14} className='animate-spin' /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editLogin} onOpenChange={(v) => { if (!v) { setEditLogin(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Login</DialogTitle>
          </DialogHeader>
          <div className='py-2'>
            <LoginForm value={form} onChange={setForm} isEdit={true} />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditLogin(null)} className='cursor-pointer'>Cancel</Button>
            <Button
              className='bg-purple cursor-pointer'
              disabled={!form.label || !form.username || updateLogin.isPending}
              onClick={handleEditSubmit}
            >
              {updateLogin.isPending ? <Loader2 size={14} className='animate-spin' /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Login</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-neutral-600 py-2'>
            Are you sure you want to delete <span className='font-medium'>{deleteTarget?.label}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)} className='cursor-pointer'>Cancel</Button>
            <Button
              className='bg-red-600 hover:bg-red-700 cursor-pointer'
              disabled={deleteLogin.isPending}
              onClick={handleDeleteConfirm}
            >
              {deleteLogin.isPending ? <Loader2 size={14} className='animate-spin' /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
