import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // Better Auth session token cookie
    // In dev it's usually better-auth.session_token
    // In prod it's usually __Secure-better-auth.session_token
    const sessionToken = 
        request.cookies.get('better-auth.session_token') || 
        request.cookies.get('__Secure-better-auth.session_token')

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // Redirect to login if no session and trying to access protected route
    if (!sessionToken && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to dashboard if session exists and trying to access login/register
    if (sessionToken && isPublicPath) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    // Match all request paths except for:
    // - api routes
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
