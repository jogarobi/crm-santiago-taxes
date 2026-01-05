import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

type PermissionCheck = {
  client?: ('create' | 'read' | 'update' | 'delete')[];
  appointment?: ('create' | 'read' | 'update' | 'delete' | 'cancel')[];
  payment?: ('create' | 'read' | 'refund')[];
  report?: ('read' | 'export')[];
  staff?: ('create' | 'read' | 'update' | 'delete')[];
};

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export async function requireGuest() {
  const session = await getSession();

  if (session) {
    redirect('/');
  }
}

export async function requirePermission(permissions: PermissionCheck) {
  const session = await requireAuth();

  try {
    await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions,
      },
    });
  } catch {
    redirect('/403'); // Redirect to forbidden page
  }

  return session;
}

export async function hasPermission(
  permissions: PermissionCheck
): Promise<boolean> {
  const session = await getSession();

  if (!session) {
    return false;
  }

  try {
    await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions,
      },
    });
    return true;
  } catch {
    return false;
  }
}
