export type AccountContact = {
  id: number;
  accountId: number;
  contactType: string;
  contactValue: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type CreateAccountContactInput = {
  accountId: number;
  contactType: 'email' | 'phone';
  contactValue: string;
  createdBy: string;
};

export type UpdateAccountContactInput = {
  contactType?: 'email' | 'phone';
  contactValue?: string;
  updatedBy: string;
};
