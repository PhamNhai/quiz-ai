import { NextRequest, NextResponse } from 'next/server'
import sql, { initDB } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { forbidden, getStaffSession, unauthorized } from '@/lib/staff-auth'

export async function GET(req: NextRequest) {
  const session = await getStaffSession(req)
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  await initDB()
  const rows = (await sql`
    SELECT id, username, role, display_name, created_at FROM staff_users ORDER BY created_at DESC
  `) as Array<{
    id: number
    username: string
    role: string
    display_name: string
    created_at: Date | string
  }>
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getStaffSession(req)
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  await initDB()
  const body = await req.json()
  const username = String(body.username ?? '').trim()
  const password = String(body.password ?? '')
  const role = String(body.role ?? '')
  const displayName = String(body.displayName ?? body.display_name ?? '').trim()
  if (!username || !password)
    return NextResponse.json({ error: 'Thiếu tài khoản hoặc mật khẩu' }, { status: 400 })
  if (username === 'adminer')
    return NextResponse.json({ error: 'Không tạo trùng tài khoản admin' }, { status: 400 })
  if (role !== 'teacher' && role !== 'school_manager')
    return NextResponse.json({ error: 'Role chỉ được teacher hoặc school_manager' }, { status: 400 })
  try {
    const h = hashPassword(password)
    const rows = (await sql`
      INSERT INTO staff_users (username, password_hash, role, display_name)
      VALUES (${username}, ${h}, ${role}, ${displayName || username})
      RETURNING id, username, role, display_name, created_at
    `) as Array<{
      id: number
      username: string
      role: string
      display_name: string
      created_at: Date | string
    }>
    return NextResponse.json(rows[0])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('unique') || msg.includes('duplicate'))
      return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 })
    return NextResponse.json({ error: msg || 'Lỗi' }, { status: 500 })
  }
}
