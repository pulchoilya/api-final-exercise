import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  // Public routes — no auth needed
  const { pathname } = req.nextUrl;
  const isPublicRoute =
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/oauth/token' ||
    pathname.startsWith('/api/docs') ||
    pathname === '/api/uploads' ||
    pathname.startsWith('/api/uploads/');

  // GET-only public endpoints
  const isPublicGet =
    req.method === 'GET' &&
    (pathname === '/api/courses' ||
      pathname.match(/^\/api\/courses\/[^/]+$/) ||
      pathname === '/api/categories' ||
      pathname === '/api/tags' ||
      pathname === '/api/posts' ||
      pathname === '/api/youtube-videos');

  if (isPublicRoute || isPublicGet) {
    return NextResponse.next();
  }

  // All other API routes require a Bearer token
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Token validation is done in route handlers via requireAuth/requireAdmin
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
