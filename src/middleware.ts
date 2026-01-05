import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthPage = pathname.startsWith('/login');
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/appointments') ||
    pathname.startsWith('/catalog') ||
    pathname.startsWith('/team');

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/dashboard/:path*',
    '/clients/:path*',
    '/appointments/:path*',
    '/catalog/:path*',
    '/team/:path*',
    '/login',
  ],
};
