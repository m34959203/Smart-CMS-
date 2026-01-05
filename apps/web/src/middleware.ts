import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Authentication check disabled - full access to editor panel
  // Uncomment below to re-enable authentication:

  /*
  // Check if the user is accessing the admin panel
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get auth token from cookies or localStorage (in real app, use httpOnly cookies)
    const authCookie = request.cookies.get('auth-storage');

    if (!authCookie) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const authData = JSON.parse(authCookie.value);
      const user = authData?.state?.user;

      // Check if user has EDITOR or ADMIN role
      if (!user || (user.role !== 'EDITOR' && user.role !== 'ADMIN')) {
        // Redirect to home if not authorized
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // If parsing fails, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
