import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import {
  createStaffSessionToken,
  TEACHER_SESSION_COOKIE,
} from '@/lib/staff-auth'
import { checkTeacherCredentials } from '@/lib/teacher-auth'

export async function POST(req: NextRequest) {
  try {
    await initDB()
    const { username: rawU, password: rawP } = await req.json()
    const username = String(rawU ?? '').trim()
    const password = String(rawP ?? '')
    if (!username || !password)
      return NextResponse.json({ error: 'Nhập tài khoản và mật khẩu' }, { status: 400 })

    const rows = (await sql`
      SELECT id, username, role, password_hash FROM staff_users WHERE username = ${username}
    `) as Array<{
      id: number
      username: string
      role: 'admin' | 'school_manager' | 'teacher'
      password_hash: string
    }>

    if (rows.length) {
      if (!verifyPassword(password, rows[0].password_hash))
        return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 })
      const u = rows[0]
      const token = await createStaffSessionToken({
        userId: u.id,
        role: u.role,
        username: u.username,
      })
      const res = NextResponse.json({ ok: true, role: u.role, username: u.username })
      res.cookies.set(TEACHER_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
      return res
    }

    if (checkTeacherCredentials(username, password)) {
      const envU = (process.env.TEACHER_USERNAME ?? 'quizadmin').trim()
      const r2 = (await sql`
        SELECT id, username, role FROM staff_users WHERE username = ${envU}
      `) as Array<{ id: number; username: string; role: 'admin' | 'school_manager' | 'teacher' }>
      if (r2.length && username === envU) {
        const u = r2[0]
        const token = await createStaffSessionToken({
          userId: u.id,
          role: u.role,
          username: u.username,
        })
        const res = NextResponse.json({ ok: true, role: u.role, username: u.username })
        res.cookies.set(TEACHER_SESSION_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        })
        return res
      }
    }

    return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Lỗi đăng nhập' }, { status: 400 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(TEACHER_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
