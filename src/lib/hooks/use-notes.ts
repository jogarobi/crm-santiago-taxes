import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/lib/types/note';

// Query Keys
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (accountId: number, params?: FetchNotesParams) =>
    [...noteKeys.lists(), accountId, params] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (noteId: number) => [...noteKeys.details(), noteId] as const,
};

// Types
export interface FetchNotesParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface NotesResponse {
  success: boolean;
  notes: Note[];
  count: number;
  total: number;
  hasMore: boolean;
}

// API Functions
async function fetchNotes(
  accountId: number,
  params?: FetchNotesParams
): Promise<NotesResponse> {
  const urlParams = new URLSearchParams({ accountId: accountId.toString() });

  if (params?.search) {
    urlParams.append('search', params.search);
  }
  if (params?.limit !== undefined) {
    urlParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    urlParams.append('offset', params.offset.toString());
  }

  const response = await fetch(`/api/notes?${urlParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
}

async function fetchNote(noteId: number): Promise<Note> {
  const response = await fetch(`/api/notes/${noteId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }
  return response.json();
}

async function createNote(accountId: number, data: CreateNoteInput): Promise<Note> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      accountId,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to create note');
  }
  return response.json();
}

async function updateNote(
  noteId: number,
  data: UpdateNoteInput
): Promise<Note> {
  const response = await fetch(`/api/notes/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update note');
  }
  return response.json();
}

async function deleteNote(noteId: number): Promise<{ message: string }> {
  const response = await fetch(`/api/notes/${noteId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete note');
  }
  return response.json();
}

// Hooks
export function useNotes(accountId: number, params?: FetchNotesParams) {
  return useQuery({
    queryKey: noteKeys.list(accountId, params),
    queryFn: () => fetchNotes(accountId, params),
    enabled: !!accountId,
  });
}

export function useNote(noteId: number) {
  return useQuery({
    queryKey: noteKeys.detail(noteId),
    queryFn: () => fetchNote(noteId),
    enabled: !!noteId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: number; data: CreateNoteInput }) =>
      createNote(accountId, data),
    onSuccess: (_, variables) => {
      // Invalidate all list queries for this account, regardless of params
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'notes' &&
          query.queryKey[1] === 'list' &&
          query.queryKey[2] === variables.accountId,
      });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      data,
      accountId,
    }: {
      noteId: number;
      data: UpdateNoteInput;
      accountId?: number;
    }) => updateNote(noteId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.noteId) });

      // Invalidate all list queries for this account
      const accountIdToInvalidate = variables.accountId || result.accountId;
      if (accountIdToInvalidate) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === 'notes' &&
            query.queryKey[1] === 'list' &&
            query.queryKey[2] === accountIdToInvalidate,
        });
      }
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, accountId }: { noteId: number; accountId?: number }) =>
      deleteNote(noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.noteId) });

      // Invalidate all list queries for this account
      if (variables.accountId) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === 'notes' &&
            query.queryKey[1] === 'list' &&
            query.queryKey[2] === variables.accountId,
        });
      }
    },
  });
}
