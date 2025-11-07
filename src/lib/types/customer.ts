export interface Customer {
  id?: string;
  givenName?: string;
  familyName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerResponse {
  success: boolean;
  customer: Customer;
}

export interface CustomerErrorResponse {
  success: false;
  error: string;
  message: string;
}
