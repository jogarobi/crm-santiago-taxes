export type Account = {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssnLastFour?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  squareId?: string | null;
  flag?: string | null;
  phoneNumber?: string | null;
  businesses?: {
    id: number;
    registeredName: string;
  }[];
};

export type CreateAccountInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssnLastFour?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdBy: string;
  squareId?: string;
};

export type UpdateAccountInput = Partial<CreateAccountInput> & {
  updatedBy: string;
  flag?: string | null;
};
