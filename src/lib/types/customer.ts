export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  locality?: string;
  administrativeDistrictLevel1?: string;
  administrativeDistrictLevel2?: string;
  postalCode?: string;
  country?: string;
}

export interface Customer {
  id?: string;
  givenName?: string;
  familyName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  address?: Address;
  birthday?: string;
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
