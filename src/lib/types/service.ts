export type Service = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type CreateServiceInput = {
  name: string;
};

export type UpdateServiceInput = {
  name?: string;
  isActive?: boolean;
};

export type ServicesResponse = {
  success: boolean;
  services: Service[];
  count: number;
  total: number;
  hasMore: boolean;
};

export type ServiceResponse = {
  success: boolean;
  service: Service;
};
