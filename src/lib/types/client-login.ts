export interface ClientLogin {
  id: number;
  accountId: number;
  label: string;
  username: string;
  url: string | null;
  notes: string | null;
  createdAt: string | null;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface CreateClientLoginInput {
  label: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  createdBy: string;
}

export interface UpdateClientLoginInput {
  label?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  updatedBy: string;
}
