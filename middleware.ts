import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TEACHER_SESSION_COOKIE, verifySessionToken } from '@/lib/teacher-auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/teacher/login') return NextResponse.next()

  if (pathname.startsWith('/teacher')) {
    const ok = await verifySessionToken(request.cookies.get(TEACHER_SESSION_COOKIE)?.value)
    if (!ok) {
      const url = request.nextUrl.clone()
      url.pathname = '/teacher/login'
      url.searchParams.set('next', pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/teacher/:path*'] }
