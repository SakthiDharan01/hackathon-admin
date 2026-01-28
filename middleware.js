import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token');
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
