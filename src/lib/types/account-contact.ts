export type AccountContact = {
  id: number;
  accountId: number;
  email?: string | null;
  phoneNumber?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type CreateAccountContactInput = {
  accountId: number;
  email?: string;
  phoneNumber?: string;
  createdBy: string;
};

export type UpdateAccountContactInput = Partial<CreateAccountContactInput> & {
  updatedBy: string;
};