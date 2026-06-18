import { NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth-utils';

export type AuthSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

type AuthHandler = (
  req: Request,
  ctx: { session: AuthSession }
) => Promise<Response | NextResponse>;

type PermissionCheck = {
  client?: ('create' | 'read' | 'update' | 'delete')[];
  appointment?: ('create' | 'read' | 'update' | 'delete' | 'cancel')[];
  payment?: ('create' | 'read' | 'refund')[];
  report?: ('read' | 'export')[];
  staff?: ('create' | 'read' | 'update' | 'delete')[];
};

type AuthWithPermissionsHandler = (
  req: Request,
  ctx: { session: AuthSession }
) => Promise<Response | NextResponse>;

export function withAuth(handler: AuthHandler) {
  return async (req: Request, context?: Record<string, unknown>) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, { session, ...context });
  };
}

export function withPermissions(
  permissions: PermissionCheck,
  handler: AuthWithPermissionsHandler
) {
  return async (req: Request, context?: Record<string, unknown>) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await hasPermission(permissions);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req, { session, ...context });
  };
}

export async function getAuthSession(): Promise<AuthSession | null> {
  return await getSession();
}

export async function checkPermission(
  permissions: PermissionCheck
): Promise<boolean> {
  return await hasPermission(permissions);
}
