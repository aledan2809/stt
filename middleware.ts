import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authManager } from './src/lib/auth'

const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/setup', '/api/auth/status']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth for public authentication endpoints
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const isAuthenticated = await authManager.isAuthenticated(request)

  if (!isAuthenticated) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}