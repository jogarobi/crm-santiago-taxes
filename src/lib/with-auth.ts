import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

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
    const session = await auth.api.getSession({ headers: req.headers });

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
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await auth.api.hasPermission({
        headers: req.headers,
        body: {
          permissions,
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req, { session, ...context });
  };
}

export async function getAuthSession(
  req: Request
): Promise<AuthSession | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  return session;
}

export async function checkPermission(
  req: Request,
  permissions: PermissionCheck
): Promise<boolean> {
  try {
    await auth.api.hasPermission({
      headers: req.headers,
      body: {
        permissions,
      },
    });
    return true;
  } catch {
    return false;
  }
}
