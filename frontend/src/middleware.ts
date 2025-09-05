import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {locales, defaultLocale} from './i18n'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key'
)

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth']
const AUTH_PATHS = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Basic locale handling - redirect root to default locale
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url))
  }

  // Extract locale from pathname for auth checks
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  const pathnameWithoutLocale = pathnameHasLocale 
    ? pathname.split('/').slice(2).join('/') || '/'
    : pathname

  // Get token from cookies
  const token = request.cookies.get('access_token')?.value
  
  // Redirect to login if no token and trying to access protected route
  if (!token && !PUBLIC_PATHS.includes(pathnameWithoutLocale)) {
    const locale = pathnameHasLocale ? pathname.split('/')[1] : defaultLocale
    const loginUrl = new URL(`/${locale}/login`, request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if logged in and trying to access auth pages
  if (token && AUTH_PATHS.includes(pathnameWithoutLocale)) {
    const locale = pathnameHasLocale ? pathname.split('/')[1] : defaultLocale
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Verify JWT and extract org_id
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const orgId = payload.org_id as string
      
      // Add org_id to headers for the app to use
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-org-id', orgId)
      requestHeaders.set('x-user-id', payload.sub as string)
      requestHeaders.set('x-user-role', payload.role as string)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error('JWT verification failed:', error)
      
      // Invalid token, redirect to login
      if (!PUBLIC_PATHS.includes(pathnameWithoutLocale)) {
        const locale = pathnameHasLocale ? pathname.split('/')[1] : defaultLocale
        const response = NextResponse.redirect(new URL(`/${locale}/login`, request.url))
        response.cookies.delete('access_token')
        response.cookies.delete('org_id')
        return response
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}