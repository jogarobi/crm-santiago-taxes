export type AccountRelationship = {
  id: number;
  accountId: number;
  relatedAccountId: number;
  relationship: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  // The accountId that owns this record in the DB (used for edit/delete API calls)
  ownerAccountId: number;
  // Related account details for display (always the "other" account, not the viewer)
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