'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

type PermissionAction = {
  id: string;
  resource: string;
  action: string;
  description: string;
};

type Role = 'owner' | 'admin' | 'staff';

type RolePermissions = {
  [key in Role]: Set<string>;
};

const permissions: PermissionAction[] = [
  {
    id: 'client:create',
    resource: 'client',
    action: 'create',
    description: 'Can create new clients',
  },
  {
    id: 'client:read',
    resource: 'client',
    action: 'read',
    description: 'Can view client information',
  },
  {
    id: 'client:update',
    resource: 'client',
    action: 'update',
    description: 'Can update client information',
  },
  {
    id: 'client:delete',
    resource: 'client',
    action: 'delete',
    description: 'Can delete clients',
  },

  // Appointment permissions
  {
    id: 'appointment:create',
    resource: 'appointment',
    action: 'create',
    description: 'Can create appointments',
  },
  {
    id: 'appointment:read',
    resource: 'appointment',
    action: 'read',
    description: 'Can view appointments',
  },
  {
    id: 'appointment:update',
    resource: 'appointment',
    action: 'update',
    description: 'Can update appointments',
  },
  {
    id: 'appointment:delete',
    resource: 'appointment',
    action: 'delete',
    description: 'Can delete appointments',
  },
  {
    id: 'appointment:cancel',
    resource: 'appointment',
    action: 'cancel',
    description: 'Can cancel appointments',
  },

  // Payment permissions
  {
    id: 'payment:create',
    resource: 'payment',
    action: 'create',
    description: 'Can create payments',
  },
  {
    id: 'payment:read',
    resource: 'payment',
    action: 'read',
    description: 'Can view payments',
  },
  {
    id: 'payment:refund',
    resource: 'payment',
    action: 'refund',
    description: 'Can refund payments',
  },

  // Report permissions
  {
    id: 'report:read',
    resource: 'report',
    action: 'read',
    description: 'Can view reports',
  },
  {
    id: 'report:export',
    resource: 'report',
    action: 'export',
    description: 'Can export reports',
  },

  // Staff permissions
  {
    id: 'staff:create',
    resource: 'staff',
    action: 'create',
    description: 'Can create staff members',
  },
  {
    id: 'staff:read',
    resource: 'staff',
    action: 'read',
    description: 'Can view staff information',
  },
  {
    id: 'staff:update',
    resource: 'staff',
    action: 'update',
    description: 'Can update staff members',
  },
  {
    id: 'staff:delete',
    resource: 'staff',
    action: 'delete',
    description: 'Can delete staff members',
  },
];

const roles: { id: Role; label: string }[] = [
  { id: 'owner', label: 'Owner' },
  { id: 'admin', label: 'Admin' },
  { id: 'staff', label: 'Staff' },
];

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({
    owner: new Set([
      'client:create',
      'client:read',
      'client:update',
      'client:delete',
      'appointment:create',
      'appointment:read',
      'appointment:update',
      'appointment:delete',
      'appointment:cancel',
      'payment:create',
      'payment:read',
      'payment:refund',
      'report:read',
      'report:export',
      'staff:create',
      'staff:read',
      'staff:update',
      'staff:delete',
    ]),
    // Admin has all permissions
    admin: new Set([
      'client:create',
      'client:read',
      'client:update',
      'client:delete',
      'appointment:create',
      'appointment:read',
      'appointment:update',
      'appointment:delete',
      'appointment:cancel',
      'payment:create',
      'payment:read',
      'payment:refund',
      'report:read',
      'report:export',
      'staff:create',
      'staff:read',
      'staff:update',
      'staff:delete',
    ]),
    staff: new Set([
      'client:create',
      'client:read',
      'client:update',
      'appointment:create',
      'appointment:read',
      'appointment:update',
      'appointment:delete',
      'appointment:cancel',
      'payment:read',
      'report:read',
      'report:export',
      'staff:read',
    ]),
  });

  const handlePermissionToggle = (role: Role, permissionId: string) => {
    setRolePermissions((prev) => {
      const newPermissions = new Map(
        Object.entries(prev).map(([key, value]) => [key, new Set(value)])
      );
      const rolePerms = newPermissions.get(role) || new Set<string>();

      if (rolePerms.has(permissionId)) {
        rolePerms.delete(permissionId);
      } else {
        rolePerms.add(permissionId);
      }

      newPermissions.set(role, rolePerms);
      return Object.fromEntries(newPermissions) as RolePermissions;
    });
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Settings</h1>
      </div>

      <div className='bg-white border rounded-lg overflow-hidden'>
        <div className='p-6 border-b'>
          <h2 className='text-xl font-semibold'>Employee Permissions</h2>
          <p className='text-sm text-neutral-600 mt-1'>
            Manage role-based permissions for system features
          </p>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='w-6 h-6 animate-spin text-purple' />
            <span className='ml-3 text-[15px] text-neutral-600'>
              Loading permissions...
            </span>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='p-4 min-w-[300px]'>
                    Description
                  </TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.id} className='p-4 text-center'>
                      {role.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className='p-4 text-neutral-600'>
                      {permission.description}
                    </TableCell>
                    {roles.map((role) => (
                      <TableCell key={role.id} className='p-4 text-center'>
                        <div className='flex justify-center'>
                          <Switch
                            checked={rolePermissions[role.id].has(
                              permission.id
                            )}
                            onCheckedChange={() =>
                              handlePermissionToggle(role.id, permission.id)
                            }
                          />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
