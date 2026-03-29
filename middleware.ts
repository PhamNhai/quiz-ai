import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TEACHER_SESSION_COOKIE } from '@/lib/teacher-auth'
import { verifyStaffSessionToken } from '@/lib/staff-auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/teacher/login') return NextResponse.next()

  if (pathname === '/teacher/manage') {
    const url = request.nextUrl.clone()
    url.pathname = '/teacher'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/teacher')) {
    const session = await verifyStaffSessionToken(request.cookies.get(TEACHER_SESSION_COOKIE)?.value)
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/teacher/login'
      url.searchParams.set('next', pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/teacher/:path*'] }
