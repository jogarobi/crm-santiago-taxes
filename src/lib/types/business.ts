export interface Business {
  id: number;
  accountId: number;
  registeredName: string;
  establishedDate: string | null;
  ein: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  address: string | null;
  entityId: number | null;
  entity?: {
    id: number;
    name: string;
  };
}

export interface CreateBusinessInput {
  registeredName: string;
  establishedDate?: string;
  ein?: string;
  address?: string;
  entityId?: number;
  createdBy: string;
}

export interface UpdateBusinessInput {
  registeredName?: string;
  establishedDate?: string;
  ein?: string;
  address?: string;
  entityId?: number;
  updatedBy: string;
}
