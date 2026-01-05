import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

type AuthHandler = (
  req: Request,
  ctx: { session: AuthSession }
) => Promise<Response | NextResponse>;

export function withAuth(handler: AuthHandler) {
  return async (req: Request, context?: any) => {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, { session, ...context });
  };
}

export async function getAuthSession(req: Request): Promise<AuthSession | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  return session;
}
