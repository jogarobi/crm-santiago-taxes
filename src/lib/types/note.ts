export type Note = {
  id: number;
  accountId: number;
  businessId: number | null;
  content: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
};

export type CreateNoteInput = {
  content: string;
  createdBy: string;
  businessId?: number;
};

export type UpdateNoteInput = {
  content?: string;
  updatedBy: string;
};
