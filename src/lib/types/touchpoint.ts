export type TouchpointType = 'Call' | 'Walk-in' | 'Appointment Booked' | 'Email';

export type Touchpoint = {
  id: number;
  accountId: number | null;
  businessId: number | null;
  typeId: number;
  typeName: string;
  typeIcon: string;
  title: string;
  serviceId: number | null;
  serviceName: string | null;
  createdAt: string;
  createdBy: string;
};

export type CreateTouchpointInput = {
  accountId?: number;
  businessId?: number;
  type: TouchpointType;
  note: string;
  serviceId?: number;
  createdBy: string;
};
