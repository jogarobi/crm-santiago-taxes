export type AccountRelationship = {
  id: number;
  accountId: number;
  relatedAccountId: number;
  relationship: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  // Related account details for display
  relatedAccount?: {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
};

export type CreateAccountRelationshipInput = {
  accountId: number;
  relatedAccountId: number;
  relationship: string;
  createdBy: string;
};

export type UpdateAccountRelationshipInput = Partial<CreateAccountRelationshipInput> & {
  updatedBy: string;
};