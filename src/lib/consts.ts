export enum SquarePermission {
  // Bookings
  APPOINTMENTS_READ = 'APPOINTMENTS_READ',
  APPOINTMENTS_WRITE = 'APPOINTMENTS_WRITE',
  APPOINTMENTS_ALL_READ = 'APPOINTMENTS_ALL_READ',
  APPOINTMENTS_ALL_WRITE = 'APPOINTMENTS_ALL_WRITE',
  APPOINTMENTS_BUSINESS_SETTINGS_READ = 'APPOINTMENTS_BUSINESS_SETTINGS_READ',
  // Catalog
  ITEMS_READ = 'ITEMS_READ',
  ITEMS_WRITE = 'ITEMS_WRITE',
  // Checkout
  ORDERS_READ = 'ORDERS_READ',
  ORDERS_WRITE = 'ORDERS_WRITE',
  PAYMENTS_WRITE = 'PAYMENTS_WRITE',
  // Customers
  CUSTOMERS_READ = 'CUSTOMERS_READ',
  CUSTOMERS_WRITE = 'CUSTOMERS_WRITE',
  // Employees & Team
  EMPLOYEES_READ = 'EMPLOYEES_READ',
  EMPLOYEES_WRITE = 'EMPLOYEES_WRITE',
  // Inventory
  INVENTORY_READ = 'INVENTORY_READ',
  INVENTORY_WRITE = 'INVENTORY_WRITE',
  // Terminal
  PAYMENTS_READ = 'PAYMENTS_READ',
}

export const SQUARE_PERMISSIONS_METADATA: Record<
  SquarePermission,
  { category: string; description: string }
> = {
  [SquarePermission.APPOINTMENTS_READ]: {
    category: 'Bookings',
    description:
      'Access to retrieve booking availability and list/retrieve bookings (buyer and seller-level)',
  },
  [SquarePermission.APPOINTMENTS_WRITE]: {
    category: 'Bookings',
    description: 'Permission to create, update, and cancel bookings',
  },
  [SquarePermission.APPOINTMENTS_ALL_READ]: {
    category: 'Bookings',
    description: 'Seller-level access to read all appointments',
  },
  [SquarePermission.APPOINTMENTS_ALL_WRITE]: {
    category: 'Bookings',
    description: 'Seller-level access to modify all appointments',
  },
  [SquarePermission.APPOINTMENTS_BUSINESS_SETTINGS_READ]: {
    category: 'Bookings',
    description:
      'RetrieveBusinessBookingProfile, ListTeamMemberBookingProfiles',
  },
  [SquarePermission.ITEMS_READ]: {
    category: 'Catalog',
    description: 'Syncs items to Square Point of Sale to itemize payments',
  },
  [SquarePermission.ITEMS_WRITE]: {
    category: 'Catalog',
    description:
      'Required for batch operations, creating images, and upserting catalog objects',
  },
  [SquarePermission.ORDERS_READ]: {
    category: 'Checkout',
    description: 'Supports payment link creation',
  },
  [SquarePermission.ORDERS_WRITE]: {
    category: 'Checkout',
    description:
      'Needed alongside ORDERS_READ and PAYMENTS_WRITE to create payment links',
  },
  [SquarePermission.PAYMENTS_WRITE]: {
    category: 'Checkout',
    description: 'Enables transaction processing for checkout',
  },
  [SquarePermission.CUSTOMERS_READ]: {
    category: 'Customers',
    description:
      'Creates and manages customer profiles and syncs customer relationship',
  },
  [SquarePermission.CUSTOMERS_WRITE]: {
    category: 'Customers',
    description: 'Allows modifications to customer data, groups, and cards',
  },
  [SquarePermission.EMPLOYEES_READ]: {
    category: 'Employees & Team',
    description: 'Access to retrieve employee and team member information',
  },
  [SquarePermission.EMPLOYEES_WRITE]: {
    category: 'Employees & Team',
    description:
      'Permission to create and modify team members and wage settings',
  },
  [SquarePermission.INVENTORY_READ]: {
    category: 'Inventory',
    description: 'Keeps an inventory of catalog items in sync across all',
  },
  [SquarePermission.INVENTORY_WRITE]: {
    category: 'Inventory',
    description: 'Enables batch changes to inventory counts and adjustments',
  },
  [SquarePermission.PAYMENTS_READ]: {
    category: 'Terminal',
    description: 'Access to retrieve checkout, refund, and action statuses',
  },
};

export const CLIENT_ID = 'sq0idp-HIISMUgQPS83S6m2EIB6wg';
export const OATH_URL = 'https://connect.squareup.com/oauth2';
