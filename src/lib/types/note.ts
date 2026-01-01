export type Note = {
  id: number;
  accountId: number | null;
  content: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
};

export type CreateNoteInput = {
  content: string;
  createdBy: string;
};

export type UpdateNoteInput = {
  content?: string;
  updatedBy: string;
};
