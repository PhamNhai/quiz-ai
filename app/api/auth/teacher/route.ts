import { NextRequest, NextResponse } from 'next/server'
import { checkTeacherCredentials, createSessionToken, TEACHER_SESSION_COOKIE } from '@/lib/teacher-auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!checkTeacherCredentials(String(username ?? ''), String(password ?? ''))) {
      return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 })
    }
    const token = await createSessionToken()
    const res = NextResponse.json({ ok: true })
    res.cookies.set(TEACHER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Lỗi đăng nhập' }, { status: 400 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(TEACHER_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
