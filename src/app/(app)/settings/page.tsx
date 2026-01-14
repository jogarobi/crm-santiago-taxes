'use client';

import { useState, useEffect } from 'react';
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
  enabled: boolean;
};

type Role = 'owner' | 'admin' | 'staff';

type RolePermissions = {
  [key in Role]: PermissionAction[];
};

const roles: { id: Role; label: string }[] = [
  { id: 'owner', label: 'Owner' },
  { id: 'admin', label: 'Admin' },
  { id: 'staff', label: 'Staff' },
];

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({
    owner: [],
    admin: [],
    staff: [],
  });
  const [savingPermissions, setSavingPermissions] = useState<Set<string>>(
    new Set()
  );

  // Fetch permissions on mount
  useEffect(() => {
    async function fetchPermissions() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/permissions');
        if (!response.ok) {
          throw new Error('Failed to fetch permissions');
        }

        const data = await response.json();
        setRolePermissions(data);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError('Failed to load permissions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPermissions();
  }, []);

  const handlePermissionToggle = async (
    role: Role,
    permission: PermissionAction
  ) => {
    const permKey = `${role}:${permission.id}`;
    setSavingPermissions((prev) => new Set(prev).add(permKey));

    try {
      const newEnabledState = !permission.enabled;

      // Optimistically update UI
      setRolePermissions((prev) => ({
        ...prev,
        [role]: prev[role].map((p) =>
          p.id === permission.id ? { ...p, enabled: newEnabledState } : p
        ),
      }));

      // Save to API
      const response = await fetch('/api/permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          resource: permission.resource,
          action: permission.action,
          enabled: newEnabledState,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permission');
      }
    } catch (err) {
      console.error('Error updating permission:', err);
      // Revert on error
      setRolePermissions((prev) => ({
        ...prev,
        [role]: prev[role].map((p) =>
          p.id === permission.id ? { ...p, enabled: permission.enabled } : p
        ),
      }));
      alert('Failed to update permission. Please try again.');
    } finally {
      setSavingPermissions((prev) => {
        const next = new Set(prev);
        next.delete(permKey);
        return next;
      });
    }
  };

  // Get all unique permissions (they're the same across roles, just with different enabled states)
  const allPermissions =
    rolePermissions.owner.length > 0
      ? rolePermissions.owner
      : rolePermissions.admin.length > 0
      ? rolePermissions.admin
      : rolePermissions.staff;

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
        ) : error ? (
          <div className='p-6'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <p className='text-red-800'>{error}</p>
            </div>
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
                {allPermissions.map((permission, index) => (
                  <TableRow key={permission.id}>
                    <TableCell className='p-4 text-neutral-600'>
                      {permission.description}
                    </TableCell>
                    {roles.map((role) => {
                      const rolePermission = rolePermissions[role.id][index];
                      const permKey = `${role.id}:${permission.id}`;
                      const isSaving = savingPermissions.has(permKey);

                      return (
                        <TableCell key={role.id} className='p-4 text-center'>
                          <div className='flex justify-center'>
                            {isSaving ? (
                              <Loader2 className='w-5 h-5 animate-spin text-purple' />
                            ) : (
                              <Switch
                                checked={rolePermission?.enabled || false}
                                onCheckedChange={() =>
                                  handlePermissionToggle(
                                    role.id,
                                    rolePermission
                                  )
                                }
                              />
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
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
