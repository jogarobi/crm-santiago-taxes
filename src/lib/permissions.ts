import { createAccessControl } from 'better-auth/plugins/access';

const customStatements = {
  client: ['create', 'read', 'update', 'delete'],
  appointment: ['create', 'read', 'update', 'delete', 'cancel'],
  payment: ['create', 'read', 'refund'],
  report: ['read', 'export'],
  staff: ['create', 'read', 'update', 'delete'],
} as const;

export const ac = createAccessControl(customStatements);

export const admin = ac.newRole({
  client: ['create', 'read', 'update', 'delete'],
  appointment: ['create', 'read', 'update', 'delete', 'cancel'],
  payment: ['create', 'read', 'refund'],
  report: ['read', 'export'],
  staff: ['create', 'read', 'update', 'delete'],
});

export const staff = ac.newRole({
  client: ['create', 'read', 'update'],
  appointment: ['create', 'read', 'update', 'delete', 'cancel'],
  payment: ['read'],
  report: ['read', 'export'],
  staff: ['read'],
});

export const roles = {
  admin,
  staff,
};

export type Role = keyof typeof roles;
export type Resource = keyof typeof customStatements;
export type Action<T extends Resource> = (typeof customStatements)[T][number];
