export interface BusinessEntity {
  id: number;
  name: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

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
  city: string | null;
  state: string | null;
  zipCode: string | null;
  entityId: number | null;
  entity?: {
    id: number;
    name: string;
  };
  account?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  accounts?: {
    id: number;
    firstName: string;
    lastName: string;
  }[];
}

export interface BusinessAccountLink {
  id: number;
  businessId: number;
  accountId: number;
  createdAt: string | null;
  createdBy: string;
  account: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CreateBusinessInput {
  registeredName: string;
  establishedDate?: string;
  ein?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  entityId?: number;
  createdBy: string;
}

export interface UpdateBusinessInput {
  registeredName?: string;
  establishedDate?: string;
  ein?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  entityId?: number;
  updatedBy: string;
}
